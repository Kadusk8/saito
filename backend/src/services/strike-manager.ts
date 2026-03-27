import { redisConnection as redis, supabase, evolution } from '../db';

export class StrikeManager {

    static async addStrike(groupId: string, memberJid: string, reason: string, instanceName: string, groupJid: string) {
        const { data: member, error } = await supabase
            .from('members')
            .select('id, strikes, is_admin')
            .eq('group_id', groupId)
            .eq('jid', memberJid)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('[STRIKE-MANAGER] Error fetching member:', error);
            return;
        }

        // Admins são imunes a strikes
        if (member?.is_admin) return;

        const currentStrikes = (member?.strikes || 0) + 1;

        if (!member) {
            await supabase
                .from('members')
                .insert({ group_id: groupId, jid: memberJid, strikes: currentStrikes });
        } else {
            await supabase
                .from('members')
                .update({ strikes: currentStrikes })
                .eq('id', member.id);
        }

        await supabase.from('audit_logs').insert({
            group_id: groupId,
            member_jid: memberJid,
            action: 'strike_added',
            reason: `${reason} (Strike ${currentStrikes}/3)`
        });

        if (currentStrikes === 1) {
            await evolution.sendText(
                instanceName,
                groupJid,
                `⚠️ Atenção @${memberJid.split('@')[0]}, você recebeu seu primeiro Aviso (1/3). Motivo: ${reason}. Evite novas infrações para não ser banido.`
            );
        } else if (currentStrikes === 2) {
            await evolution.sendText(
                instanceName,
                groupJid,
                `⛔️ PERIGO @${memberJid.split('@')[0]}, este é seu SEGUNDO AVISO (2/3). O próximo resultará em banimento imediato. Motivo: ${reason}.`
            );
        } else if (currentStrikes >= 3) {
            await evolution.sendText(
                instanceName,
                groupJid,
                `🚨 LIMITE EXCEDIDO. @${memberJid.split('@')[0]} foi banido do grupo após 3 violações. Motivo Final: ${reason}`
            );
            await evolution.removeParticipant(instanceName, groupJid, memberJid);
            await supabase.from('audit_logs').insert({
                group_id: groupId,
                member_jid: memberJid,
                action: 'banned',
                reason: 'Maximum strikes reached'
            });
        }
    }

    static async resetStrikes(memberId: string) {
        await supabase.from('members').update({ strikes: 0 }).eq('id', memberId);
    }

    static async incrementMessageCount(groupId: string, memberJid: string) {
        // Usa upsert para evitar race condition entre SELECT + INSERT/UPDATE
        const { data: member, error } = await supabase
            .from('members')
            .select('id, message_count, lead_score')
            .eq('group_id', groupId)
            .eq('jid', memberJid)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('[STRIKE-MANAGER] Error fetching member for count:', error);
            return;
        }

        if (!member) {
            await supabase.from('members').insert({
                group_id: groupId,
                jid: memberJid,
                message_count: 1,
                lead_score: 1
            });
        } else {
            await supabase.from('members').update({
                message_count: (member.message_count || 0) + 1,
                lead_score: (member.lead_score || 0) + 1
            }).eq('id', member.id);
        }
    }
}
