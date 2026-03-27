import { FastifyInstance } from 'fastify';
import Stripe from 'stripe';
import { supabaseAdmin } from '../db';

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is missing from environment variables.');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function billingRoutes(server: FastifyInstance) {

    // ── 1. Create Checkout Session (Authenticated) ──────────────────────────
    server.post('/api/billing/checkout', async (req, reply) => {
        const user = (req as any).user;
        if (!user) return reply.code(401).send({ error: 'Unauthorized' });

        const { price_id } = req.body as { price_id: string };
        if (!price_id) return reply.code(400).send({ error: 'price_id is required' });

        try {
            const { data: customerData } = await supabaseAdmin
                .from('stripe_customers')
                .select('stripe_customer_id')
                .eq('organization_id', user.organization_id)
                .single();

            const customerId = customerData?.stripe_customer_id;
            const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

            const session = await stripe.checkout.sessions.create({
                mode: 'subscription',
                payment_method_types: ['card'],
                line_items: [{ price: price_id, quantity: 1 }],
                success_url: `${FRONTEND_URL}/billing?success=true`,
                cancel_url: `${FRONTEND_URL}/billing?canceled=true`,
                client_reference_id: user.organization_id,
                customer_email: customerId ? undefined : user.email,
                customer: customerId,
            });

            return { url: session.url };
        } catch (error: any) {
            server.log.error(error);
            return reply.code(500).send({ error: error.message });
        }
    });

    // ── 1b. Create Checkout Session (Public/New User) ──────────────────────────
    server.post('/api/billing/public-checkout', async (req, reply) => {
        const { price_id, email } = req.body as { price_id: string; email: string };
        if (!email) return reply.code(400).send({ error: 'Email is required for checkout' });
        if (!price_id) return reply.code(400).send({ error: 'price_id is required' });

        try {
            const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

            const session = await stripe.checkout.sessions.create({
                mode: 'subscription',
                payment_method_types: ['card'],
                line_items: [{ price: price_id, quantity: 1 }],
                success_url: `${FRONTEND_URL}/signup?success=true&email=${encodeURIComponent(email)}`,
                cancel_url: `${FRONTEND_URL}/pricing?canceled=true`,
                customer_email: email,
                metadata: { is_new_user: 'true', email }
            });

            return { url: session.url };
        } catch (error: any) {
            server.log.error(error);
            return reply.code(500).send({ error: error.message });
        }
    });

    // ── 2. Create Billing Portal Session ─────────────────────────────────────
    server.post('/api/billing/portal', async (req, reply) => {
        const user = (req as any).user;
        if (!user) return reply.code(401).send({ error: 'Unauthorized' });

        try {
            const { data: customerData } = await supabaseAdmin
                .from('stripe_customers')
                .select('stripe_customer_id')
                .eq('organization_id', user.organization_id)
                .single();

            if (!customerData?.stripe_customer_id) {
                return reply.code(404).send({ error: 'Nenhuma assinatura encontrada nesta conta.' });
            }

            const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

            const session = await stripe.billingPortal.sessions.create({
                customer: customerData.stripe_customer_id,
                return_url: `${FRONTEND_URL}/billing`,
            });

            return { url: session.url };
        } catch (error: any) {
            server.log.error(error);
            return reply.code(500).send({ error: error.message });
        }
    });

    // ── 3. Handle Webhooks securely (raw body required) ──────────────────────
    server.post('/api/webhooks/stripe', { config: { rawBody: true } }, async (req, reply) => {
        const sig = req.headers['stripe-signature'];
        const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

        if (!sig || !endpointSecret) {
            return reply.code(400).send({ error: 'Missing stripe signature or webhook secret' });
        }

        let event: Stripe.Event;

        try {
            event = stripe.webhooks.constructEvent((req as any).rawBody, sig, endpointSecret);
        } catch (err: any) {
            server.log.error('Webhook signature verification failed:', err.message);
            return reply.code(400).send(`Webhook Error: ${err.message}`);
        }

        try {
            switch (event.type) {
                case 'checkout.session.completed': {
                    const session = event.data.object as Stripe.Checkout.Session;
                    let organizationId = session.client_reference_id;
                    const customerId = session.customer as string;
                    const email = session.customer_details?.email || session.metadata?.email;

                    if (!organizationId && email) {
                        server.log.info(`[STRIPE] New user checkout for ${email}. Provisioning...`);

                        const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
                        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
                            data: { source: 'stripe_checkout' },
                            redirectTo: `${FRONTEND_URL}/auth/confirm?next=/dashboard`
                        });

                        if (authError) {
                            if (authError.message.includes('already been registered') || authError.message.includes('already registered')) {
                                server.log.info(`[STRIPE] User ${email} already exists. Sending password reset...`);
                                await supabaseAdmin.auth.resetPasswordForEmail(email, {
                                    redirectTo: `${FRONTEND_URL}/auth/confirm?next=/signup/set-password`
                                });
                            } else {
                                server.log.error(`[STRIPE] Failed to create user: ${authError.message}`);
                            }
                        }

                        // Busca o userId — seja do novo usuário criado ou do existente
                        const newUserId = authData?.user?.id;
                        const existingUserId = newUserId
                            ? undefined
                            : (await supabaseAdmin.from('users').select('id').eq('email', email).single()).data?.id;

                        const userId = newUserId || existingUserId;

                        if (userId) {
                            // Aguarda o trigger handle_new_user criar a org (com retry ao invés de sleep fixo)
                            let orgId: string | undefined;
                            for (let attempt = 0; attempt < 5; attempt++) {
                                await new Promise(r => setTimeout(r, 1000));
                                const { data: orgData } = await supabaseAdmin
                                    .from('user_roles')
                                    .select('organization_id')
                                    .eq('user_id', userId)
                                    .maybeSingle();
                                if (orgData?.organization_id) {
                                    orgId = orgData.organization_id;
                                    break;
                                }
                            }
                            organizationId = orgId ?? null;
                            server.log.info(`[STRIPE] User ${userId} provisioned with Org ${organizationId}`);
                        }
                    }

                    if (organizationId && customerId) {
                        await supabaseAdmin
                            .from('stripe_customers')
                            .upsert({ organization_id: organizationId, stripe_customer_id: customerId });
                    }
                    break;
                }

                case 'customer.subscription.created':
                case 'customer.subscription.updated':
                case 'customer.subscription.deleted': {
                    const subscription = event.data.object as Stripe.Subscription;
                    const customerId = subscription.customer as string;

                    const { data: customerData } = await supabaseAdmin
                        .from('stripe_customers')
                        .select('organization_id')
                        .eq('stripe_customer_id', customerId)
                        .single();

                    if (!customerData) {
                        server.log.warn(`Stripe customer ${customerId} not mapped to any organization.`);
                        break;
                    }

                    await supabaseAdmin.from('subscriptions').upsert({
                        organization_id: customerData.organization_id,
                        stripe_subscription_id: subscription.id,
                        status: subscription.status,
                        price_id: subscription.items?.data?.[0]?.price?.id || '',
                        current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
                        cancel_at_period_end: subscription.cancel_at_period_end,
                        updated_at: new Date().toISOString()
                    });

                    break;
                }
            }
        } catch (error: any) {
            server.log.error({ err: error }, 'Error handling webhook event');
        }

        return reply.code(200).send({ received: true });
    });
}
