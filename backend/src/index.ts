import 'dotenv/config';
import fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { supabase, redisConnection, messageQueue, evolution } from './db';
import { superGruposRoutes } from './super-grupos';
import { plannerRoutes } from './planner';
import billingRoutes from './routes/billing';
import strikesRoutes from './routes/strikes';
import aiRoutes from './routes/ai';
import instanceRoutes from './routes/instances';
import { authenticate } from './middleware/auth';
import type { AuthenticatedRequest } from './middleware/auth';
import rawBody from 'fastify-raw-body';

const server = fastify({ logger: true, bodyLimit: 52428800 }); // 50MB limit for media uploads

const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL]
  : ['http://localhost:3000'];

server.register(cors, {
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
});

// Configure Global Rate Limiting
server.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
  errorResponseBuilder: function (_request, context) {
    return {
      statusCode: 429,
      error: 'Too Many Requests',
      message: `I beg your pardon, but you only have ${context.max} requests per ${context.after} to this API.`
    }
  }
});

// Needed for Stripe Webhooks securely parsing raw bodies
server.register(rawBody, {
  field: 'rawBody', // the field that will contain the raw body buffer
  global: false, // add the rawBody to specific routes only
  encoding: 'utf8',
  runFirst: true
});

// Register billing routes
server.register(billingRoutes);
// Register strikes routes
server.register(strikesRoutes);
// Register AI routes
server.register(aiRoutes);

// Basic Webhook route to receive Evolution API payloads
server.post('/webhooks/evolution', async (request) => {
  const payload = request.body as any;
  server.log.info({ payload }, 'Received webhook');

  await messageQueue.add('handle-message', payload);

  return { status: 'received' };
});



instanceRoutes(server, evolution);

// Route to delete a Monitored Group
server.delete('/api/groups/:id', { preHandler: [authenticate] }, async (request: AuthenticatedRequest, reply) => {
  try {
    const { id } = request.params as { id: string };
    if (!id) return reply.code(400).send({ error: 'Group ID required' });

    server.log.info(`Deleting Monitored Group: ${id}`);

    const { error } = await supabase.from('groups').delete().eq('id', id);
    if (error) throw error;

    return { success: true, message: `Group ${id} deleted successfully` };
  } catch (error: any) {
    server.log.error(error);
    return reply.code(500).send({ error: error.message || 'Failed to delete group' });
  }
});

// ─── Super Grupos Routes ─────────────────────────────────────────────────────
superGruposRoutes(server, supabase, evolution, redisConnection);
plannerRoutes(server, supabase, redisConnection);


const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3001');
    await server.listen({ port, host: '::', ipv6Only: false });
    console.log(`🚀 Saito Backend Worker listening on http://localhost:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
