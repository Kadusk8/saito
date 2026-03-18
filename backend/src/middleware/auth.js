"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.activeSubscriptionRequired = activeSubscriptionRequired;
const db_1 = require("../db");
async function authenticate(request, reply) {
    try {
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            request.log.warn('Authentication failed: Missing or invalid authorization header');
            return reply.code(401).send({ error: 'Unauthorized: Missing token' });
        }
        const token = authHeader.split(' ')[1];
        // Verify token with Supabase Auth
        // Using getUser() is the most secure way as it validates with the Supabase auth server
        const { data: { user }, error } = await db_1.supabase.auth.getUser(token);
        if (error || !user) {
            request.log.warn(`Authentication failed: ${error?.message || 'Invalid token'}`);
            return reply.code(401).send({ error: 'Unauthorized: Invalid token' });
        }
        console.log(`[AUTH] User: ${user.email} (${user.id})`);
        // Fetch User's Organization ID mapping
        const { data: orgMapping, error: orgError } = await db_1.supabase
            .from('user_roles')
            .select('organization_id')
            .eq('user_id', user.id)
            .limit(1)
            .single();
        if (orgError) {
            console.error(`[AUTH] Org Mapping Error for user ${user.id}:`, orgError);
        }
        else {
            console.log(`[AUTH] Org ID Found: ${orgMapping?.organization_id}`);
        }
        // Fetch Subscription Status using RPC to bypass RLS
        let subscriptionData = null;
        if (orgMapping?.organization_id) {
            console.log(`[AUTH] Fetching subscription for org: ${orgMapping.organization_id} via RPC`);
            const { data: subData, error: subError } = await db_1.supabase
                .rpc('check_subscription_status', { org_id: orgMapping.organization_id })
                .maybeSingle();
            if (subError) {
                console.error(`[AUTH] Subscription RPC Error for org ${orgMapping.organization_id}:`, subError);
            }
            else {
                console.log(`[AUTH] Subscription Found via RPC:`, subData);
            }
            subscriptionData = subData;
        }
        request.user = {
            id: user.id,
            email: user.email,
            organization_id: orgMapping?.organization_id,
            subscription: subscriptionData
        };
    }
    catch (err) {
        request.log.error(`Authentication error: ${err.message}`);
        return reply.code(401).send({ error: 'Unauthorized' });
    }
}
// Middleware to strictly enforce an active or trialing subscription
async function activeSubscriptionRequired(request, reply) {
    // Rely on the base authentication first
    await authenticate(request, reply);
    if (reply.sent)
        return;
    if (!request.user?.subscription) {
        return reply.code(402).send({ error: 'Payment Required: No active subscription found for this organization.' });
    }
    const { status, current_period_end } = request.user.subscription;
    // Allow 'active' and 'trialing' statuses
    if (status !== 'active' && status !== 'trialing') {
        return reply.code(402).send({ error: `Payment Required: Your subscription is currently ${status}.` });
    }
    // Check expiration date explicitly just in case webhooks lagged
    if (new Date(current_period_end).getTime() < Date.now()) {
        return reply.code(402).send({ error: 'Payment Required: Your subscription period has ended.' });
    }
}
//# sourceMappingURL=auth.js.map