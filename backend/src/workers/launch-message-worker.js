"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const redisConnection = new ioredis_1.default({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: null,
});
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const EVOLUTION_URL = process.env.EVOLUTION_URL || 'http://localhost:8080';
const EVOLUTION_KEY = process.env.EVOLUTION_GLOBAL_KEY || 'global-api-key';
async function sendToEvolution(instanceName, payload) {
    const type = payload.type;
    let endpoint = '';
    let body = { number: payload.number };
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
    return (await res.json());
}
// ── BullMQ Worker: send-scheduled-message ─────────────────────────────────────
new bullmq_1.Worker('launch-messages', async (job) => {
    const { message_id, campaign_id } = job.data;
    // Fetch message
    const { data: msg } = await supabase
        .from('launch_messages')
        .select('*')
        .eq('id', message_id)
        .single();
    if (!msg || msg.status !== 'pending')
        return;
    // Fetch campaign + groups + instance
    const { data: campaign } = await supabase
        .from('launch_campaigns')
        .select('*, instance:instances(name), launch_groups(*)')
        .eq('id', campaign_id)
        .single();
    if (!campaign)
        return;
    const instanceName = campaign.instance.name;
    // Send to ALL groups in the campaign
    const groups = campaign.launch_groups || [];
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
            const payload = {
                type: msg.content_type,
                number: group.group_jid,
                text: msg.content,
                url: msg.media_url,
                caption: msg.caption,
            };
            await sendToEvolution(instanceName, payload);
        }
        catch (e) {
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
//# sourceMappingURL=launch-message-worker.js.map