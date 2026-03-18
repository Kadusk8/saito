"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = instanceRoutes;
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const billing_limits_1 = require("../services/billing-limits");
const db_1 = require("../db");
async function instanceRoutes(server, evolution) {
    // Route to create a new Evolution instance dynamically
    server.post('/api/instances', { preHandler: [auth_1.activeSubscriptionRequired] }, async (request, reply) => {
        const createInstanceSchema = zod_1.z.object({
            instanceName: zod_1.z.string().min(1)
        });
        try {
            const body = createInstanceSchema.parse(request.body);
            const { instanceName } = body;
            if (!request.user?.organization_id) {
                return reply.code(403).send({ error: 'User does not belong to an organization' });
            }
            // Verify Subscription Scopes / Limits
            try {
                const { allowed, reason } = await (0, billing_limits_1.checkInstanceCreationLimit)(request.user.organization_id, request.user.subscription);
                if (!allowed) {
                    return reply.code(403).send({ error: reason });
                }
            }
            catch (err) {
                return reply.code(500).send({ error: err.message });
            }
            server.log.info(`Creating Evolution instance: ${instanceName} for org ${request.user.organization_id}`);
            // 1. Create the instance
            const createResponse = await evolution.createInstance(instanceName);
            // 2. Set the Webhook automatically
            const webhookUrl = process.env.WEBHOOK_URL || 'http://host.docker.internal:3001/webhooks/evolution';
            await evolution.setWebhook(instanceName, webhookUrl);
            // 3. Save the new instance reference to Supabase
            await db_1.supabase.from('instances').insert({
                organization_id: request.user.organization_id,
                name: instanceName,
                status: 'awaiting_connection'
            });
            return {
                success: true,
                message: 'Instance created and webhook configured.',
                data: createResponse
            };
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return reply.code(400).send({ error: 'Validation Error', details: error.errors });
            }
            server.log.error(error);
            return reply.code(500).send({ error: error.message || 'Failed to create instance' });
        }
    });
    // Route to get all Evolution instances (with DB fallback)
    server.get('/api/instances', async (request, reply) => {
        try {
            let evolutionInstances = [];
            try {
                evolutionInstances = await evolution.fetchInstances();
            }
            catch (error) {
                server.log.warn(`[INSTANCES] Evolution API fetch failed: ${error.message}. Falling back to database.`);
            }
            const { data: dbInstances, error: dbError } = await db_1.supabase
                .from('instances')
                .select('*');
            if (dbError)
                throw dbError;
            // Merge Evolution instances with DB instances
            const mergedInstances = (dbInstances || []).map(dbInst => {
                const evoInstancesArray = Array.isArray(evolutionInstances) ? evolutionInstances : evolutionInstances?.data || [];
                const evoInst = evoInstancesArray.find((i) => i.name === dbInst.name ||
                    i.instance?.instanceName === dbInst.name ||
                    i.instanceName === dbInst.name);
                return {
                    id: dbInst.id,
                    name: dbInst.name,
                    ownerJid: evoInst?.ownerJid || evoInst?.instance?.ownerJid || dbInst.ownerJid,
                    profileName: evoInst?.profileName || evoInst?.instance?.profileName || dbInst.name,
                    profilePicUrl: evoInst?.profilePicUrl || evoInst?.instance?.profilePicUrl,
                    connectionStatus: evoInst?.connectionStatus || evoInst?.status || (evoInst ? 'open' : 'disconnected'),
                    isLive: !!evoInst
                };
            });
            return { success: true, data: mergedInstances };
        }
        catch (error) {
            server.log.error('Error fetching instances:', error.message);
            return reply.code(500).send({ success: false, error: error.message || 'Failed to fetch instances' });
        }
    });
    // Route to list all Evolution groups for an instance (without syncing to DB)
    server.get('/api/instances/:name/groups/sync-list', async (request, reply) => {
        try {
            const { name } = request.params;
            const groups = await evolution.fetchAllGroups(name);
            return groups.map((g) => ({ id: g.id, subject: g.subject || g.name || g.id }));
        }
        catch (error) {
            server.log.error('Error listing groups:', error.message);
            return reply.code(500).send({ error: error.message || 'Failed to list groups' });
        }
    });
    // Route to create a new WhatsApp group
    server.post('/api/instances/:name/groups/create', async (request, reply) => {
        const createGroupSchema = zod_1.z.object({
            subject: zod_1.z.string().min(1),
            participants: zod_1.z.array(zod_1.z.string()).optional()
        });
        try {
            const { name } = request.params;
            const body = createGroupSchema.parse(request.body);
            const { subject, participants } = body;
            server.log.info(`Creating group "${subject}" with ${participants?.length || 0} participants via ${name}`);
            const result = await evolution.createGroup(name, subject.trim(), participants || []);
            return { success: true, group: result };
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return reply.code(400).send({ error: 'Validation Error', details: error.errors });
            }
            server.log.error('Error creating group:', error.message);
            return reply.code(500).send({ error: error.message || 'Failed to create group' });
        }
    });
    // Route to send a text message to a WhatsApp group or number
    server.post('/api/instances/:name/groups/:jid/message', async (request, reply) => {
        const sendMessageSchema = zod_1.z.object({
            text: zod_1.z.string().min(1)
        });
        try {
            const { name, jid } = request.params;
            const body = sendMessageSchema.parse(request.body);
            const { text } = body;
            server.log.info(`Sending message to ${jid} via ${name}`);
            const result = await evolution.sendGroupMessage(name, jid, text.trim());
            return { success: true, result };
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return reply.code(400).send({ error: 'Validation Error', details: error.errors });
            }
            server.log.error('Error sending message:', error.message);
            return reply.code(500).send({ error: error.message || 'Failed to send message' });
        }
    });
    // Route to broadcast a message to MULTIPLE groups at once
    server.post('/api/instances/:name/broadcast', async (request, reply) => {
        const broadcastSchema = zod_1.z.object({
            jids: zod_1.z.array(zod_1.z.string()).min(1),
            text: zod_1.z.string().min(1),
            delayMs: zod_1.z.number().int().min(0).optional()
        });
        try {
            const { name } = request.params;
            const body = broadcastSchema.parse(request.body);
            const { jids, text, delayMs } = body;
            const delay = Math.min(delayMs || 1500, 5000);
            const results = [];
            for (const jid of jids) {
                try {
                    await evolution.sendGroupMessage(name, jid, text.trim());
                    results.push({ jid, success: true });
                }
                catch (e) {
                    results.push({ jid, success: false, error: e.message });
                }
                if (jid !== jids[jids.length - 1]) {
                    await new Promise(r => setTimeout(r, delay));
                }
            }
            return { success: true, results, sent: results.filter(r => r.success).length, failed: results.filter(r => !r.success).length };
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return reply.code(400).send({ error: 'Validation Error', details: error.errors });
            }
            server.log.error('Error broadcasting:', error.message);
            return reply.code(500).send({ error: error.message || 'Failed to broadcast' });
        }
    });
    // Route to fetch the instance QRCode connection state
    server.get('/api/instances/:name/qrcode', async (request, reply) => {
        try {
            const { name } = request.params;
            if (!name)
                return reply.code(400).send({ error: 'Instance name required' });
            const data = await evolution.getInstanceConnect(name);
            return data;
        }
        catch (error) {
            server.log.error('Error fetching qrcode:', error.message);
            return reply.code(500).send({ error: error.message || 'Failed to fetch qrcode' });
        }
    });
    // Upload media, send message, then auto-delete from Supabase Storage
    server.post('/api/instances/:name/send-media-upload', async (request, reply) => {
        const mediaUploadSchema = zod_1.z.object({
            type: zod_1.z.enum(['image', 'video', 'document', 'audio']),
            number: zod_1.z.string().min(1),
            mediaBase64: zod_1.z.string().min(1),
            mediaName: zod_1.z.string().optional(),
            mimeType: zod_1.z.string().optional(),
            caption: zod_1.z.string().optional(),
            fileName: zod_1.z.string().optional()
        });
        const { name } = request.params;
        let storagePath;
        try {
            const body = mediaUploadSchema.parse(request.body);
            const { type, number, mediaBase64, mediaName, mimeType, caption, fileName } = body;
            const base64Data = mediaBase64.includes(',') ? mediaBase64.split(',')[1] || mediaBase64 : mediaBase64;
            const buffer = Buffer.from(base64Data, 'base64');
            storagePath = `temp/${Date.now()}-${mediaName || 'file'}`;
            const { data: uploadData, error: uploadError } = await db_1.supabase.storage
                .from('saito-temp-media')
                .upload(storagePath, buffer, { contentType: mimeType || 'application/octet-stream', upsert: true });
            if (uploadError)
                throw new Error(`Upload failed: ${uploadError.message}`);
            const { data: urlData } = db_1.supabase.storage.from('saito-temp-media').getPublicUrl(storagePath);
            const publicUrl = urlData.publicUrl;
            server.log.info(`Uploaded media to ${publicUrl}, sending via Evolution API`);
            let result;
            if (type === 'audio') {
                result = await evolution.sendWhatsAppAudio(name, number, publicUrl);
            }
            else {
                result = await evolution.sendMedia(name, number, type, publicUrl, caption, fileName || mediaName);
            }
            await db_1.supabase.storage.from('saito-temp-media').remove([storagePath]);
            server.log.info(`Deleted temp media ${storagePath} from storage`);
            return { success: true, result };
        }
        catch (error) {
            if (storagePath) {
                await db_1.supabase.storage.from('saito-temp-media').remove([storagePath]).catch(() => { });
            }
            if (error instanceof zod_1.z.ZodError) {
                return reply.code(400).send({ error: 'Validation Error', details: error.errors });
            }
            server.log.error('Error in send-media-upload:', error.message);
            return reply.code(500).send({ error: error.message || 'Failed to upload and send media' });
        }
    });
    // Send media from an already-uploaded Supabase Storage URL, then auto-delete
    server.post('/api/instances/:name/send-from-url', async (request, reply) => {
        const sendFromUrlSchema = zod_1.z.object({
            type: zod_1.z.enum(['image', 'video', 'document', 'audio']),
            number: zod_1.z.string().min(1),
            mediaUrl: zod_1.z.string().url(),
            storagePath: zod_1.z.string().optional(),
            caption: zod_1.z.string().optional(),
            fileName: zod_1.z.string().optional()
        });
        const { name } = request.params;
        let storagePath;
        try {
            const body = sendFromUrlSchema.parse(request.body);
            const { type, number, mediaUrl, caption, fileName } = body;
            storagePath = body.storagePath;
            let result;
            if (type === 'audio') {
                result = await evolution.sendWhatsAppAudio(name, number, mediaUrl);
            }
            else {
                result = await evolution.sendMedia(name, number, type, mediaUrl, caption, fileName);
            }
            return { success: true, result };
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return reply.code(400).send({ error: 'Validation Error', details: error.errors });
            }
            server.log.error('Error in send-from-url:', error.message);
            return reply.code(500).send({ error: error.message || 'Failed to send media' });
        }
    });
    // Unified send route
    server.post('/api/instances/:name/send', async (request, reply) => {
        const unifiedSendSchema = zod_1.z.object({
            type: zod_1.z.string().min(1),
            number: zod_1.z.string().min(1),
            text: zod_1.z.string().optional(),
            media: zod_1.z.string().optional(),
            caption: zod_1.z.string().optional(),
            fileName: zod_1.z.string().optional(),
            audio: zod_1.z.string().optional(),
            title: zod_1.z.string().optional(),
            description: zod_1.z.string().optional(),
            footer: zod_1.z.string().optional(),
            buttons: zod_1.z.array(zod_1.z.any()).optional(),
            buttonText: zod_1.z.string().optional(),
            sections: zod_1.z.array(zod_1.z.any()).optional(),
            cards: zod_1.z.array(zod_1.z.any()).optional()
        });
        try {
            const { name } = request.params;
            const body = unifiedSendSchema.parse(request.body);
            const { type, number } = body;
            let result;
            switch (type) {
                case 'text':
                    result = await evolution.sendGroupMessage(name, number, body.text || '');
                    break;
                case 'image':
                case 'video':
                case 'document':
                    result = await evolution.sendMedia(name, number, type, body.media || '', body.caption || '', body.fileName || '');
                    break;
                case 'audio':
                    result = await evolution.sendWhatsAppAudio(name, number, body.audio || '');
                    break;
                case 'buttons':
                    result = await evolution.sendButtons(name, number, body.title || '', body.description || '', body.footer || '', body.buttons || []);
                    break;
                case 'list':
                    result = await evolution.sendList(name, number, body.title || '', body.description || '', body.footer || '', body.buttonText || '', body.sections || []);
                    break;
                case 'carousel':
                    result = await evolution.sendCarousel(name, number, body.cards || []);
                    break;
                default:
                    return reply.code(400).send({ error: `Unknown message type: ${type}` });
            }
            return { success: true, result };
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return reply.code(400).send({ error: 'Validation Error', details: error.errors });
            }
            server.log.error('Error sending message:', error.message);
            return reply.code(500).send({ error: error.message || 'Failed to send message' });
        }
    });
    // Route to sync groups for a given instance
    server.post('/api/instances/:name/groups/sync', async (request, reply) => {
        try {
            const { name } = request.params;
            if (!name)
                return reply.code(400).send({ error: 'Instance name required' });
            server.log.info(`[SYNC] Starting sync for instance: ${name}`);
            const groupsResponse = await evolution.fetchAllGroups(name);
            const groups = Array.isArray(groupsResponse) ? groupsResponse : groupsResponse?.data || [];
            server.log.info(`[SYNC] Evolution API returned ${groups.length} total groups for ${name}`);
            const instancesRes = await evolution.fetchInstances();
            const instancesArray = Array.isArray(instancesRes) ? instancesRes : instancesRes?.data || [];
            const myInstance = instancesArray.find((i) => i.name === name ||
                i.instance?.instanceName === name ||
                i.instanceName === name);
            // Robust bot identification
            const botJid = myInstance?.ownerJid ||
                myInstance?.instance?.ownerJid ||
                myInstance?.number ||
                myInstance?.instance?.number;
            if (!botJid) {
                server.log.error(`[SYNC] Bot JID not found for instance ${name}. Instance data: ${JSON.stringify(myInstance)}`);
                return reply.code(400).send({ error: "Número da instância não encontrado. Verifique se a instância está conectada." });
            }
            const botId = botJid.split('@')[0];
            server.log.info(`[SYNC] Bot ID identified as: ${botId}`);
            const managedGroups = groups.filter((g) => {
                const participants = g.participants || [];
                const botParticipant = participants.find((p) => {
                    const pId = (p.id || p.phoneNumber || '').split('@')[0];
                    return pId === botId;
                });
                if (!botParticipant) {
                    // server.log.debug(`[SYNC] Bot ${botId} not in group ${g.subject || g.id}`);
                    return false;
                }
                const isAdmin = botParticipant.admin === 'admin' ||
                    botParticipant.admin === 'superadmin' ||
                    botParticipant.admin === true;
                return isAdmin;
            });
            server.log.info(`[SYNC] Found ${managedGroups.length} groups where bot is admin.`);
            const { data: instanceData } = await db_1.supabase.from('instances').select('id').eq('name', name).single();
            if (!instanceData)
                return reply.code(404).send({ error: 'Instance not found in database' });
            const { data: existingGroups } = await db_1.supabase.from('groups').select('id, jid').eq('instance_id', instanceData.id);
            const existingJids = new Map((existingGroups || []).map((g) => [g.jid, g.id]));
            const upsertData = managedGroups.map((g) => {
                const existingId = existingJids.get(g.id);
                return {
                    id: existingId || crypto.randomUUID(),
                    instance_id: instanceData.id,
                    jid: g.id,
                    name: g.subject || g.name || 'Grupo Sem Nome',
                    rules: existingId ? undefined : {
                        blockAudio: false,
                        blockImage: false,
                        blockLinks: true,
                        blockVideo: false,
                        aiBlacklist: true,
                        blockSticker: false,
                        floodControl: true,
                        moderationEnabled: false
                    },
                    settings: {},
                    blacklist: []
                };
            });
            if (upsertData.length > 0) {
                const cleanedData = upsertData.map((g) => Object.fromEntries(Object.entries(g).filter(([_, v]) => v !== undefined)));
                const { error } = await db_1.supabase.from('groups').upsert(cleanedData, { onConflict: 'id' });
                if (error) {
                    server.log.error(`[SYNC] DB Error: ${error.message}`);
                    throw error;
                }
            }
            const currentJids = new Set(managedGroups.map((g) => g.id));
            const groupsToDelete = (existingGroups || []).filter((dbGroup) => !currentJids.has(dbGroup.jid));
            if (groupsToDelete.length > 0) {
                const deleteIds = groupsToDelete.map((g) => g.id);
                const { error } = await db_1.supabase.from('groups').delete().in('id', deleteIds);
                if (error) {
                    server.log.error(`[SYNC] DB Delete Error: ${error.message}`);
                }
            }
            return {
                success: true,
                message: `Sincronizados ${upsertData.length} grupos onde você é administrador.`,
                count: upsertData.length
            };
        }
        catch (error) {
            server.log.error(`[SYNC] Fatal Error: ${error.message}`);
            return reply.code(500).send({ error: error.message || 'Failed to sync groups' });
        }
    });
    // Route to get participants of a WhatsApp group
    server.get('/api/instances/:name/groups/:jid/participants', async (request, reply) => {
        try {
            const { name, jid } = request.params;
            const groups = await evolution.fetchAllGroups(name);
            const group = groups.find((g) => g.id === jid);
            if (!group)
                return reply.code(404).send({ error: 'Group not found' });
            const participants = (group.participants || []).map((p) => ({
                jid: p.id,
                number: p.id.split('@')[0],
                admin: p.admin || null,
            }));
            return { participants };
        }
        catch (error) {
            server.log.error('Error fetching participants:', error.message);
            return reply.code(500).send({ error: error.message || 'Failed to fetch participants' });
        }
    });
    // Route to add participants to a WhatsApp group
    server.post('/api/instances/:name/groups/:jid/participants', async (request, reply) => {
        const addParticipantsSchema = zod_1.z.object({
            numbers: zod_1.z.array(zod_1.z.string()).min(1)
        });
        try {
            const { name, jid } = request.params;
            const body = addParticipantsSchema.parse(request.body);
            const { numbers } = body;
            server.log.info(`Adding ${numbers.length} participants to group ${jid} via instance ${name}`);
            const result = await evolution.addParticipants(name, jid, numbers);
            const results = Array.isArray(result)
                ? result.map((r) => ({
                    number: r.jid?.split('@')[0] || r.participant || '',
                    status: r.status || 'unknown',
                    error: r.error || null,
                }))
                : [];
            return { success: true, results };
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return reply.code(400).send({ error: 'Validation Error', details: error.errors });
            }
            server.log.error('Error adding participants:', error.message);
            return reply.code(500).header('Access-Control-Allow-Origin', '*').send({ error: error.message || 'Failed to add participants' });
        }
    });
    // Route to delete an Evolution instance
    server.delete('/api/instances/:name', async (request, reply) => {
        try {
            const { name } = request.params;
            if (!name)
                return reply.code(400).send({ error: 'Instance name required' });
            server.log.info(`Deleting Evolution instance: ${name}`);
            try {
                await evolution.logoutInstance(name);
                await evolution.deleteInstance(name);
            }
            catch (e) {
                server.log.warn(`Evolution API warning deleting ${name}: ${e.message}`);
            }
            const { data: instanceData } = await db_1.supabase.from('instances').select('id').eq('name', name).single();
            if (instanceData) {
                await db_1.supabase.from('groups').delete().eq('instance_id', instanceData.id);
            }
            const { error } = await db_1.supabase.from('instances').delete().eq('name', name);
            if (error)
                throw error;
            return { success: true, message: `Instance ${name} deleted successfully` };
        }
        catch (error) {
            server.log.error(error);
            return reply.code(500).header('Access-Control-Allow-Origin', '*').send({ error: error.message || 'Failed to delete instance' });
        }
    });
}
//# sourceMappingURL=instances.js.map