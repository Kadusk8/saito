"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const rate_limit_1 = __importDefault(require("@fastify/rate-limit"));
const db_1 = require("./db");
const super_grupos_1 = require("./super-grupos");
const planner_1 = require("./planner");
const billing_1 = __importDefault(require("./routes/billing"));
const strikes_1 = __importDefault(require("./routes/strikes"));
const ai_1 = __importDefault(require("./routes/ai"));
const instances_1 = __importDefault(require("./routes/instances"));
const fastify_raw_body_1 = __importDefault(require("fastify-raw-body"));
const server = (0, fastify_1.default)({ logger: true, bodyLimit: 52428800 }); // 50MB limit for media uploads
server.register(cors_1.default, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
});
// Configure Global Rate Limiting
server.register(rate_limit_1.default, {
    max: 100, // default max 100 requests
    timeWindow: '1 minute', // per minute
    errorResponseBuilder: function (request, context) {
        return {
            statusCode: 429,
            error: 'Too Many Requests',
            message: `I beg your pardon, but you only have ${context.max} requests per ${context.after} to this API.`
        };
    }
});
// Needed for Stripe Webhooks securely parsing raw bodies
server.register(fastify_raw_body_1.default, {
    field: 'rawBody', // the field that will contain the raw body buffer
    global: false, // add the rawBody to specific routes only
    encoding: 'utf8',
    runFirst: true
});
// Register billing routes
server.register(billing_1.default);
// Register strikes routes
server.register(strikes_1.default);
// Register AI routes
server.register(ai_1.default);
// Basic Webhook route to receive Evolution API payloads
server.post('/webhooks/evolution', async (request, reply) => {
    const payload = request.body;
    server.log.info({ payload }, 'Received webhook');
    // Here we'll dispatch to BullMQ to avoid holding up the Evolution API request
    await db_1.messageQueue.add('handle-message', payload);
    return { status: 'received' };
});
(0, instances_1.default)(server, db_1.evolution);
// Route to delete a Monitored Group
server.delete('/api/groups/:id', async (request, reply) => {
    try {
        const { id } = request.params;
        if (!id)
            return reply.code(400).send({ error: 'Group ID required' });
        server.log.info(`Deleting Monitored Group: ${id}`);
        const { error } = await db_1.supabase.from('groups').delete().eq('id', id);
        if (error)
            throw error;
        return { success: true, message: `Group ${id} deleted successfully` };
    }
    catch (error) {
        server.log.error(error);
        return reply.code(500).send({ error: error.message || 'Failed to delete group' });
    }
});
// ─── Super Grupos Routes ─────────────────────────────────────────────────────
(0, super_grupos_1.superGruposRoutes)(server, db_1.supabase, db_1.evolution, db_1.redisConnection);
(0, planner_1.plannerRoutes)(server, db_1.supabase, db_1.redisConnection);
const start = async () => {
    try {
        const port = parseInt(process.env.PORT || '3001');
        await server.listen({ port, host: '::', ipv6Only: false });
        console.log(`🚀 Saito Backend Worker listening on http://localhost:${port}`);
    }
    catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};
start();
//# sourceMappingURL=index.js.map