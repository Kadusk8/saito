import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import Redis from 'ioredis';
import { Queue } from 'bullmq';
import { EvolutionAPI } from './services/evolution';

// Supabase Setup
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  throw new Error('Supabase environment variables (URL/ANON_KEY) are missing!');
}

// Client com anon key — usado com tokens de usuário via RLS
export const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_ANON_KEY as string
);

// Client com service role — bypass de RLS para operações server-side (webhooks, workers)
// NUNCA exponha este client para o usuário final
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL as string,
  (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY) as string
);

// Redis Setup
export const redisConnection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null
}) as any;

// Queues
export const messageQueue = new Queue('message-processing', { connection: redisConnection });

// Evolution API
if (!process.env.EVOLUTION_URL || !process.env.EVOLUTION_GLOBAL_KEY) {
  console.warn('⚠️ Evolution API configuration missing in environment variables.');
}

export const evolution = new EvolutionAPI(
  process.env.EVOLUTION_URL || '',
  process.env.EVOLUTION_GLOBAL_KEY || ''
);
