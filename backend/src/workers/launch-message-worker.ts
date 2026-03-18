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

async function sendToEvolution(instanceName: string, payload: any) {
    const type = payload.type;
    let endpoint = '';
    let body: any = { number: payload.number };

    switch (type) {
        case 'text':
            endpoint = `/message/sendText/${instanceName}`;
            body.text = payload.text;
            break;
        case 'image':
            endpoint = `/message/sendMedia/${instanceName}`;
            body = { number: payload.number, mediatype: 'image', media: payload.url, caption: payload.caption };
            break;
        case 'video':
            endpoint = `/message/sendMedia/${instanceName}`;
            body = { number: payload.number, mediatype: 'video', media: payload.url, caption: payload.caption };
            break;
        case 'audio':
            endpoint = `/message/sendWhatsAppAudio/${instanceName}`;
            body = { number: payload.number, audio: payload.url };
            break;
        case 'document':
            endpoint = `/message/sendMedia/${instanceName}`;
            body = { number: payload.number, mediatype: 'document', media: payload.url, caption: payload.caption };
            break;
        default:
            throw new Error(`Unknown message type: ${type}`);
    }

    const res = await fetch(`${EVOLUTION_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'apikey': EVOLUTION_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    return (await res.json()) as any;
}

// ── BullMQ Worker: send-scheduled-message ─────────────────────────────────────
new Worker('launch-messages', async (job) => {
    const { message_id, campaign_id } = job.data;

    // Fetch message
    const { data: msg } = await supabase
        .from('launch_messages')
        .select('*')
        .eq('id', message_id)
        .single();

    if (!msg || msg.status !== 'pending') return;

    // Fetch campaign + groups + instance
    const { data: campaign } = await supabase
        .from('launch_campaigns')
        .select('*, instance:instances(name), launch_groups(*)')
        .eq('id', campaign_id)
        .single();

    if (!campaign) return;

    const instanceName = campaign.instance.name;
    // Send to ALL groups in the campaign
    const groups: any[] = campaign.launch_groups || [];

    for (const group of groups) {
        try {
            // Humanize: send "typing" indicator for 10 seconds before message
            if (msg.humanize) {
                await fetch(`${EVOLUTION_URL}/chat/sendPresence/${instanceName}`, {
                    method: 'POST',
                    headers: { 'apikey': EVOLUTION_KEY, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ number: group.group_jid, options: { presence: 'composing', delay: 10000 } }),
                });
                await new Promise(r => setTimeout(r, 10000));
            }

            const payload: any = {
                type: msg.content_type,
                number: group.group_jid,
                text: msg.content,
                url: msg.media_url,
                caption: msg.caption,
            };

            await sendToEvolution(instanceName, payload);
        } catch (e: any) {
            console.error(`[launch-message-worker] Error sending to ${group.group_jid}:`, e.message);
        }
    }

    // Mark message as sent
    await supabase.from('launch_messages').update({
        status: 'sent',
        sent_at: new Date().toISOString()
    }).eq('id', message_id);

    console.log(`✅ [launch-message-worker] Sent scheduled message ${message_id}`);
}, { connection: redisConnection });

console.log('🚀 Launch Message Worker started');
