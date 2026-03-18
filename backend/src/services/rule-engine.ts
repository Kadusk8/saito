import { redisConnection as redis, supabase, evolution } from '../db';
import { StrikeManager } from './strike-manager';
import { AIService } from './ai-service';

export class RuleEngine {

    static async processMessage(payload: any) {
        if (!payload.data || !payload.data.key) return;

        const message = payload.data;
        const instanceName = payload.instance;
        const groupJid = message.key.remoteJid;
        const isGroup = groupJid.endsWith('@g.us');

        // Only process group messages for now
        if (!isGroup) return;

        // Ignore our own messages
        if (message.key.fromMe) return;
        
        const senderJid = message.key.participant || groupJid;
        const messageType = message.messageType;
        // Types from Evolution: conversation, extendedTextMessage, imageMessage, audioMessage, videoMessage, stickerMessage

        const textContent = message.message?.conversation || message.message?.extendedTextMessage?.text || "";

        // 1. Get Group Configuration from Supabase Cache / DB
        // Simple caching via Redis for high-frequency queries
        const groupCacheKey = `group_rules:${instanceName}:${groupJid}`;
        let groupSettingsStr = await redis.get(groupCacheKey);
        let groupConfig;

        if (!groupSettingsStr) {
            // Query DB to find the group ID and rules
            const { data: groupData } = await supabase
                .from('groups')
                .select('id, rules, blacklist')
                .eq('jid', groupJid)
                .single();

            if (!groupData) {
                // Not registered in our SaaS yet or disabled
                return;
            }
            groupConfig = { id: groupData.id, rules: groupData.rules, blacklist: groupData.blacklist };
            await redis.set(groupCacheKey, JSON.stringify(groupConfig), 'EX', 600); // 10 min cache
        } else {
            groupConfig = JSON.parse(groupSettingsStr);
        }

        const groupId = groupConfig.id;
        const rules = groupConfig.rules || {};

        // --- Post counting (Engagement) ---
        console.log(`[RULE-ENGINE] Incrementing message count for member ${senderJid} in groupId ${groupId}`);
        await StrikeManager.incrementMessageCount(groupId, senderJid);

        // Enable/Disable global toggle
        console.log(`[RULE-ENGINE] Moderation enabled: ${rules.moderationEnabled}`);
        if (rules.moderationEnabled === false) {
            console.log(`[RULE-ENGINE] Moderation is disabled for this group.`);
            return;
        }

        console.log(`[RULE-ENGINE] Proceeding with rule checks...`);

        // 2. Flood Control Check (Rate Limiting)
        if (rules.floodControl) {
            const floodKey = `flood:${groupId}:${senderJid}`;
            // Incerment message count
            const msgsInWindow = await redis.incr(floodKey);

            if (msgsInWindow === 1) {
                // Set window to 10 seconds (configurable)
                await redis.expire(floodKey, rules.floodWindowSeconds || 10);
            }

            if (msgsInWindow > (rules.floodMaxMessages || 5)) {
                await evolution.deleteMessage(instanceName, groupJid, message.key.id, message.key.fromMe || false);
                await StrikeManager.addStrike(groupId, senderJid, 'Envio múltiplo de mensagens (Flood)', instanceName, groupJid);
                return; // Stop further processing for this message
            }
        }

        // 2. Behavior Alerts (Panfleteiros) - Detect rapid link posting
        // This runs before infractions so it works even if links are blocked
        if (rules.panfleteiroAlert && textContent.includes('http')) {
            const linkTrackerKey = `links:${groupId}:${senderJid}`;
            const linksInWindow = await redis.incr(linkTrackerKey);
            if (linksInWindow === 1) {
                await redis.expire(linkTrackerKey, 300); // 5 minutes window
            }

            console.log(`[RULE-ENGINE] Link detected for ${senderJid}. Count in window: ${linksInWindow}`);

            if (linksInWindow >= 3) {
                // Potential panfleteiro alert
                const alertKey = `alert_sent:${groupId}:${senderJid}`;
                const alreadyAlerted = await redis.get(alertKey);

                if (!alreadyAlerted) {
                    console.log(`[RULE-ENGINE] Alerting admins for panfleteiro: ${senderJid}`);
                    
                    // 1. Notify the group
                    await evolution.sendText(instanceName, groupJid, `⚠️ *ALERTA DE COMPORTAMENTO* ⚠️\nO usuário @${senderJid.split('@')[0]} enviou múltiplos links em pouco tempo. Possível panfletagem detectada.`);
                    
                    // 2. Notify the Instance Owner privately
                    try {
                        const instancesRes = await evolution.fetchInstances();
                        const instancesArray = Array.isArray(instancesRes) ? instancesRes : (instancesRes as any)?.data || [];
                        const myInstance = instancesArray.find((i: any) => i.name === instanceName || i.instance?.instanceName === instanceName);
                        const ownerJid = myInstance?.ownerJid || myInstance?.instance?.ownerJid;

                        if (ownerJid) {
                            await evolution.sendText(instanceName, ownerJid, `🚨 *ALERTA DE SEGURANÇA*\n\nComportamento suspeito no grupo: *${groupConfig.name || groupJid}*\nUsuário: @${senderJid.split('@')[0]}\nAção: Envio de 3+ links em janela de 5 minutos.\n\n_Dica: Verifique se o usuário é um spammer ou se o conteúdo é legítimo._`);
                        }
                    } catch (err) {
                        console.error("[RULE-ENGINE] Failed to send private alert to owner:", err);
                    }

                    await redis.set(alertKey, '1', 'EX', 1800); // Only alert once every 30 mins
                }
            }
        }

        // 3. Media Blocking (Selective)
        let isInfraction = false;
        let infractionReason = '';

        if (rules.blockAudio && messageType === 'audioMessage') {
            isInfraction = true; infractionReason = 'Áudios não são permitidos neste grupo';
        } else if (rules.blockImage && messageType === 'imageMessage') {
            isInfraction = true; infractionReason = 'Imagens não são permitidas neste grupo';
        } else if (rules.blockVideo && messageType === 'videoMessage') {
            isInfraction = true; infractionReason = 'Vídeos não são permitidos neste grupo';
        } else if (rules.blockSticker && messageType === 'stickerMessage') {
            isInfraction = true; infractionReason = 'Figurinhas (Stickers) não são permitidos';
        }

        // 4. Basic Link Blocking (Regex)
        if (!isInfraction && rules.blockLinks && textContent) {
            const urlRegex = /(https?:\/\/[^\s]+)/g;
            if (urlRegex.test(textContent)) {
                isInfraction = true;
                infractionReason = 'Envio de links não autorizado';
            }
        }

        // 5. Apply Basic Infraction (Delete & Strike)
        if (isInfraction) {
            // Deletar a mensagem ofensiva na Evolution
            try {
                await evolution.deleteMessage(instanceName, groupJid, message.key.id, message.key.fromMe || false);
                await StrikeManager.addStrike(groupId, senderJid, infractionReason, instanceName, groupJid);
                return;
            } catch (err) {
                console.error("Failed to delete message", err);
            }
        }

        // 6. Advanced AI Blacklist Validation (Dynamic Intent checking)
        if (!isInfraction && rules.aiBlacklist && textContent.length > 3) {
            // Check if group has words defined in blacklist array
            const blacklistList = groupConfig.blacklist || [];
            if (blacklistList.length > 0) {
                const evaluation = await AIService.evaluateMessageIntent(textContent, blacklistList);

                if (evaluation.isInfraction) {
                    try {
                        await evolution.deleteMessage(instanceName, groupJid, message.key.id, message.key.fromMe || false);
                        await StrikeManager.addStrike(groupId, senderJid, `Filtro de IA: ${evaluation.reason}`, instanceName, groupJid);
                        return;
                    } catch (err) {
                        console.error("Failed to delete message (AI Step)", err);
                    }
                }
            }
        }

        // 7. AI Topic Enforcement
        console.log(`[RULE-ENGINE] Checking topic enforcement. status=${rules.enforceTopic}, topic="${rules.topic}", textLen=${textContent.length}`);
        if (!isInfraction && rules.enforceTopic && rules.topic && textContent.length > 20) {
            console.log(`[RULE-ENGINE] Triggering AI topic evaluation for: "${textContent.substring(0, 30)}..."`);
            const topicEvaluation = await AIService.evaluateTopicConsistency(textContent, rules.topic);
            console.log(`[RULE-ENGINE] Topic evaluation result:`, topicEvaluation);
            if (topicEvaluation.isInfraction) {
                try {
                    await evolution.deleteMessage(instanceName, groupJid, message.key.id, message.key.fromMe || false);
                    await StrikeManager.addStrike(groupId, senderJid, `Mensagem Fora do Tópico: ${topicEvaluation.reason}`, instanceName, groupJid);
                    return;
                } catch (err) {
                    console.error("Failed to delete off-topic message", err);
                }
            }
        }
    }
}
