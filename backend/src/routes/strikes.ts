import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth';
import type { AuthenticatedRequest } from '../middleware/auth';
import { getAuthSupabase } from '../lib/supabase-auth-client';

export default async function strikesRoutes(server: FastifyInstance) {

    server.get('/api/strikes', { preHandler: [authenticate] }, async (request: AuthenticatedRequest, reply) => {
        const orgId = request.user?.organization_id;
        if (!orgId) {
            return reply.code(403).send({ error: 'User does not belong to an organization' });
        }

        try {
            const supabaseAuth = getAuthSupabase(request);

            const { data, error } = await supabaseAuth
                .from('audit_logs')
                .select(`
                    id,
                    action,
                    reason,
                    member_jid,
                    created_at,
                    groups!inner (
                        name,
                        instances!inner (
                            organization_id
                        )
                    )
                `)
                .eq('groups.instances.organization_id', orgId)
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) {
                server.log.error({ err: error }, 'Error fetching strikes');
                return reply.code(500).send({ error: 'Failed to fetch strike logs' });
            }

            return data.map((log: any) => ({
                id: log.id,
                action: log.action,
                reason: log.reason,
                member_jid: log.member_jid,
                created_at: log.created_at,
                group_name: log.groups?.name || 'Grupo Desconhecido'
            }));
        } catch (error: any) {
            server.log.error({ err: error }, 'Unexpected error in strikes route');
            return reply.code(500).send({ error: 'Internal server error' });
        }
    });
}
