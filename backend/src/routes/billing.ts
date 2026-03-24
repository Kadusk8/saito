import { FastifyInstance } from 'fastify';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

const supabase = createClient(
    process.env.SUPABASE_URL as string,
    (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY) as string
);

export default async function billingRoutes(server: FastifyInstance) {

    // ── 1. Create Checkout Session (Authenticated) ──────────────────────────
    server.post('/api/billing/checkout', async (req, reply) => {
        const user = (req as any).user;
        if (!user) return reply.code(401).send({ error: 'Unauthorized' });

        const { price_id } = req.body as { price_id: string };

        try {
            const { data: customerData } = await supabase
                .from('stripe_customers')
                .select('stripe_customer_id')
                .eq('organization_id', user.organization_id)
                .single();

            let customerId = customerData?.stripe_customer_id;
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

        try {
            const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

            const session = await stripe.checkout.sessions.create({
                mode: 'subscription',
                payment_method_types: ['card'],
                line_items: [{ price: price_id, quantity: 1 }],
                success_url: `${FRONTEND_URL}/signup?success=true&email=${encodeURIComponent(email)}`,
                cancel_url: `${FRONTEND_URL}/pricing?canceled=true`,
                customer_email: email,
                metadata: {
                    is_new_user: 'true',
                    email: email
                }
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
            const { data: customerData } = await supabase
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

        let event: Stripe.Event;

        try {
            // Using fastify-raw-body to get the exact raw buffer for signature verification
            event = stripe.webhooks.constructEvent((req as any).rawBody, sig as string, endpointSecret as string);
        } catch (err: any) {
            server.log.error(`⚠️ Webhook signature verification failed.`, err.message);
            return reply.code(400).send(`Webhook Error: ${err.message}`);
        }

        try {
            switch (event.type) {
                case 'checkout.session.completed': {
                    const session = event.data.object as Stripe.Checkout.Session;
                    let organizationId = session.client_reference_id;
                    const customerId = session.customer as string;
                    const email = session.customer_details?.email || session.metadata?.email;

                    // Handle New User Provisioning
                    if (!organizationId && email) {
                        server.log.info(`[STRIPE] New user checkout detected for ${email}. Provisioning...`);
                        
                        // 1. Try to invite the user (sends email via Resend automatically)
                        const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
                        const { data: authData, error: authError } = await supabase.auth.admin.inviteUserByEmail(email, {
                            data: { source: 'stripe_checkout' },
                            redirectTo: `${FRONTEND_URL}/auth/confirm?next=/dashboard`
                        });

                        if (authError) {
                            if (authError.message.includes('already been registered') || authError.message.includes('already registered')) {
                                // User already exists — send a magic link so they can access immediately
                                server.log.info(`[STRIPE] User ${email} already exists. Sending magic link...`);
                                await supabase.auth.admin.generateLink({
                                    type: 'magiclink',
                                    email: email,
                                });
                                // Supabase sends the magic link email automatically via SMTP/Resend
                            } else {
                                server.log.error(`[STRIPE] Failed to create user: ${authError.message}`);
                            }
                        }

                        // Get user ID (either newly created or existing)
                        const userId = authData?.user?.id || 
                            (await supabase.from('users').select('id').eq('email', email).single()).data?.id;
                        
                        if (userId) {
                            // Wait for DB trigger to create the org (handle_new_user)
                            await new Promise(resolve => setTimeout(resolve, 1500));
                            
                            const { data: orgData } = await supabase
                                .from('users_organizations')
                                .select('organization_id')
                                .eq('user_id', userId)
                                .maybeSingle();
                            
                            organizationId = orgData?.organization_id;
                            server.log.info(`[STRIPE] User ${userId} provisioned with Org ${organizationId}`);
                        }
                    }

                    if (organizationId && customerId) {
                        await supabase
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

                    // Find the organization mapped to this Stripe customer
                    const { data: customerData } = await supabase
                        .from('stripe_customers')
                        .select('organization_id')
                        .eq('stripe_customer_id', customerId)
                        .single();

                    if (!customerData) {
                        server.log.warn(`Stripe customer ${customerId} not mapped to any organization.`);
                        break;
                    }

                    // Upsert subscription data
                    await supabase.from('subscriptions').upsert({
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
            server.log.error('Error handling webhook event:', error);
            // Non-fatal, just log it. Acknowledge the webhook so Stripe doesn't retry forever.
        }

        return reply.code(200).send({ received: true });
    });
}
