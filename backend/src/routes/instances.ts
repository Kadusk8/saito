import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { EvolutionAPI } from '../services/evolution';
import { activeSubscriptionRequired, AuthenticatedRequest } from '../middleware/auth';
import { checkInstanceCreationLimit } from '../services/billing-limits';
import { supabase } from '../db';

export default async function instanceRoutes(server: FastifyInstance, evolution: EvolutionAPI) {
    // Route to create a new Evolution instance dynamically
    server.post('/api/instances', { preHandler: [activeSubscriptionRequired] }, async (request: AuthenticatedRequest, reply) => {
        const createInstanceSchema = z.object({
            instanceName: z.string().min(1)
        });

        try {
            const body = createInstanceSchema.parse(request.body);
            const { instanceName } = body;

            if (!request.user?.organization_id) {
                return reply.code(403).send({ error: 'User does not belong to an organization' });
            }

            // Verify Subscription Scopes / Limits
            try {
                const { allowed, reason } = await checkInstanceCreationLimit(request.user.organization_id, request.user.subscription);
                if (!allowed) {
                    return reply.code(403).send({ error: reason });
                }
            } catch (err: any) {
                return reply.code(500).send({ error: err.message });
            }

            server.log.info(`Creating Evolution instance: ${instanceName} for org ${request.user.organization_id}`);

            // 1. Create the instance
            const createResponse = await evolution.createInstance(instanceName);

            // 2. Set the Webhook automatically
            const webhookUrl = process.env.WEBHOOK_URL || 'http://host.docker.internal:3001/webhooks/evolution';
            await evolution.setWebhook(instanceName, webhookUrl);

            // 3. Save the new instance reference to Supabase
            await supabase.from('instances').insert({
                organization_id: request.user.organization_id,
                name: instanceName,
                status: 'awaiting_connection'
            });

            return {
                success: true,
                message: 'Instance created and webhook configured.',
                data: createResponse
            };

        } catch (error: any) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({ error: 'Validation Error', details: (error as any).errors });
            }
            server.log.error(error);
            return reply.code(500).send({ error: error.message || 'Failed to create instance' });
        }
    });

    // Route to get all Evolution instances (with DB fallback)
    server.get('/api/instances', async (request, reply) => {
        try {
            let evolutionInstances: any[] = [];
            
            try {
                evolutionInstances = await evolution.fetchInstances();
            } catch (error: any) {
                server.log.warn(`[INSTANCES] Evolution API fetch failed: ${error.message}. Falling back to database.`);
            }

            const { data: dbInstances, error: dbError } = await supabase
                .from('instances')
                .select('*');

            if (dbError) throw dbError;

            // Merge Evolution instances with DB instances
            const mergedInstances = (dbInstances || []).map(dbInst => {
                const evoInstancesArray = Array.isArray(evolutionInstances) ? evolutionInstances : (evolutionInstances as any)?.data || [];
                const evoInst = evoInstancesArray.find((i: any) => 
                    i.name === dbInst.name || 
                    i.instance?.instanceName === dbInst.name ||
                    i.instanceName === dbInst.name
                );
                
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
        } catch (error: any) {
            server.log.error('Error fetching instances:', error.message);
            return reply.code(500).send({ success: false, error: error.message || 'Failed to fetch instances' });
        }
    });

    // Route to list all Evolution groups for an instance (without syncing to DB)
    server.get('/api/instances/:name/groups/sync-list', async (request, reply) => {
        try {
            const { name } = request.params as { name: string };
            const groups: any[] = await evolution.fetchAllGroups(name);
            return groups.map((g: any) => ({ id: g.id, subject: g.subject || g.name || g.id }));
        } catch (error: any) {
            server.log.error('Error listing groups:', error.message);
            return reply.code(500).send({ error: error.message || 'Failed to list groups' });
        }
    });

    // Route to create a new WhatsApp group
    server.post('/api/instances/:name/groups/create', async (request, reply) => {
        const createGroupSchema = z.object({
            subject: z.string().min(1),
            participants: z.array(z.string()).optional()
        });

        try {
            const { name } = request.params as { name: string };
            const body = createGroupSchema.parse(request.body);
            const { subject, participants } = body;

            server.log.info(`Creating group "${subject}" with ${participants?.length || 0} participants via ${name}`);
            const result = await evolution.createGroup(name, subject.trim(), participants || []);

            return { success: true, group: result };
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({ error: 'Validation Error', details: (error as any).errors });
            }
            server.log.error('Error creating group:', error.message);
            return reply.code(500).send({ error: error.message || 'Failed to create group' });
        }
    });

    // Route to send a text message to a WhatsApp group or number
    server.post('/api/instances/:name/groups/:jid/message', async (request, reply) => {
        const sendMessageSchema = z.object({
            text: z.string().min(1)
        });

        try {
            const { name, jid } = request.params as { name: string; jid: string };
            const body = sendMessageSchema.parse(request.body);
            const { text } = body;

            server.log.info(`Sending message to ${jid} via ${name}`);
            const result = await evolution.sendGroupMessage(name, jid, text.trim());

            return { success: true, result };
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({ error: 'Validation Error', details: (error as any).errors });
            }
            server.log.error('Error sending message:', error.message);
            return reply.code(500).send({ error: error.message || 'Failed to send message' });
        }
    });

    // Route to broadcast a message to MULTIPLE groups at once
    server.post('/api/instances/:name/broadcast', async (request, reply) => {
        const broadcastSchema = z.object({
            jids: z.array(z.string()).min(1),
            text: z.string().min(1),
            delayMs: z.number().int().min(0).optional()
        });

        try {
            const { name } = request.params as { name: string };
            const body = broadcastSchema.parse(request.body);
            const { jids, text, delayMs } = body;

            const delay = Math.min(delayMs || 1500, 5000);
            const results: { jid: string; success: boolean; error?: string }[] = [];

            for (const jid of jids) {
                try {
                    await evolution.sendGroupMessage(name, jid, text.trim());
                    results.push({ jid, success: true });
                } catch (e: any) {
                    results.push({ jid, success: false, error: e.message });
                }
                if (jid !== jids[jids.length - 1]) {
                    await new Promise(r => setTimeout(r, delay));
                }
            }

            return { success: true, results, sent: results.filter(r => r.success).length, failed: results.filter(r => !r.success).length };
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({ error: 'Validation Error', details: (error as any).errors });
            }
            server.log.error('Error broadcasting:', error.message);
            return reply.code(500).send({ error: error.message || 'Failed to broadcast' });
        }
    });

    // Route to fetch the instance QRCode connection state
    server.get('/api/instances/:name/qrcode', async (request, reply) => {
        try {
            const { name } = request.params as { name: string };
            if (!name) return reply.code(400).send({ error: 'Instance name required' });

            const data = await evolution.getInstanceConnect(name);
            return data;
        } catch (error: any) {
            server.log.error('Error fetching qrcode:', error.message);
            return reply.code(500).send({ error: error.message || 'Failed to fetch qrcode' });
        }
    });

    // Upload media, send message, then auto-delete from Supabase Storage
    server.post('/api/instances/:name/send-media-upload', async (request, reply) => {
        const mediaUploadSchema = z.object({
            type: z.enum(['image', 'video', 'document', 'audio']),
            number: z.string().min(1),
            mediaBase64: z.string().min(1),
            mediaName: z.string().optional(),
            mimeType: z.string().optional(),
            caption: z.string().optional(),
            fileName: z.string().optional()
        });

        const { name } = request.params as { name: string };
        let storagePath: string | undefined;

        try {
            const body = mediaUploadSchema.parse(request.body);
            const { type, number, mediaBase64, mediaName, mimeType, caption, fileName } = body;

            const base64Data: string = mediaBase64.includes(',') ? mediaBase64.split(',')[1] || mediaBase64 : mediaBase64;
            const buffer = Buffer.from(base64Data, 'base64');
            storagePath = `temp/${Date.now()}-${mediaName || 'file'}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('saito-temp-media')
                .upload(storagePath, buffer, { contentType: mimeType || 'application/octet-stream', upsert: true });

            if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

            const { data: urlData } = supabase.storage.from('saito-temp-media').getPublicUrl(storagePath);
            const publicUrl = urlData.publicUrl;

            server.log.info(`Uploaded media to ${publicUrl}, sending via Evolution API`);

            let result: any;
            if (type === 'audio') {
                result = await evolution.sendWhatsAppAudio(name, number, publicUrl);
            } else {
                result = await evolution.sendMedia(name, number, type as 'image' | 'video' | 'document', publicUrl, caption, fileName || mediaName);
            }

            await supabase.storage.from('saito-temp-media').remove([storagePath]);
            server.log.info(`Deleted temp media ${storagePath} from storage`);

            return { success: true, result };
        } catch (error: any) {
            if (storagePath) {
                await supabase.storage.from('saito-temp-media').remove([storagePath]).catch(() => { });
            }
            if (error instanceof z.ZodError) {
                return reply.code(400).send({ error: 'Validation Error', details: (error as any).errors });
            }
            server.log.error('Error in send-media-upload:', error.message);
            return reply.code(500).send({ error: error.message || 'Failed to upload and send media' });
        }
    });

    // Send media from an already-uploaded Supabase Storage URL, then auto-delete
    server.post('/api/instances/:name/send-from-url', async (request, reply) => {
        const sendFromUrlSchema = z.object({
            type: z.enum(['image', 'video', 'document', 'audio']),
            number: z.string().min(1),
            mediaUrl: z.string().url(),
            storagePath: z.string().optional(),
            caption: z.string().optional(),
            fileName: z.string().optional()
        });

        const { name } = request.params as { name: string };
        let storagePath: string | undefined;
        try {
            const body = sendFromUrlSchema.parse(request.body);
            const { type, number, mediaUrl, caption, fileName } = body;
            storagePath = body.storagePath;

            let result: any;
            if (type === 'audio') {
                result = await evolution.sendWhatsAppAudio(name, number, mediaUrl);
            } else {
                result = await evolution.sendMedia(name, number, type as 'image' | 'video' | 'document', mediaUrl, caption, fileName);
            }

            return { success: true, result };
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({ error: 'Validation Error', details: (error as any).errors });
            }
            server.log.error('Error in send-from-url:', error.message);
            return reply.code(500).send({ error: error.message || 'Failed to send media' });
        }
    });

    // Unified send route
    server.post('/api/instances/:name/send', async (request, reply) => {
        const unifiedSendSchema = z.object({
            type: z.string().min(1),
            number: z.string().min(1),
            text: z.string().optional(),
            media: z.string().optional(),
            caption: z.string().optional(),
            fileName: z.string().optional(),
            audio: z.string().optional(),
            title: z.string().optional(),
            description: z.string().optional(),
            footer: z.string().optional(),
            buttons: z.array(z.any()).optional(),
            buttonText: z.string().optional(),
            sections: z.array(z.any()).optional(),
            cards: z.array(z.any()).optional()
        });

        try {
            const { name } = request.params as { name: string };
            const body = unifiedSendSchema.parse(request.body);
            const { type, number } = body;

            let result: any;

            switch (type) {
                case 'text':
                    result = await evolution.sendGroupMessage(name, number, body.text || '');
                    break;
                case 'image':
                case 'video':
                case 'document':
                    result = await evolution.sendMedia(name, number, type as 'image'|'video'|'document', body.media || '', body.caption || '', body.fileName || '');
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
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({ error: 'Validation Error', details: (error as any).errors });
            }
            server.log.error('Error sending message:', error.message);
            return reply.code(500).send({ error: error.message || 'Failed to send message' });
        }
    });

    // Route to sync groups for a given instance
    server.post('/api/instances/:name/groups/sync', async (request, reply) => {
        try {
            const { name } = request.params as { name: string };
            if (!name) return reply.code(400).send({ error: 'Instance name required' });

            server.log.info(`[SYNC] Starting sync for instance: ${name}`);

            const groupsResponse = await evolution.fetchAllGroups(name);
            const groups = Array.isArray(groupsResponse) ? groupsResponse : (groupsResponse as any)?.data || [];
            
            server.log.info(`[SYNC] Evolution API returned ${groups.length} total groups for ${name}`);

            const instancesRes = await evolution.fetchInstances();
            const instancesArray = Array.isArray(instancesRes) ? instancesRes : (instancesRes as any)?.data || [];
            const myInstance = instancesArray.find((i: any) => 
                i.name === name || 
                i.instance?.instanceName === name || 
                i.instanceName === name
            );

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

            const managedGroups = groups.filter((g: any) => {
                const participants = g.participants || [];
                const botParticipant = participants.find((p: any) => {
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

            const { data: instanceData } = await supabase.from('instances').select('id').eq('name', name).single();
            if (!instanceData) return reply.code(404).send({ error: 'Instance not found in database' });

            const { data: existingGroups } = await supabase.from('groups').select('id, jid').eq('instance_id', instanceData.id);
            const existingJids = new Map((existingGroups || []).map((g: any) => [g.jid, g.id]));

            const upsertData = managedGroups.map((g: any) => {
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
                const cleanedData = upsertData.map((g: any) => Object.fromEntries(Object.entries(g).filter(([_, v]) => v !== undefined)));
                const { error } = await supabase.from('groups').upsert(cleanedData, { onConflict: 'id' });
                if (error) {
                    server.log.error(`[SYNC] DB Error: ${error.message}`);
                    throw error;
                }
            }

            const currentJids = new Set(managedGroups.map((g: any) => g.id));
            const groupsToDelete = (existingGroups || []).filter((dbGroup: any) => !currentJids.has(dbGroup.jid));

            if (groupsToDelete.length > 0) {
                const deleteIds = groupsToDelete.map((g: any) => g.id);
                const { error } = await supabase.from('groups').delete().in('id', deleteIds);
                if (error) {
                    server.log.error(`[SYNC] DB Delete Error: ${error.message}`);
                }
            }

            return { 
                success: true, 
                message: `Sincronizados ${upsertData.length} grupos onde você é administrador.`,
                count: upsertData.length 
            };
        } catch (error: any) {
            server.log.error(`[SYNC] Fatal Error: ${error.message}`);
            return reply.code(500).send({ error: error.message || 'Failed to sync groups' });
        }
    });

    // Route to get participants of a WhatsApp group
    server.get('/api/instances/:name/groups/:jid/participants', async (request, reply) => {
        try {
            const { name, jid } = request.params as { name: string; jid: string };
            const groups: any[] = await evolution.fetchAllGroups(name);
            const group = groups.find((g: any) => g.id === jid);
            if (!group) return reply.code(404).send({ error: 'Group not found' });

            const participants = (group.participants || []).map((p: any) => ({
                jid: p.id,
                number: p.id.split('@')[0],
                admin: p.admin || null,
            }));

            return { participants };
        } catch (error: any) {
            server.log.error('Error fetching participants:', error.message);
            return reply.code(500).send({ error: error.message || 'Failed to fetch participants' });
        }
    });

    // Route to add participants to a WhatsApp group
    server.post('/api/instances/:name/groups/:jid/participants', async (request, reply) => {
        const addParticipantsSchema = z.object({
            numbers: z.array(z.string()).min(1)
        });

        try {
            const { name, jid } = request.params as { name: string; jid: string };
            const body = addParticipantsSchema.parse(request.body);
            const { numbers } = body;

            server.log.info(`Adding ${numbers.length} participants to group ${jid} via instance ${name}`);

            const result = await evolution.addParticipants(name, jid, numbers);

            const results = Array.isArray(result)
                ? result.map((r: any) => ({
                    number: r.jid?.split('@')[0] || r.participant || '',
                    status: r.status || 'unknown',
                    error: r.error || null,
                }))
                : [];

            return { success: true, results };
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({ error: 'Validation Error', details: (error as any).errors });
            }
            server.log.error('Error adding participants:', error.message);
            return reply.code(500).header('Access-Control-Allow-Origin', '*').send({ error: error.message || 'Failed to add participants' });
        }
    });

    // Route to delete an Evolution instance
    server.delete('/api/instances/:name', async (request, reply) => {
        try {
            const { name } = request.params as { name: string };
            if (!name) return reply.code(400).send({ error: 'Instance name required' });

            server.log.info(`Deleting Evolution instance: ${name}`);

            try {
                await evolution.logoutInstance(name);
                await evolution.deleteInstance(name);
            } catch (e: any) {
                server.log.warn(`Evolution API warning deleting ${name}: ${e.message}`);
            }

            const { data: instanceData } = await supabase.from('instances').select('id').eq('name', name).single();
            if (instanceData) {
                await supabase.from('groups').delete().eq('instance_id', instanceData.id);
            }

            const { error } = await supabase.from('instances').delete().eq('name', name);
            if (error) throw error;

            return { success: true, message: `Instance ${name} deleted successfully` };
        } catch (error: any) {
            server.log.error(error);
            return reply.code(500).header('Access-Control-Allow-Origin', '*').send({ error: error.message || 'Failed to delete instance' });
        }
    });
}
