import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const redisConnection = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: null,
}) as any;

const supabase = createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_ANON_KEY as string
);

const EVOLUTION_URL = process.env.EVOLUTION_URL || 'http://localhost:8080';
const EVOLUTION_KEY = process.env.EVOLUTION_GLOBAL_KEY || 'global-api-key';

// ── BullMQ Worker: scarcity-pulse ─────────────────────────────────────────────
new Worker('launch-scarcity', async (job) => {
    const { campaign_id } = job.data;

    // Fetch campaign + groups + instance
    const { data: campaign } = await supabase
        .from('launch_campaigns')
        .select('*, instance:instances(name), launch_groups(*)')
        .eq('id', campaign_id)
        .eq('scarcity_enabled', true)
        .single();

    if (!campaign) {
        console.log(`[scarcity-worker] Campaign ${campaign_id} not found or scarcity disabled, skipping`);
        return;
    }

    const instanceName = campaign.instance.name;
    const groups: any[] = campaign.launch_groups || [];

    // Calculate total capacity and filled slots
    const totalCapacity = groups.length * campaign.overflow_limit;
    const totalFilled = groups.reduce((sum: number, g: any) => sum + (g.member_count || 0), 0);
    const percentFilled = totalCapacity > 0 ? Math.round((totalFilled / totalCapacity) * 100) : 0;
    const remaining = totalCapacity - totalFilled;

    const scarcityMessages = [
        `🔴 *VAGAS PREENCHENDO RÁPIDO!*\n\n📊 ${percentFilled}% das vagas já foram preenchidas.\nRestam apenas *${remaining} vagas* com o desconto especial!\n\n⚡ Garanta a sua agora antes que acabe!`,
        `⏰ *ATUALIZAÇÃO DE VAGAS*\n\n${totalFilled} pessoas já entraram para o grupo!\n\nAinda cabem *${remaining} pessoas* com o preço de lançamento.\n\n→ Quem chegar depois paga o preço cheio.`,
        `🎯 *Só ${remaining} vagas restantes!*\n\nSua vaga está garantida?\n\n${percentFilled}% já preenchido! Corra!`,
    ];

    // Pick a random scarcity message
    const msg = scarcityMessages[Math.floor(Math.random() * scarcityMessages.length)];

    // Send to ALL groups
    for (const group of groups) {
        try {
            await fetch(`${EVOLUTION_URL}/message/sendText/${instanceName}`, {
                method: 'POST',
                headers: { 'apikey': EVOLUTION_KEY, 'Content-Type': 'application/json' },
                body: JSON.stringify({ number: group.group_jid, text: msg }),
            });
            console.log(`✅ [scarcity-worker] Sent scarcity message to ${group.group_name}`);
        } catch (e: any) {
            console.error(`[scarcity-worker] Error sending to ${group.group_jid}:`, e.message);
        }
    }
}, { connection: redisConnection });

console.log('🚀 Launch Scarcity Worker started');
