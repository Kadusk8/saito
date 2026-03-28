import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { supabase, redisConnection as redis } from '../db';
import { authenticate } from '../middleware/auth';
import type { AuthenticatedRequest } from '../middleware/auth';

export default async function groupsRoutes(server: FastifyInstance) {

    // Salva regras do grupo e invalida o cache Redis imediatamente
    server.put('/api/groups/:id/rules', { preHandler: [authenticate] }, async (request: AuthenticatedRequest, reply) => {
        const rulesSchema = z.object({
            rules: z.object({
                moderationEnabled: z.boolean().optional(),
                blockLinks: z.boolean().optional(),
                blockImage: z.boolean().optional(),
                blockVideo: z.boolean().optional(),
                blockAudio: z.boolean().optional(),
                blockSticker: z.boolean().optional(),
                floodControl: z.boolean().optional(),
                aiBlacklist: z.boolean().optional(),
                enforceTopic: z.boolean().optional(),
                panfleteiroAlert: z.boolean().optional(),
                topic: z.string().optional(),
            }),
            blacklist: z.array(z.string()).optional(),
        });

        const { id } = request.params as { id: string };

        try {
            const body = rulesSchema.parse(request.body);

            // Busca o grupo garantindo que pertence à org do usuário
            const { data: group, error: fetchError } = await supabase
                .from('groups')
                .select('id, jid, instances!inner(name, organization_id)')
                .eq('id', id)
                .single();

            if (fetchError || !group) {
                return reply.code(404).send({ error: 'Grupo não encontrado' });
            }

            const inst = group.instances as any;
            if (inst?.organization_id !== request.user?.organization_id) {
                return reply.code(403).send({ error: 'Forbidden' });
            }

            // Salva as regras no banco
            const { error: updateError } = await supabase
                .from('groups')
                .update({
                    rules: body.rules,
                    ...(body.blacklist !== undefined && { blacklist: body.blacklist }),
                })
                .eq('id', id);

            if (updateError) throw updateError;

            // Invalida o cache Redis para que as novas regras entrem em vigor imediatamente
            const cacheKey = `group_rules:${inst.name}:${group.jid}`;
            await redis.del(cacheKey);

            server.log.info(`[GROUPS] Rules updated and cache invalidated for group ${id}`);
            return { success: true };

        } catch (error: any) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({ error: 'Validation Error', details: error.issues });
            }
            server.log.error({ err: error }, '[GROUPS] Failed to save rules');
            return reply.code(500).send({ error: error.message || 'Failed to save rules' });
        }
    });
}
