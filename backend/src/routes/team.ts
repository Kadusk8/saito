import { FastifyInstance } from 'fastify';
import { supabaseAdmin } from '../db';
import { authenticate, activeSubscriptionRequired } from '../middleware/auth';
import type { AuthenticatedRequest } from '../middleware/auth';
import { checkTeamMemberLimit } from '../services/billing-limits';

export default async function teamRoutes(server: FastifyInstance) {

    // Convida um novo membro para a organização via email
    server.post('/api/team/invite', { preHandler: [activeSubscriptionRequired] }, async (request: AuthenticatedRequest, reply) => {
        const { email } = request.body as { email?: string };
        const orgId = request.user?.organization_id;

        if (!email || !email.includes('@')) {
            return reply.code(400).send({ error: 'Email inválido' });
        }

        if (!orgId) {
            return reply.code(403).send({ error: 'Usuário não pertence a nenhuma organização' });
        }

        const limitCheck = await checkTeamMemberLimit(orgId, request.user?.subscription);
        if (!limitCheck.allowed) {
            return reply.code(402).send({ error: limitCheck.reason });
        }

        const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

        const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            data: { organization_id: orgId, source: 'team_invite' },
            redirectTo: `${FRONTEND_URL}/auth/confirm?next=/dashboard`
        });

        if (error) {
            if (error.message.includes('already been registered') || error.message.includes('already registered')) {
                return reply.code(409).send({ error: 'Este email já possui uma conta no Saito.' });
            }
            server.log.error({ err: error }, 'Failed to invite team member');
            return reply.code(500).send({ error: 'Falha ao enviar convite' });
        }

        // Vincula o novo usuário à organização
        if (data.user?.id) {
            await supabaseAdmin.from('user_roles').insert({
                user_id: data.user.id,
                organization_id: orgId,
                role: 'member'
            });
        }

        return { success: true, message: `Convite enviado para ${email}` };
    });

    // Lista membros da organização
    server.get('/api/team/members', { preHandler: [authenticate] }, async (request: AuthenticatedRequest, reply) => {
        const orgId = request.user?.organization_id;

        if (!orgId) {
            return reply.code(403).send({ error: 'Usuário não pertence a nenhuma organização' });
        }

        const { data, error } = await supabaseAdmin
            .from('user_roles')
            .select('user_id, role, created_at')
            .eq('organization_id', orgId);

        if (error) {
            server.log.error({ err: error }, 'Failed to fetch team members');
            return reply.code(500).send({ error: 'Falha ao buscar membros' });
        }

        // Busca emails dos usuários
        const userIds = data.map((r: any) => r.user_id);
        const members = await Promise.all(
            userIds.map(async (uid: string) => {
                const { data: userData } = await supabaseAdmin.auth.admin.getUserById(uid);
                return {
                    user_id: uid,
                    email: userData.user?.email,
                    role: data.find((r: any) => r.user_id === uid)?.role,
                    created_at: data.find((r: any) => r.user_id === uid)?.created_at
                };
            })
        );

        return members;
    });
}
