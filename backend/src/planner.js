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
Object.defineProperty(exports, "__esModule", { value: true });
exports.plannerRoutes = plannerRoutes;
const bullmq_1 = require("bullmq");
const ai_service_1 = require("./services/ai-service");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const zod_1 = require("zod");
const auth_1 = require("./middleware/auth");
// ─── Planner Routes ─────────────────────────────────────────────────────────
// Mounts under /api/planner
// Provides: plan CRUD, AI chat (Gemini), timeline generation, and "Consolidar e Executar"
const EVOLUTION_URL = process.env.EVOLUTION_URL || 'http://localhost:8080';
const EVOLUTION_KEY = process.env.EVOLUTION_GLOBAL_KEY || 'global-api-key';
// AIService is used instead of local initialization
// ── Saito Strategist System Prompt ────────────────────────────────────────────
function buildSystemPrompt(productType, strategicManual = '') {
    const nicheMap = {
        infoproduto: 'Foque em Autoridade e Bônus. Gatilhos: "acesso exclusivo", "bônus especial para quem entrar agora", "método validado por X alunos".',
        produto_fisico: 'Foque em Estoque Limitado e Demonstração visual. Gatilhos: "últimas unidades", "veja funcionando ao vivo", "entrega imediata".',
        servico: 'Foque em Exclusividade e Agenda VIP. Gatilhos: "apenas X vagas na agenda", "acesso direto ao especialista", "resultado garantido em X dias".',
    };
    const nicheInstruction = nicheMap[productType] || nicheMap.infoproduto;
    return `VOCÊ É O SAITO STRATEGIST, O AUTOR E ESPECIALISTA DA METODOLOGIA METEÓRICO STARTER.
SUA BÍBLIA É O MANUAL ABAIXO. VOCÊ NÃO RESPONDE NADA QUE DESVIE DESTA ESTRATÉGIA.

--- MANUAL ESTRATÉGICO (METEÓRICO STARTER) ---
${strategicManual || 'Siga as melhores práticas de lançamento meteórico.'}
--- FIM DO MANUAL ---

Você está no "Briefing Room" do Saito. Seu objetivo é extrair as informações necessárias e gerar um plano completo seguindo RIGOROSAMENTE a metodologia acima.

PERSONA:
- Você é um estrategista sênior, confiante, direto e focado em lucro.
- Você usa termos do manual como "Dia D", "Agitação", "Revelação", "Represar desejo".
- Na sua primeira resposta, cite um trecho ou conceito do manual acima para provar que está seguindo a estratégia.

NICHO: ${productType.toUpperCase()}
INSTRUÇÃO DE NICHO: ${nicheInstruction}

REGRAS DE OURO:
1. Conduza a conversa fazendo UMA pergunta por vez. Não sobrecarregue o usuário.
2. Siga o fluxo de 7 dias de seeding e as fases de Terça a Quinta descritas no manual.
3. Quando tiver as informações necessárias (produto, benefício, preço, data), gere o plano completo.
4. Quando gerar o plano completo, inclua o bloco JSON estruturado.
5. Se o usuário falar algo fora de contexto, traga-o de volta para a estratégia Meteórico.

FLUXO DE BRIEFING:
1. Nome do produto
2. Benefício principal / transformação que entrega
3. Preço e condições (à vista / parcelado)
4. Data de abertura do carrinho (Dia D)
5. Gerar timeline e copies

Ao gerar o plano final, finalize sua mensagem com um bloco JSON EXATAMENTE neste formato:
\`\`\`json
{
  "plan_ready": true,
  "product_name": "...",
  "offer_date_description": "...",
  "messages": [
    {
      "phase": "captacao",
      "offset_hours": -168,
      "label": "D-7 • Abertura do Grupo",
      "content": "...",
      "variables": ["{{nome_do_grupo}}", "{{link_checkout}}"]
    }
  ]
}
\`\`\`

Fases e offsets obrigatórios para o JSON:
- dia_d: Abertura (-2h), Meio-dia (0h), Fechamento (+4h), Última chance (+8h)`;
}
async function plannerRoutes(server, supabase, redisConnection) {
    const launchMessageQueue = new bullmq_1.Queue('launch-messages', { connection: redisConnection });
    // ── A. PLANS CRUD ──────────────────────────────────────────────────────────
    // List plans
    server.get('/api/planner', async (_req, reply) => {
        const { data, error } = await supabase
            .from('launch_plans')
            .select('*, instance:instances(id, name), launch_plan_messages(count)')
            .order('created_at', { ascending: false });
        if (error)
            return reply.code(500).send({ error: error.message });
        return data;
    });
    // Create plan (from briefing start — just product_type and instance)
    server.post('/api/planner', { preHandler: [auth_1.activeSubscriptionRequired] }, async (req, reply) => {
        const createPlanSchema = zod_1.z.object({
            product_type: zod_1.z.string().min(1),
            product_name: zod_1.z.string().optional(),
            instance_id: zod_1.z.string().uuid().nullish().or(zod_1.z.literal(''))
        });
        try {
            const body = createPlanSchema.parse(req.body);
            const { product_type, product_name, instance_id } = body;
            // Include organization_id for defense in depth
            const { data, error } = await supabase
                .from('launch_plans')
                .insert({ product_type, product_name: product_name || 'Novo Produto', instance_id, organization_id: req.user?.organization_id })
                .select()
                .single();
            if (error)
                return reply.code(500).send({ error: error.message });
            return reply.code(201).send(data);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                console.error('[POST /api/planner] Zod Error:', error.issues);
                return reply.code(400).send({ error: 'Validation Error', details: error.issues });
            }
            return reply.code(500).send({ error: error.message });
        }
    });
    // Get plan with messages and assets
    server.get('/api/planner/:id', async (req, reply) => {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('launch_plans')
            .select('*, instance:instances(id, name), launch_plan_messages(*), launch_plan_assets(*)')
            .eq('id', id)
            .single();
        if (error)
            return reply.code(404).send({ error: 'Plan not found' });
        return data;
    });
    // Update plan
    server.patch('/api/planner/:id', async (req, reply) => {
        const updatePlanSchema = zod_1.z.object({
            product_name: zod_1.z.string().optional(),
            offer_date: zod_1.z.string().optional(),
            checkout_url: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
            status: zod_1.z.string().optional(),
            briefing_json: zod_1.z.any().optional()
        });
        const { id } = req.params;
        try {
            const body = updatePlanSchema.parse(req.body);
            const { data, error } = await supabase
                .from('launch_plans')
                .update({ ...body, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single();
            if (error)
                return reply.code(500).send({ error: error.message });
            return data;
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return reply.code(400).send({ error: 'Validation Error', details: error.issues });
            }
            return reply.code(500).send({ error: error.message });
        }
    });
    // Delete plan
    server.delete('/api/planner/:id', async (req, reply) => {
        const { id } = req.params;
        const { error } = await supabase.from('launch_plans').delete().eq('id', id);
        if (error)
            return reply.code(500).send({ error: error.message });
        return { success: true };
    });
    // ── B. MESSAGES ────────────────────────────────────────────────────────────
    // Bulk upsert messages (after AI generates full timeline)
    server.post('/api/planner/:id/messages', async (req, reply) => {
        const upsertMessagesSchema = zod_1.z.object({
            messages: zod_1.z.array(zod_1.z.object({
                phase: zod_1.z.string(),
                scheduled_offset_hours: zod_1.z.number(),
                content: zod_1.z.string(),
                variables_used: zod_1.z.array(zod_1.z.string()).optional()
            }))
        });
        const { id } = req.params;
        try {
            const body = upsertMessagesSchema.parse(req.body);
            const { messages } = body;
            // Delete old messages first
            await supabase.from('launch_plan_messages').delete().eq('plan_id', id);
            const rows = messages.map(m => ({
                plan_id: id,
                phase: m.phase,
                scheduled_offset_hours: m.scheduled_offset_hours,
                content: m.content,
                variables_used: m.variables_used || [],
            }));
            const { data, error } = await supabase
                .from('launch_plan_messages')
                .insert(rows)
                .select();
            if (error)
                return reply.code(500).send({ error: error.message });
            return data;
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return reply.code(400).send({ error: 'Validation Error', details: error.issues });
            }
            return reply.code(500).send({ error: error.message });
        }
    });
    // Update a single message
    server.patch('/api/planner/:id/messages/:msgId', async (req, reply) => {
        const { msgId } = req.params;
        const body = req.body;
        const { data, error } = await supabase
            .from('launch_plan_messages')
            .update(body)
            .eq('id', msgId)
            .select()
            .single();
        if (error)
            return reply.code(500).send({ error: error.message });
        return data;
    });
    // Delete a message
    server.delete('/api/planner/:id/messages/:msgId', async (req, reply) => {
        const { msgId } = req.params;
        const { error } = await supabase.from('launch_plan_messages').delete().eq('id', msgId);
        if (error)
            return reply.code(500).send({ error: error.message });
        return { success: true };
    });
    // ── C. ASSETS ──────────────────────────────────────────────────────────────
    server.post('/api/planner/:id/assets', async (req, reply) => {
        const assetSchema = zod_1.z.object({
            asset_type: zod_1.z.string(),
            url: zod_1.z.string(),
            label: zod_1.z.string().optional()
        });
        const { id } = req.params;
        try {
            const body = assetSchema.parse(req.body);
            const { asset_type, url, label } = body;
            // Upsert by asset_type
            const { data: existing } = await supabase
                .from('launch_plan_assets')
                .select('id')
                .eq('plan_id', id)
                .eq('asset_type', asset_type)
                .single();
            let result;
            if (existing) {
                const { data } = await supabase
                    .from('launch_plan_assets')
                    .update({ url, label })
                    .eq('id', existing.id)
                    .select()
                    .single();
                result = data;
            }
            else {
                const { data } = await supabase
                    .from('launch_plan_assets')
                    .insert({ plan_id: id, asset_type, url, label })
                    .select()
                    .single();
                result = data;
            }
            return result;
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return reply.code(400).send({ error: 'Validation Error', details: error.issues });
            }
            return reply.code(500).send({ error: error.message });
        }
    });
    // ── D. AI CHAT ─────────────────────────────────────────────────────────────
    // Stateless endpoint — receives full conversation history, returns next AI message
    server.post('/api/planner/ai-chat', async (req, reply) => {
        const aiChatSchema = zod_1.z.object({
            messages: zod_1.z.array(zod_1.z.object({
                role: zod_1.z.enum(['user', 'model']),
                parts: zod_1.z.array(zod_1.z.object({ text: zod_1.z.string() }))
            })),
            product_type: zod_1.z.string().optional().default('infoproduto'),
            plan_id: zod_1.z.string().uuid().nullish().or(zod_1.z.literal(''))
        });
        try {
            const body = aiChatSchema.parse(req.body);
            const { messages, product_type, plan_id } = body;
            if (!process.env.OPENAI_API_KEY)
                return reply.code(500).send({ error: 'OPENAI_API_KEY not configured' });
            // Load strategic manual
            let strategicManual = '';
            try {
                const manualPath = path.join(__dirname, 'knowledge', 'meteorico-starter.md');
                if (fs.existsSync(manualPath)) {
                    strategicManual = fs.readFileSync(manualPath, 'utf8');
                }
                else {
                    // Absolute path fallback for safety
                    const fallbackPath = '/Users/mac/saito/backend/src/knowledge/meteorico-starter.md';
                    if (fs.existsSync(fallbackPath)) {
                        strategicManual = fs.readFileSync(fallbackPath, 'utf8');
                    }
                }
            }
            catch (err) {
                console.error('[AI Chat] Error loading manual:', err);
            }
            const systemPrompt = buildSystemPrompt(product_type, strategicManual);
            // Fetch additional context if plan_id is provided
            let planContext = '';
            if (plan_id) {
                try {
                    const { data: plan } = await supabase
                        .from('launch_plans')
                        .select('product_name, product_description, briefing_json')
                        .eq('id', plan_id)
                        .single();
                    if (plan) {
                        planContext = `\n--- CONTEXTO DO PLANO ATUAL ---\n` +
                            `Produto: ${plan.product_name || 'Não informado'}\n` +
                            `Descrição: ${plan.product_description || 'Não informada'}\n` +
                            `Dados já coletados: ${JSON.stringify(plan.briefing_json || {})}\n` +
                            `--------------------------------\n`;
                    }
                }
                catch (err) {
                    console.error('[AI Chat] Error fetching plan context:', err);
                }
            }
            let aiResult;
            try {
                aiResult = await ai_service_1.AIService.chat(messages, systemPrompt + '\n' + planContext);
            }
            catch (error) {
                console.error('=== AI GENERATE ERROR ===');
                console.error('Message:', error.message);
                console.error('Details:', error);
                throw error;
            }
            const text = aiResult.text;
            if (!text) {
                console.error('=== AI EMPTY RESPONSE ===', JSON.stringify(aiResult, null, 2));
            }
            // Try to extract JSON plan if present
            let planData = null;
            const jsonMatch = typeof text === 'string' ? text.match(/```json\n([\s\S]*?)\n```/) : null;
            if (jsonMatch && jsonMatch[1]) {
                try {
                    planData = JSON.parse(jsonMatch[1]);
                }
                catch { /* ignore parse errors */ }
            }
            // If plan is ready and we have a plan_id, save the messages to DB
            if (planData?.plan_ready && plan_id && planData.messages) {
                const rows = planData.messages.map((m) => ({
                    plan_id,
                    phase: m.phase,
                    scheduled_offset_hours: m.offset_hours,
                    content: m.content,
                    variables_used: m.variables || [],
                }));
                await supabase.from('launch_plan_messages').delete().eq('plan_id', plan_id);
                await supabase.from('launch_plan_messages').insert(rows);
                if (planData.product_name) {
                    await supabase.from('launch_plans').update({
                        product_name: planData.product_name,
                        briefing_json: messages,
                        status: 'approved',
                        updated_at: new Date().toISOString(),
                    }).eq('id', plan_id);
                }
            }
            return { text, plan_ready: !!planData?.plan_ready, plan: planData };
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                console.error('[POST /api/planner/ai-chat] Zod Error:', error.issues);
                return reply.code(400).send({ error: 'Validation Error', details: error.issues });
            }
            return reply.code(500).send({ error: error.message });
        }
    });
    // AI Refine — refine a specific message copy
    server.post('/api/planner/:id/messages/:msgId/refine', async (req, reply) => {
        const refineSchema = zod_1.z.object({
            instruction: zod_1.z.string().optional()
        });
        const { msgId } = req.params;
        try {
            const body = refineSchema.parse(req.body);
            const { instruction } = body;
            const { data: msg } = await supabase
                .from('launch_plan_messages')
                .select('*, plan:launch_plans(product_type, product_name)')
                .eq('id', msgId)
                .single();
            if (!msg)
                return reply.code(404).send({ error: 'Message not found' });
            if (!process.env.GEMINI_API_KEY)
                return reply.code(500).send({ error: 'GEMINI_API_KEY not configured' });
            const prompt = `Você é um especialista em copywriting para lançamentos no WhatsApp.

Produto: ${msg.plan?.product_name || 'desconhecido'}
Tipo: ${msg.plan?.product_type || 'infoproduto'}
Fase: ${msg.phase}
Copy atual:
"${msg.content}"

${instruction ? `Instrução do usuário: ${instruction}` : 'Refine esta copy para WhatsApp mobile — mais impacto, menos texto, manter o gatilho principal.'}

Responda APENAS com a copy refinada, sem explicações.`;
            const refined = await ai_service_1.AIService.refine(prompt);
            const tooLong = refined.length > 800;
            // Update in DB
            await supabase.from('launch_plan_messages').update({
                content: refined,
                refined_by_ai: true,
            }).eq('id', msgId);
            return { content: refined, too_long_warning: tooLong, original: msg.content };
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return reply.code(400).send({ error: 'Validation Error', details: error.errors });
            }
            return reply.code(500).send({ error: error.message });
        }
    });
    // GET Plan by Campaign ID
    server.get('/api/planner/campaign/:campaignId', async (req, reply) => {
        const { campaignId } = req.params;
        const { data, error } = await supabase
            .from('launch_plans')
            .select('*, launch_plan_messages(*)')
            .eq('campaign_id', campaignId)
            .maybeSingle();
        if (error)
            return reply.code(500).send({ error: error.message });
        if (!data)
            return reply.code(404).send({ error: 'No plan found for this campaign' });
        return data;
    });
    // Apply Plan to Campaign (Schedule messages)
    server.post('/api/planner/plan/:id/apply', async (req, reply) => {
        const { id } = req.params;
        try {
            const { data: plan } = await supabase
                .from('launch_plans')
                .select('*, launch_plan_messages(*)')
                .eq('id', id)
                .single();
            if (!plan)
                return reply.code(404).send({ error: 'Plan not found' });
            if (!plan.campaign_id)
                return reply.code(400).send({ error: 'Plan is not linked to a campaign' });
            if (!plan.offer_date)
                return reply.code(400).send({ error: 'Plan must have an offer_date' });
            // 1. Delete existing scheduled messages for this campaign to avoid duplicates
            await supabase.from('launch_messages').delete().eq('campaign_id', plan.campaign_id);
            // 2. Schedule new messages
            const offerDate = new Date(plan.offer_date).getTime();
            let scheduled = 0;
            for (const msg of (plan.launch_plan_messages || [])) {
                const scheduledAt = new Date(offerDate + msg.scheduled_offset_hours * 60 * 60 * 1000);
                // Only schedule future messages
                if (scheduledAt.getTime() < Date.now())
                    continue;
                let content = msg.content;
                if (plan.checkout_url)
                    content = content.replace(/\{\{link_checkout\}\}/g, plan.checkout_url);
                const { data: dbMsg } = await supabase
                    .from('launch_messages')
                    .insert({
                    campaign_id: plan.campaign_id,
                    content_type: 'text',
                    content,
                    scheduled_at: scheduledAt.toISOString(),
                    humanize: true,
                    status: 'pending'
                })
                    .select()
                    .single();
                if (dbMsg) {
                    const delay = scheduledAt.getTime() - Date.now();
                    await launchMessageQueue.add('send-scheduled-message', { message_id: dbMsg.id, campaign_id: plan.campaign_id }, { delay, jobId: `plan-msg-${dbMsg.id}` });
                    scheduled++;
                }
            }
            // 3. Mark plan as executed
            await supabase.from('launch_plans').update({ status: 'executing' }).eq('id', id);
            return { success: true, messages_scheduled: scheduled };
        }
        catch (error) {
            return reply.code(500).send({ error: error.message });
        }
    });
    // ── E. CONSOLIDAR E EXECUTAR ───────────────────────────────────────────────
    server.post('/api/planner/:id/execute', async (req, reply) => {
        const executeSchema = zod_1.z.object({
            auto_create_groups: zod_1.z.boolean().optional(),
            group_count: zod_1.z.number().int().positive().optional().default(3),
            group_name_pattern: zod_1.z.string().optional(),
            admin_number: zod_1.z.string().optional(),
            overflow_limit: zod_1.z.number().int().positive().optional().default(250)
        });
        const { id } = req.params;
        try {
            const body = executeSchema.parse(req.body);
            const { auto_create_groups, group_count, group_name_pattern, admin_number, overflow_limit } = body;
            const log = [];
            const { data: plan } = await supabase
                .from('launch_plans')
                .select('*, instance:instances(id, name), launch_plan_messages(*), launch_plan_assets(*)')
                .eq('id', id)
                .single();
            if (!plan)
                return reply.code(404).send({ error: 'Plan not found' });
            if (!plan.offer_date)
                return reply.code(400).send({ error: 'Plan must have an offer_date before executing' });
            if (!plan.instance_id)
                return reply.code(400).send({ error: 'Plan must have an instance selected' });
            log.push('✅ Plano validado');
            // Step 1: Create Super Grupos campaign
            const { data: campaign, error: ce } = await supabase
                .from('launch_campaigns')
                .insert({
                name: plan.product_name,
                instance_id: plan.instance_id,
                offer_date: plan.offer_date,
                overflow_limit,
            })
                .select()
                .single();
            if (ce)
                return reply.code(500).send({ error: `Failed to create campaign: ${ce.message}`, log });
            log.push(`✅ Campanha "Super Grupos" criada: ${campaign.id}`);
            // Step 2: Create groups (auto or none — user can add later)
            const instanceName = plan.instance?.name;
            let groupsCreated = 0;
            if (auto_create_groups && instanceName) {
                const namePattern = group_name_pattern || `${plan.product_name} {n}`;
                const participants = admin_number ? [`${admin_number}@s.whatsapp.net`] : [];
                let orderStart = 0;
                for (let n = 1; n <= group_count; n++) {
                    const groupName = namePattern.replace('{n}', String(n));
                    try {
                        const res = await fetch(`${EVOLUTION_URL}/group/create/${instanceName}`, {
                            method: 'POST',
                            headers: { 'apikey': EVOLUTION_KEY, 'Content-Type': 'application/json' },
                            body: JSON.stringify({ subject: groupName, participants }),
                        }).then(r => r.json());
                        const jid = res?.id || res?.groupJid || res?.data?.id;
                        if (jid) {
                            await supabase.from('launch_groups').insert({
                                campaign_id: campaign.id,
                                group_jid: jid,
                                group_name: groupName,
                                order_index: orderStart + n - 1,
                                is_active: n === 1,
                            });
                            groupsCreated++;
                            log.push(`✅ Grupo criado: ${groupName}`);
                            await new Promise(r => setTimeout(r, 1500));
                        }
                        else {
                            log.push(`⚠️ Falha ao criar grupo ${groupName}: ${res?.message || 'No JID'}`);
                        }
                    }
                    catch (e) {
                        log.push(`⚠️ Erro ao criar grupo ${groupName}: ${e.message}`);
                    }
                }
            }
            // Step 3: Schedule all messages
            const offerDate = new Date(plan.offer_date).getTime();
            let scheduled = 0;
            for (const msg of (plan.launch_plan_messages || [])) {
                const scheduledAt = new Date(offerDate + msg.scheduled_offset_hours * 60 * 60 * 1000);
                // Replace {{link_checkout}} with actual checkout url
                let content = msg.content;
                if (plan.checkout_url)
                    content = content.replace(/\{\{link_checkout\}\}/g, plan.checkout_url);
                const { data: dbMsg } = await supabase
                    .from('launch_messages')
                    .insert({
                    campaign_id: campaign.id,
                    content_type: 'text',
                    content,
                    scheduled_at: scheduledAt.toISOString(),
                    humanize: true,
                })
                    .select()
                    .single();
                if (dbMsg) {
                    const delay = scheduledAt.getTime() - Date.now();
                    if (delay > 0) {
                        await launchMessageQueue.add('send-scheduled-message', { message_id: dbMsg.id, campaign_id: campaign.id }, { delay, jobId: `plan-msg-${dbMsg.id}` });
                    }
                    scheduled++;
                }
            }
            log.push(`✅ ${scheduled} mensagens agendadas`);
            // Step 4: Update plan
            await supabase.from('launch_plans').update({
                campaign_id: campaign.id,
                status: 'executing',
                updated_at: new Date().toISOString(),
            }).eq('id', id);
            log.push('🚀 Lançamento em execução!');
            return {
                success: true,
                campaign_id: campaign.id,
                groups_created: groupsCreated,
                messages_scheduled: scheduled,
                log,
            };
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return reply.code(400).send({ error: 'Validation Error', details: error.errors });
            }
            return reply.code(500).send({ error: error.message });
        }
    });
}
//# sourceMappingURL=planner.js.map