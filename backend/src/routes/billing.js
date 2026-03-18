"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = billingRoutes;
const stripe_1 = __importDefault(require("stripe"));
const supabase_js_1 = require("@supabase/supabase-js");
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY);
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY));
async function billingRoutes(server) {
    // ── 1. Create Checkout Session ───────────────────────────────────────────
    server.post('/api/billing/checkout', async (req, reply) => {
        const user = req.user;
        if (!user)
            return reply.code(401).send({ error: 'Unauthorized' });
        const { price_id } = req.body;
        try {
            // Check if organization already has an active Stripe Customer mapped
            const { data: customerData } = await supabase
                .from('stripe_customers')
                .select('stripe_customer_id')
                .eq('organization_id', user.organization_id)
                .single();
            let customerId = customerData?.stripe_customer_id;
            const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
            // Create checkout session
            const sessionParams = {
                mode: 'subscription',
                payment_method_types: ['card'],
                line_items: [{ price: price_id, quantity: 1 }],
                success_url: `${FRONTEND_URL}/billing?success=true`,
                cancel_url: `${FRONTEND_URL}/billing?canceled=true`,
                client_reference_id: user.organization_id, // Pass our DB ID so the webhook knows who paid
                customer_email: customerId ? undefined : user.email,
                customer: customerId,
            };
            const session = await stripe.checkout.sessions.create(sessionParams);
            return { url: session.url };
        }
        catch (error) {
            server.log.error(error);
            return reply.code(500).send({ error: error.message });
        }
    });
    // ── 2. Create Billing Portal Session ─────────────────────────────────────
    server.post('/api/billing/portal', async (req, reply) => {
        const user = req.user;
        if (!user)
            return reply.code(401).send({ error: 'Unauthorized' });
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
        }
        catch (error) {
            server.log.error(error);
            return reply.code(500).send({ error: error.message });
        }
    });
    // ── 3. Handle Webhooks securely (raw body required) ──────────────────────
    server.post('/api/webhooks/stripe', { config: { rawBody: true } }, async (req, reply) => {
        const sig = req.headers['stripe-signature'];
        const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
        let event;
        try {
            // Using fastify-raw-body to get the exact raw buffer for signature verification
            event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
        }
        catch (err) {
            server.log.error(`⚠️ Webhook signature verification failed.`, err.message);
            return reply.code(400).send(`Webhook Error: ${err.message}`);
        }
        try {
            switch (event.type) {
                case 'checkout.session.completed': {
                    const session = event.data.object;
                    const organizationId = session.client_reference_id;
                    const customerId = session.customer;
                    if (organizationId && customerId) {
                        // Insert or Update the stripe_customers mapping
                        await supabase
                            .from('stripe_customers')
                            .upsert({ organization_id: organizationId, stripe_customer_id: customerId });
                    }
                    break;
                }
                case 'customer.subscription.created':
                case 'customer.subscription.updated':
                case 'customer.subscription.deleted': {
                    const subscription = event.data.object;
                    const customerId = subscription.customer;
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
                        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                        cancel_at_period_end: subscription.cancel_at_period_end,
                        updated_at: new Date().toISOString()
                    });
                    break;
                }
            }
        }
        catch (error) {
            server.log.error('Error handling webhook event:', error);
            // Non-fatal, just log it. Acknowledge the webhook so Stripe doesn't retry forever.
        }
        return reply.code(200).send({ received: true });
    });
}
//# sourceMappingURL=billing.js.map