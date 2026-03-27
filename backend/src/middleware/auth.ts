import type { FastifyRequest, FastifyReply } from 'fastify';
import { supabase, redisConnection as redis } from '../db';

export interface UserSubscription {
    status: string;
    price_id: string;
    current_period_end: string;
}

export interface AuthUser {
    id: string;
    email?: string | undefined;
    organization_id?: string | undefined;
    subscription?: UserSubscription | null | undefined;
}

export interface AuthenticatedRequest extends FastifyRequest {
    user?: AuthUser;
}

const AUTH_CACHE_TTL_SECONDS = 120;

function authCacheKey(userId: string): string {
    return `auth_context:${userId}`;
}

export async function authenticate(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            request.log.warn('Authentication failed: Missing or invalid authorization header');
            return reply.code(401).send({ error: 'Unauthorized: Missing token' });
        }

        const token = authHeader.split(' ')[1];

        // Valida o token com o servidor Supabase Auth (mais seguro que decodificar localmente)
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            request.log.warn(`Authentication failed: ${error?.message || 'Invalid token'}`);
            return reply.code(401).send({ error: 'Unauthorized: Invalid token' });
        }

        // Tenta carregar org_id + subscription do cache Redis para evitar 2 queries extras
        const cacheKey = authCacheKey(user.id);
        const cached = await redis.get(cacheKey);

        if (cached) {
            const { organization_id, subscription } = JSON.parse(cached);
            request.user = { id: user.id, email: user.email, organization_id, subscription };
            return;
        }

        // Cache miss — busca org_id no banco
        const { data: orgMapping, error: orgError } = await supabase
            .from('user_roles')
            .select('organization_id')
            .eq('user_id', user.id)
            .limit(1)
            .single();

        if (orgError) {
            request.log.warn({ userId: user.id, err: orgError }, 'Failed to fetch org mapping');
        }

        // Busca status da assinatura via RPC (bypass RLS)
        let subscriptionData: UserSubscription | null = null;
        if (orgMapping?.organization_id) {
            const { data: subData, error: subError } = await supabase
                .rpc('check_subscription_status', { org_id: orgMapping.organization_id })
                .maybeSingle();

            if (subError) {
                request.log.warn({ orgId: orgMapping.organization_id, err: subError }, 'Failed to fetch subscription');
            } else {
                subscriptionData = subData as UserSubscription | null;
            }
        }

        const context = {
            organization_id: orgMapping?.organization_id,
            subscription: subscriptionData,
        };

        // Armazena no cache por 2 minutos
        await redis.set(cacheKey, JSON.stringify(context), 'EX', AUTH_CACHE_TTL_SECONDS);

        request.user = {
            id: user.id,
            email: user.email,
            ...context,
        };

    } catch (err: any) {
        request.log.error({ err }, 'Unexpected authentication error');
        return reply.code(401).send({ error: 'Unauthorized' });
    }
}

// Middleware que exige assinatura ativa ou em trial
export async function activeSubscriptionRequired(request: AuthenticatedRequest, reply: FastifyReply) {
    await authenticate(request, reply);
    if (reply.sent) return;

    if (!request.user?.subscription) {
        return reply.code(402).send({ error: 'Payment Required: No active subscription found for this organization.' });
    }

    const { status, current_period_end } = request.user.subscription;

    if (status !== 'active' && status !== 'trialing') {
        return reply.code(402).send({ error: `Payment Required: Your subscription is currently ${status}.` });
    }

    if (new Date(current_period_end).getTime() < Date.now()) {
        return reply.code(402).send({ error: 'Payment Required: Your subscription period has ended.' });
    }
}
