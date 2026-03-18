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
// ── BullMQ Worker: scarcity-pulse ─────────────────────────────────────────────
new bullmq_1.Worker('launch-scarcity', async (job) => {
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
    const groups = campaign.launch_groups || [];
    // Calculate total capacity and filled slots
    const totalCapacity = groups.length * campaign.overflow_limit;
    const totalFilled = groups.reduce((sum, g) => sum + (g.member_count || 0), 0);
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
        }
        catch (e) {
            console.error(`[scarcity-worker] Error sending to ${group.group_jid}:`, e.message);
        }
    }
}, { connection: redisConnection });
console.log('🚀 Launch Scarcity Worker started');
//# sourceMappingURL=launch-scarcity-worker.js.map