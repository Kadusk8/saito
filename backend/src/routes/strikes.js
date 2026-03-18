"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = strikesRoutes;
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const supabase_js_1 = require("@supabase/supabase-js");
async function strikesRoutes(server) {
    const getAuthSupabase = (request) => {
        const authHeader = request.headers.authorization;
        const token = authHeader?.split(' ')[1];
        if (!token)
            return db_1.supabase;
        return (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
            global: {
                headers: { Authorization: `Bearer ${token}` }
            }
        });
    };
    server.get('/api/strikes', { preHandler: [auth_1.authenticate] }, async (request, reply) => {
        try {
            const orgId = request.user?.organization_id;
            if (!orgId) {
                return reply.code(403).send({ error: 'User does not belong to an organization' });
            }
            // Fetch audit logs for groups belonging to this organization
            const supabaseAuth = getAuthSupabase(request);
            console.log(`[STRIKES] Fetching logs for Org ID: ${orgId}`);
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
            console.log(`[STRIKES] Query Result: Data Length = ${data?.length || 0}, Error = ${JSON.stringify(error)}`);
            if (error) {
                server.log.error({ err: error }, 'Error fetching strikes');
                return reply.code(500).send({ error: 'Failed to fetch strike logs' });
            }
            // Flatten the response for the frontend
            const formattedData = data.map((log) => ({
                id: log.id,
                action: log.action,
                reason: log.reason,
                member_jid: log.member_jid,
                created_at: log.created_at,
                group_name: log.groups?.name || 'Grupo Desconhecido'
            }));
            return formattedData;
        }
        catch (error) {
            server.log.error('Unexpected error in strikes route:', error);
            return reply.code(500).send({ error: 'Internal server error' });
        }
    });
}
//# sourceMappingURL=strikes.js.map