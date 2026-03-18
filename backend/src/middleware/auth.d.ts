import type { FastifyRequest, FastifyReply } from 'fastify';
export interface AuthenticatedRequest extends FastifyRequest {
    user?: {
        id: string;
        email?: string;
        organization_id?: string;
        subscription?: {
            status: string;
            price_id: string;
            current_period_end: string;
        } | null;
    };
}
export declare function authenticate(request: AuthenticatedRequest, reply: FastifyReply): Promise<undefined>;
export declare function activeSubscriptionRequired(request: AuthenticatedRequest, reply: FastifyReply): Promise<undefined>;
//# sourceMappingURL=auth.d.ts.map