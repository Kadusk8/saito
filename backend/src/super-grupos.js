"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.superGruposRoutes = superGruposRoutes;
const ai_service_1 = require("./services/ai-service");
const bullmq_1 = require("bullmq");
const auth_1 = require("./middleware/auth");
const billing_limits_1 = require("./services/billing-limits");
const zod_1 = require("zod");
// ─── Super Grupos Routes ────────────────────────────────────────────────────
// Mounts under the Fastify instance passed from index.ts
// All routes prefixed /api/super-grupos
async function superGruposRoutes(server, supabase, evolution, redisConnection) {
    const launchMessageQueue = new bullmq_1.Queue('launch-messages', { connection: redisConnection });
    const scarcityQueue = new bullmq_1.Queue('launch-scarcity', { connection: redisConnection });
    // ── A. CAMPAIGNS ──────────────────────────────────────────────────────────
    // List all campaigns
    server.get('/api/super-grupos', { preHandler: [auth_1.authenticate] }, async (req, reply) => {
        const { data, error } = await supabase
            .from('launch_campaigns')
            .select(`
                *,
                instance:instances(id, name),
                launch_groups(id, group_name, is_active, member_count, order_index),
                launch_messages(count),
                launch_leads(count)
            `)
            .eq('organization_id', req.user?.organization_id)
            .order('created_at', { ascending: false });
        if (error)
            return reply.code(500).send({ error: error.message });
        return data;
    });
    // Get single campaign with full detail
    server.get('/api/super-grupos/:id', { preHandler: [auth_1.authenticate] }, async (req, reply) => {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('launch_campaigns')
            .select(`
                *,
                instance:instances(id, name),
                launch_groups(* ),
                launch_messages(* ),
                launch_leads(* )
            `)
            .eq('id', id)
            .eq('organization_id', req.user?.organization_id)
            .single();
        if (error)
            return reply.code(404).send({ error: 'Campaign not found' });
        return data;
    });
    // Create campaign
    server.post('/api/super-grupos', { preHandler: [auth_1.activeSubscriptionRequired] }, async (req, reply) => {
        const createSchema = zod_1.z.object({
            name: zod_1.z.string().min(1),
            instance_id: zod_1.z.string().uuid(),
            offer_date: zod_1.z.string(),
            overflow_limit: zod_1.z.number().int().positive().optional().default(250),
            groups: zod_1.z.array(zod_1.z.object({
                group_jid: zod_1.z.string(),
                group_name: zod_1.z.string()
            })).optional()
        });
        try {
            const body = createSchema.parse(req.body);
            const { name, instance_id, offer_date, overflow_limit = 250, groups } = body;
            // Create campaign
            // Defense in Depth: injecting organization_id explicitly if your schema supports it
            // Or relying on RLS if auth is passed properly via Supabase token.
            // Assuming RLS is active:
            console.log('--- CREATE SUPER GROUP ---');
            console.log('Body:', body);
            console.log('User Org ID:', req.user?.organization_id);
            const { data: campaign, error: ce } = await supabase
                .from('launch_campaigns')
                .insert({
                name,
                instance_id,
                offer_date,
                overflow_limit,
                organization_id: req.user?.organization_id
            })
                .select()
                .single();
            if (ce) {
                console.error('Supabase Error:', ce);
                return reply.code(500).send({ error: ce.message });
            }
            console.log('Campaign Created:', campaign.id);
            // Insert launch_groups
            if (groups && groups.length > 0) {
                const groupRows = groups.map((g, i) => ({
                    campaign_id: campaign.id,
                    group_jid: g.group_jid,
                    group_name: g.group_name,
                    order_index: i,
                    is_active: i === 0,
                }));
                await supabase.from('launch_groups').insert(groupRows);
            }
            return reply.code(201).send(campaign);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return reply.code(400).send({ error: 'Validation Error', details: error.errors });
            }
            return reply.code(500).send({ error: error.message });
        }
    });
    // Update campaign (name, status, overflow_limit, offer_date, scarcity settings)
    server.patch('/api/super-grupos/:id', { preHandler: [auth_1.authenticate] }, async (req, reply) => {
        const updateSchema = zod_1.z.object({
            name: zod_1.z.string().optional(),
            status: zod_1.z.string().optional(),
            overflow_limit: zod_1.z.number().int().positive().optional(),
            offer_date: zod_1.z.string().optional()
        });
        const { id } = req.params;
        try {
            const body = updateSchema.parse(req.body);
            const { data, error } = await supabase
                .from('launch_campaigns')
                .update({ ...body, updated_at: new Date().toISOString() })
                .eq('id', id)
                .eq('organization_id', req.user?.organization_id)
                .select()
                .single();
            if (error)
                return reply.code(500).send({ error: error.message });
            return data;
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return reply.code(400).send({ error: 'Validation Error', details: error.errors });
            }
            return reply.code(500).send({ error: error.message });
        }
    });
    // Delete campaign
    server.delete('/api/super-grupos/:id', { preHandler: [auth_1.authenticate] }, async (req, reply) => {
        const { id } = req.params;
        const { error } = await supabase
            .from('launch_campaigns')
            .delete()
            .eq('id', id)
            .eq('organization_id', req.user?.organization_id);
        if (error)
            return reply.code(500).send({ error: error.message });
        return { success: true };
    });
    // Auto-create groups via Evolution API
    server.post('/api/super-grupos/:id/auto-create-groups', { preHandler: [auth_1.authenticate] }, async (req, reply) => {
        const createGroupsSchema = zod_1.z.object({
            count: zod_1.z.number().int().min(1).max(50).default(3),
            name_pattern: zod_1.z.string().min(1).default('Grupo {n}'),
            admin_number: zod_1.z.string().optional()
        });
        const { id } = req.params;
        try {
            const body = createGroupsSchema.parse(req.body);
            const { count, name_pattern, admin_number } = body;
            const { data: campaign } = await supabase
                .from('launch_campaigns')
                .select('*, instance:instances(name)')
                .eq('id', id)
                .eq('organization_id', req.user?.organization_id)
                .single();
            if (!campaign)
                return reply.code(404).send({ error: 'Campaign not found' });
            const instanceName = campaign.instance.name;
            const EVOLUTION_URL = process.env.EVOLUTION_URL || 'http://localhost:8080';
            const EVOLUTION_KEY = process.env.EVOLUTION_GLOBAL_KEY || 'global-api-key';
            const created = [];
            const errors = [];
            // Get current max order_index
            const { data: existing } = await supabase
                .from('launch_groups')
                .select('order_index')
                .eq('campaign_id', id)
                .order('order_index', { ascending: false })
                .limit(1);
            let orderStart = (existing?.[0]?.order_index ?? -1) + 1;
            for (let n = 1; n <= count; n++) {
                const groupName = name_pattern.replace('{n}', String(orderStart + n));
                try {
                    // Evolution API: create group — needs at least 1 participant
                    const participants = admin_number
                        ? [`${admin_number}@s.whatsapp.net`]
                        : [];
                    const res = await fetch(`${EVOLUTION_URL}/group/create/${instanceName}`, {
                        method: 'POST',
                        headers: { 'apikey': EVOLUTION_KEY, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ subject: groupName, participants }),
                    }).then(r => r.json());
                    const jid = res?.id || res?.groupJid || res?.data?.id;
                    if (!jid) {
                        errors.push({ n, groupName, error: res?.message || 'No JID returned' });
                        continue;
                    }
                    // Insert into launch_groups
                    const orderIndex = orderStart + n - 1;
                    const { data: group } = await supabase
                        .from('launch_groups')
                        .insert({
                        campaign_id: id,
                        group_jid: jid,
                        group_name: groupName,
                        order_index: orderIndex,
                        is_active: orderIndex === 0,
                    })
                        .select()
                        .single();
                    created.push({ ...group, created_via_api: true });
                    // Small delay to avoid rate limiting
                    await new Promise(r => setTimeout(r, 1500));
                }
                catch (e) {
                    errors.push({ n, groupName, error: e.message });
                }
            }
            return reply.send({ success: true, created, errors, total: created.length });
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return reply.code(400).send({ error: 'Validation Error', details: error.errors });
            }
            return reply.code(500).send({ error: error.message });
        }
    });
    // Add group to campaign
    server.post('/api/super-grupos/:id/groups', { preHandler: [auth_1.authenticate] }, async (req, reply) => {
        const { id } = req.params;
        const { group_jid, group_name } = req.body;
        // Verify campaign ownership
        const { data: campaign } = await supabase
            .from('launch_campaigns')
            .select('id')
            .eq('id', id)
            .eq('organization_id', req.user?.organization_id)
            .single();
        if (!campaign)
            return reply.code(404).send({ error: 'Campaign not found' });
        // Get current max order
        const { data: existing } = await supabase
            .from('launch_groups')
            .select('order_index')
            .eq('campaign_id', id)
            .order('order_index', { ascending: false })
            .limit(1);
        const nextIndex = (existing?.[0]?.order_index ?? -1) + 1;
        const { data, error } = await supabase
            .from('launch_groups')
            .insert({ campaign_id: id, group_jid, group_name, order_index: nextIndex, is_active: nextIndex === 0 })
            .select()
            .single();
        if (error)
            return reply.code(500).send({ error: error.message });
        return data;
    });
    // Remove group from campaign
    server.delete('/api/super-grupos/:id/groups/:groupId', { preHandler: [auth_1.authenticate] }, async (req, reply) => {
        const { id, groupId } = req.params;
        // Verify campaign ownership via existence check or join
        const { data: group } = await supabase
            .from('launch_groups')
            .select('id, campaign:launch_campaigns(organization_id)')
            .eq('id', groupId)
            .eq('campaign_id', id)
            .single();
        if (!group || group.campaign.organization_id !== req.user?.organization_id) {
            return reply.code(404).send({ error: 'Group or Campaign not found' });
        }
        const { error } = await supabase.from('launch_groups').delete().eq('id', groupId);
        if (error)
            return reply.code(500).send({ error: error.message });
        return { success: true };
    });
    // Get invite link for current active group
    server.get('/api/super-grupos/:id/invite-link', { preHandler: [auth_1.authenticate] }, async (req, reply) => {
        const { id } = req.params;
        const { data: campaign, error: ce } = await supabase
            .from('launch_campaigns')
            .select('*, instance:instances(name)')
            .eq('id', id)
            .eq('organization_id', req.user?.organization_id)
            .single();
        console.log('[INVITE-LINK] Campaign:', campaign);
        if (ce)
            console.error('[INVITE-LINK] Campaign Error:', ce);
        if (!campaign)
            return reply.code(404).send({ error: 'Campaign not found' });
        const { data: activeGroup, error: ae } = await supabase
            .from('launch_groups')
            .select('*')
            .eq('campaign_id', id)
            .eq('is_active', true)
            .maybeSingle();
        console.log('[INVITE-LINK] Active Group:', activeGroup);
        if (ae)
            console.error('[INVITE-LINK] Active Group Error:', ae);
        if (!activeGroup)
            return reply.code(404).send({ error: 'No active group found' });
        try {
            const evoUrl = `${process.env.EVOLUTION_URL || 'http://localhost:8080'}/group/inviteCode/${campaign.instance.name}?groupJid=${activeGroup.group_jid}`;
            console.log(`[INVITE-LINK] Fetching invite code from: ${evoUrl}`);
            // Fetch real invite link from Evolution API
            const evoRes = await fetch(evoUrl, {
                method: 'GET',
                headers: {
                    'apikey': process.env.EVOLUTION_GLOBAL_KEY || 'global-api-key',
                    'Content-Type': 'application/json',
                },
            });
            const res = await evoRes.json();
            console.log('[INVITE-LINK] Evolution API Result:', res);
            let inviteLink = res?.inviteUrl
                ? res.inviteUrl
                : (res?.code || res?.inviteCode)
                    ? `https://chat.whatsapp.com/${res.code || res.inviteCode}`
                    : null;
            if (inviteLink && inviteLink.startsWith('https://chat.whatsapp.com/https://chat.whatsapp.com/')) {
                inviteLink = inviteLink.replace('https://chat.whatsapp.com/https://chat.whatsapp.com/', 'https://chat.whatsapp.com/');
            }
            if (inviteLink) {
                console.log('[INVITE-LINK] Success! Link:', inviteLink);
                await supabase.from('launch_groups').update({ invite_link: inviteLink }).eq('id', activeGroup.id);
            }
            else {
                console.warn('[INVITE-LINK] Evolution API returned no code/url:', res);
            }
            return { invite_link: inviteLink, active_group: activeGroup };
        }
        catch (e) {
            console.error('[INVITE-LINK] Fatal Error:', e.message);
            return reply.code(500).send({ error: e.message });
        }
    });
    // ── C. CONTENT SCHEDULING ─────────────────────────────────────────────────
    // List scheduled messages for campaign
    server.get('/api/super-grupos/:id/messages', { preHandler: [auth_1.authenticate] }, async (req, reply) => {
        const { id } = req.params;
        // Check ownership
        const { data: campaign } = await supabase
            .from('launch_campaigns')
            .select('id')
            .eq('id', id)
            .eq('organization_id', req.user?.organization_id)
            .single();
        if (!campaign)
            return reply.code(404).send({ error: 'Campaign not found' });
        const { data, error } = await supabase
            .from('launch_messages')
            .select('*')
            .eq('campaign_id', id)
            .order('scheduled_at', { ascending: true });
        if (error)
            return reply.code(500).send({ error: error.message });
        return data;
    });
    // Schedule a message
    server.post('/api/super-grupos/:id/messages', async (req, reply) => {
        const { id } = req.params;
        const { content_type, content, caption, media_url, scheduled_at, humanize } = req.body;
        const level = (0, billing_limits_1.getPlanLevelFromPriceId)(req.user?.subscription?.price_id);
        const isPremium = (0, billing_limits_1.canUsePremiumBroadcasting)(level);
        if (!isPremium && humanize) {
            return reply.code(403).send({ error: 'Recurso Restrito: A simulação humana (Humanize) é exclusiva para os planos Pro e Enterprise. Faça o upgrade.' });
        }
        if (!isPremium && content_type !== 'text' && content_type !== 'image') {
            return reply.code(403).send({ error: `Recurso Restrito: Envio de ${content_type} é exclusivo para os planos Pro e Enterprise. Faça o upgrade.` });
        }
        const { data: msg, error } = await supabase
            .from('launch_messages')
            .insert({ campaign_id: id, content_type, content, caption, media_url, scheduled_at, humanize: !!humanize })
            .select()
            .single();
        if (error)
            return reply.code(500).send({ error: error.message });
        // Schedule BullMQ job for this exact time
        const delay = Math.max(0, new Date(scheduled_at).getTime() - Date.now());
        await launchMessageQueue.add('send-scheduled-message', { message_id: msg.id, campaign_id: id }, { delay, jobId: `msg-${msg.id}` });
        return reply.code(201).send(msg);
    });
    // Delete scheduled message
    server.delete('/api/super-grupos/:id/messages/:msgId', { preHandler: [auth_1.authenticate] }, async (req, reply) => {
        const { id, msgId } = req.params;
        // Verify ownership
        const { data: msg } = await supabase
            .from('launch_messages')
            .select('id, campaign:launch_campaigns(organization_id)')
            .eq('id', msgId)
            .eq('campaign_id', id)
            .single();
        if (!msg || msg.campaign.organization_id !== req.user?.organization_id) {
            return reply.code(404).send({ error: 'Message not found' });
        }
        await launchMessageQueue.remove(`msg-${msgId}`).catch(() => { });
        const { error } = await supabase.from('launch_messages').delete().eq('id', msgId);
        if (error)
            return reply.code(500).send({ error: error.message });
        return { success: true };
    });
    // ── D. GATEKEEPER ──────────────────────────────────────────────────────────
    // Open all groups in campaign (announcement: false)
    server.post('/api/super-grupos/:id/open', { preHandler: [auth_1.authenticate] }, async (req, reply) => {
        const { id } = req.params;
        const { data: campaign, error: ce } = await supabase
            .from('launch_campaigns')
            .select('*, instance:instances(name)')
            .eq('id', id)
            .eq('organization_id', req.user?.organization_id)
            .single();
        console.log('[OPEN] Campaign:', campaign);
        if (ce)
            console.error('[OPEN] Campaign Error:', ce);
        if (!campaign)
            return reply.code(404).send({ error: 'Campaign not found' });
        const { data: groups } = await supabase
            .from('launch_groups')
            .select('group_jid')
            .eq('campaign_id', id);
        const instanceName = campaign.instance.name;
        const EVOLUTION_URL = process.env.EVOLUTION_URL || 'http://localhost:8080';
        const EVOLUTION_KEY = process.env.EVOLUTION_GLOBAL_KEY || 'global-api-key';
        const promises = (groups || []).map(async (g) => {
            try {
                const evoRes = await fetch(`${EVOLUTION_URL}/group/updateSetting/${instanceName}`, {
                    method: 'POST',
                    headers: {
                        'apikey': EVOLUTION_KEY,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ groupJid: g.group_jid, action: 'not_announcement' }),
                });
                const evoData = await evoRes.json();
                console.log(`[OPEN] Evolution API Result for ${g.group_jid}:`, evoData);
                return { jid: g.group_jid, opened: true, data: evoData };
            }
            catch (e) {
                console.error(`[OPEN] Evolution API Fatal Error for ${g.group_jid}:`, e.message);
                return { jid: g.group_jid, opened: false, error: e.message };
            }
        });
        const results = await Promise.all(promises);
        await supabase.from('launch_campaigns').update({ status: 'active', updated_at: new Date() }).eq('id', id);
        return { success: true, results };
    });
    // Close all groups (announcement: true)
    server.post('/api/super-grupos/:id/close', { preHandler: [auth_1.authenticate] }, async (req, reply) => {
        const { id } = req.params;
        const { data: campaign, error: ce } = await supabase
            .from('launch_campaigns')
            .select('*, instance:instances(name)')
            .eq('id', id)
            .eq('organization_id', req.user?.organization_id)
            .single();
        console.log('[CLOSE] Campaign:', campaign);
        if (ce)
            console.error('[CLOSE] Campaign Error:', ce);
        if (!campaign)
            return reply.code(404).send({ error: 'Campaign not found' });
        const { data: groups, error: ge } = await supabase
            .from('launch_groups')
            .select('group_jid')
            .eq('campaign_id', id);
        console.log(`[CLOSE] Groups found: ${groups?.length}`);
        if (ge)
            console.error('[CLOSE] Groups Error:', ge);
        const instanceName = campaign.instance?.name;
        console.log(`[CLOSE] Instance Name: ${instanceName}`);
        const EVOLUTION_URL = process.env.EVOLUTION_URL || 'http://localhost:8080';
        const EVOLUTION_KEY = process.env.EVOLUTION_GLOBAL_KEY || 'global-api-key';
        const promises = (groups || []).map(async (g) => {
            try {
                const evoRes = await fetch(`${EVOLUTION_URL}/group/updateSetting/${instanceName}`, {
                    method: 'POST',
                    headers: {
                        'apikey': EVOLUTION_KEY,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ groupJid: g.group_jid, action: 'announcement' }),
                });
                const evoData = await evoRes.json();
                console.log(`[CLOSE] Evolution API Result for ${g.group_jid}:`, evoData);
                return { jid: g.group_jid, closed: true, data: evoData };
            }
            catch (e) {
                console.error(`[CLOSE] Evolution API Fatal Error for ${g.group_jid}:`, e.message);
                return { jid: g.group_jid, closed: false, error: e.message };
            }
        });
        const results = await Promise.all(promises);
        await supabase.from('launch_campaigns').update({ status: 'closed', updated_at: new Date() }).eq('id', id);
        return { success: true, results };
    });
    // Toggle scarcity messages (auto-sends % message every X minutes via BullMQ)
    server.post('/api/super-grupos/:id/scarcity', { preHandler: [auth_1.authenticate] }, async (req, reply) => {
        const { id } = req.params;
        const { enabled, interval_minutes = 60 } = req.body;
        // Verify ownership
        const { data: campaign } = await supabase
            .from('launch_campaigns')
            .select('id')
            .eq('id', id)
            .eq('organization_id', req.user?.organization_id)
            .single();
        if (!campaign)
            return reply.code(404).send({ error: 'Campaign not found' });
        await supabase.from('launch_campaigns').update({
            scarcity_enabled: enabled,
            scarcity_interval_minutes: interval_minutes,
            updated_at: new Date()
        }).eq('id', id);
        if (enabled) {
            await scarcityQueue.add('scarcity-pulse', { campaign_id: id }, {
                repeat: { every: interval_minutes * 60 * 1000 },
                jobId: `scarcity-${id}`
            });
        }
        else {
            const repeatable = await scarcityQueue.getRepeatableJobs();
            const job = repeatable.find(j => j.id === `scarcity-${id}`);
            if (job)
                await scarcityQueue.removeRepeatableByKey(job.key);
        }
        return { success: true, scarcity_enabled: enabled };
    });
    // ── E. LEADS ───────────────────────────────────────────────────────────────
    // Get leads for campaign
    server.get('/api/super-grupos/:id/leads', { preHandler: [auth_1.authenticate] }, async (req, reply) => {
        const { id } = req.params;
        // Check ownership
        const { data: campaign } = await supabase
            .from('launch_campaigns')
            .select('id')
            .eq('id', id)
            .eq('organization_id', req.user?.organization_id)
            .single();
        if (!campaign)
            return reply.code(404).send({ error: 'Campaign not found' });
        const { data, error } = await supabase
            .from('launch_leads')
            .select('*')
            .eq('campaign_id', id)
            .order('created_at', { ascending: false });
        if (error)
            return reply.code(500).send({ error: error.message });
        return data;
    });
    // Manual lead analysis (classify a message via Gemini)
    server.post('/api/super-grupos/:id/leads/analyze', { preHandler: [auth_1.authenticate] }, async (req, reply) => {
        const { id } = req.params;
        // Verify ownership
        const { data: campaign } = await supabase
            .from('launch_campaigns')
            .select('id')
            .eq('id', id)
            .eq('organization_id', req.user?.organization_id)
            .single();
        if (!campaign)
            return reply.code(404).send({ error: 'Campaign not found' });
        const { member_jid, member_name, group_jid, message_text } = req.body;
        if (!message_text)
            return reply.code(400).send({ error: 'message_text required' });
        let classification = 'cold';
        let keywords_matched = [];
        let gemini_reasoning = '';
        // Use AIService for analysis
        if (process.env.OPENAI_API_KEY) {
            try {
                const analysis = await ai_service_1.AIService.analyzeLead(message_text);
                classification = analysis.classification;
                keywords_matched = analysis.keywords_matched;
                gemini_reasoning = analysis.reasoning;
            }
            catch (e) {
                // fallback to simple keyword matching below
            }
        }
        const hotKeywords = ['parcelamento', 'parcela', 'desconto', 'garantia', 'como pagar', 'valor', 'preço', 'comprar', 'quero', 'compro'];
        const warmKeywords = ['quando', 'como funciona', 'tem suporte', 'serve para', 'é bom', 'resultado'];
        const lower = message_text.toLowerCase();
        const hotMatches = hotKeywords.filter(k => lower.includes(k));
        const warmMatches = warmKeywords.filter(k => lower.includes(k));
        if (hotMatches.length > 0) {
            classification = 'hot';
            keywords_matched = hotMatches;
        }
        else if (warmMatches.length > 0) {
            classification = 'warm';
            keywords_matched = warmMatches;
        }
        const { data, error } = await supabase
            .from('launch_leads')
            .insert({ campaign_id: id, member_jid, member_name, group_jid, message_text, classification, keywords_matched, gemini_reasoning })
            .select()
            .single();
        if (error)
            return reply.code(500).send({ error: error.message });
        return data;
    });
    // ── F. OVERFLOW WEBHOOK HANDLER ───────────────────────────────────────────
    // Called by Evolution webhook to update member count and trigger overflow
    server.post('/api/super-grupos/overflow-check', async (req, reply) => {
        const { group_jid, member_count, instance_name } = req.body;
        // Find active group in any campaign
        const { data: activeGroup } = await supabase
            .from('launch_groups')
            .select('*, campaign:launch_campaigns(*, instance:instances(name))')
            .eq('group_jid', group_jid)
            .eq('is_active', true)
            .single();
        if (!activeGroup)
            return { skipped: true };
        // Verify instance name if provided in webhook (Gatekeeping)
        if (instance_name && activeGroup.campaign?.instance?.name !== instance_name) {
            console.warn(`[OVERFLOW] Webhook instance mismatch: expected ${activeGroup.campaign?.instance?.name}, got ${instance_name}`);
            return reply.code(403).send({ error: 'Instance mismatch' });
        }
        // Always update member count
        await supabase.from('launch_groups').update({ member_count }).eq('id', activeGroup.id);
        const limit = activeGroup.campaign?.overflow_limit || 250;
        if (member_count >= limit) {
            // Find next group
            const { data: nextGroup } = await supabase
                .from('launch_groups')
                .select('*')
                .eq('campaign_id', activeGroup.campaign_id)
                .eq('is_active', false)
                .order('order_index', { ascending: true })
                .gt('order_index', activeGroup.order_index)
                .limit(1)
                .single();
            if (nextGroup) {
                // Activate next group
                await supabase.from('launch_groups').update({ is_active: false }).eq('id', activeGroup.id);
                await supabase.from('launch_groups').update({ is_active: true }).eq('id', nextGroup.id);
                server.log.info(`🔄 Super Grupos: Overflow activated! Switched to group ${nextGroup.group_name}`);
                return { overflowed: true, next_group: nextGroup.group_name };
            }
        }
        return { updated: true, member_count };
    });
}
//# sourceMappingURL=super-grupos.js.map