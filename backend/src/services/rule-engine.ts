import { redisConnection as redis, supabase, evolution } from '../db';
import { StrikeManager } from './strike-manager';
import { AIService } from './ai-service';

export class RuleEngine {

    static async processMessage(payload: any) {
        if (!payload.data || !payload.data.key) return;

        const message = payload.data;
        const instanceName = payload.instance;
        const groupJid = message.key.remoteJid;

        if (!groupJid.endsWith('@g.us')) return;
        if (message.key.fromMe) return;

        const senderJid = message.key.participant || groupJid;
        const messageType = message.messageType;
        const textContent: string = message.message?.conversation || message.message?.extendedTextMessage?.text || '';

        // 1. Busca configuração do grupo com cache Redis (10 min)
        const groupCacheKey = `group_rules:${instanceName}:${groupJid}`;
        const groupSettingsStr = await redis.get(groupCacheKey);
        let groupConfig: { id: string; rules: Record<string, any>; blacklist: string[] };

        if (groupSettingsStr) {
            groupConfig = JSON.parse(groupSettingsStr);
        } else {
            const { data: groupData } = await supabase
                .from('groups')
                .select('id, rules, blacklist')
                .eq('jid', groupJid)
                .single();

            if (!groupData) return;

            groupConfig = { id: groupData.id, rules: groupData.rules || {}, blacklist: groupData.blacklist || [] };
            await redis.set(groupCacheKey, JSON.stringify(groupConfig), 'EX', 600);
        }

        const { id: groupId, rules, blacklist } = groupConfig;

        // Incrementa contagem de mensagens para engajamento (não bloqueia se falhar)
        StrikeManager.incrementMessageCount(groupId, senderJid).catch(err =>
            console.error('[RULE-ENGINE] Failed to increment message count:', err)
        );

        if (rules.moderationEnabled === false) return;

        // 2. Flood Control — usa SET com NX + EX para atomicidade
        if (rules.floodControl) {
            const floodKey = `flood:${groupId}:${senderJid}`;
            const windowSeconds = rules.floodWindowSeconds || 10;
            const maxMessages = rules.floodMaxMessages || 5;

            // INCR é atômico; SET EX na primeira vez garante expiração sem race condition
            const msgsInWindow = await redis.incr(floodKey);
            if (msgsInWindow === 1) {
                await redis.expire(floodKey, windowSeconds);
            }

            if (msgsInWindow > maxMessages) {
                await evolution.deleteMessage(instanceName, groupJid, message.key.id, false);
                await StrikeManager.addStrike(groupId, senderJid, 'Envio múltiplo de mensagens (Flood)', instanceName, groupJid);
                return;
            }
        }

        // 3. Detecção de panfleteiro (múltiplos links em janela curta)
        if (rules.panfleteiroAlert && textContent.includes('http')) {
            const linkTrackerKey = `links:${groupId}:${senderJid}`;
            const linksInWindow = await redis.incr(linkTrackerKey);
            if (linksInWindow === 1) {
                await redis.expire(linkTrackerKey, 300); // janela de 5 minutos
            }

            if (linksInWindow >= 3) {
                const alertKey = `alert_sent:${groupId}:${senderJid}`;
                const alreadyAlerted = await redis.get(alertKey);

                if (!alreadyAlerted) {
                    await evolution.sendText(
                        instanceName,
                        groupJid,
                        `⚠️ *ALERTA DE COMPORTAMENTO* ⚠️\nO usuário @${senderJid.split('@')[0]} enviou múltiplos links em pouco tempo. Possível panfletagem detectada.`
                    );

                    try {
                        const instancesRes = await evolution.fetchInstances();
                        const instancesArray = Array.isArray(instancesRes) ? instancesRes : (instancesRes as any)?.data || [];
                        const myInstance = instancesArray.find((i: any) =>
                            i.name === instanceName || i.instance?.instanceName === instanceName
                        );
                        const ownerJid = myInstance?.ownerJid || myInstance?.instance?.ownerJid;

                        if (ownerJid) {
                            await evolution.sendText(
                                instanceName,
                                ownerJid,
                                `🚨 *ALERTA DE SEGURANÇA*\n\nComportamento suspeito no grupo: *${groupJid}*\nUsuário: @${senderJid.split('@')[0]}\nAção: Envio de 3+ links em janela de 5 minutos.`
                            );
                        }
                    } catch (err) {
                        console.error('[RULE-ENGINE] Failed to send private alert to owner:', err);
                    }

                    await redis.set(alertKey, '1', 'EX', 1800); // silencia por 30 min
                }
            }
        }

        // 4. Bloqueio de mídia
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

        // 5. Bloqueio de links (regex)
        if (!isInfraction && rules.blockLinks && textContent) {
            if (/(https?:\/\/[^\s]+)/g.test(textContent)) {
                isInfraction = true;
                infractionReason = 'Envio de links não autorizado';
            }
        }

        if (isInfraction) {
            try {
                await evolution.deleteMessage(instanceName, groupJid, message.key.id, false);
                await StrikeManager.addStrike(groupId, senderJid, infractionReason, instanceName, groupJid);
            } catch (err) {
                console.error('[RULE-ENGINE] Failed to delete message or add strike:', err);
            }
            return;
        }

        // 6. Validação de blacklist por IA
        if (rules.aiBlacklist && textContent.length > 3 && blacklist.length > 0) {
            const evaluation = await AIService.evaluateMessageIntent(textContent, blacklist);
            if (evaluation.isInfraction) {
                try {
                    await evolution.deleteMessage(instanceName, groupJid, message.key.id, false);
                    await StrikeManager.addStrike(groupId, senderJid, `Filtro de IA: ${evaluation.reason}`, instanceName, groupJid);
                } catch (err) {
                    console.error('[RULE-ENGINE] Failed to delete message (AI blacklist):', err);
                }
                return;
            }
        }

        // 7. Enforcement de tópico por IA
        if (rules.enforceTopic && rules.topic && textContent.length > 20) {
            const topicEvaluation = await AIService.evaluateTopicConsistency(textContent, rules.topic);
            if (topicEvaluation.isInfraction) {
                try {
                    await evolution.deleteMessage(instanceName, groupJid, message.key.id, false);
                    await StrikeManager.addStrike(groupId, senderJid, `Mensagem Fora do Tópico: ${topicEvaluation.reason}`, instanceName, groupJid);
                } catch (err) {
                    console.error('[RULE-ENGINE] Failed to delete off-topic message:', err);
                }
            }
        }
    }
}
