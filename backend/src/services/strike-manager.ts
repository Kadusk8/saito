import { redisConnection as redis, supabase, evolution } from '../db';

export class StrikeManager {
    static async addStrike(groupId: string, memberJid: string, reason: string, instanceName: string, groupJid: string) {
        console.log(`[STRIKE-MANAGER] Adding strike to member ${memberJid} in group ${groupId}. Reason: ${reason}`);
        // 1. Fetch member from Supabase
        const { data: member, error } = await supabase
            .from('members')
            .select('id, strikes, is_admin')
            .eq('group_id', groupId)
            .eq('jid', memberJid)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = not found
            console.error("Error fetching member:", error);
            return;
        }

        // Admins are immune
        if (member && member.is_admin) {
            console.log(`Bypass strike for admin: ${memberJid}`);
            return;
        }

        let memberId = member?.id;
        let currentStrikes = member?.strikes || 0;

        // 2. Increment strikes
        currentStrikes += 1;

        if (!memberId) {
            // Create member if not exists
            const { data: newMember } = await supabase
                .from('members')
                .insert({ group_id: groupId, jid: memberJid, strikes: currentStrikes })
                .select('id')
                .single();
            memberId = newMember?.id;
        } else {
            // Update existence
            await supabase
                .from('members')
                .update({ strikes: currentStrikes })
                .eq('id', memberId);
        }

        // 3. Log the application of the strike
        await supabase.from('audit_logs').insert({
            group_id: groupId,
            member_jid: memberJid,
            action: 'strike_added',
            reason: reason + ` (Strike ${currentStrikes}/3)`
        });

        // 4. Apply configured consequences (Aviso 1 > Aviso 2 > Ban)
        if (currentStrikes === 1) {
            await evolution.sendText(instanceName, groupJid, `⚠️ Atenção @${memberJid.split('@')[0]}, você recebeu seu primeiro Aviso (1/3). Motivo: ${reason}. Evite novas infrações para não ser banido.`);
        } else if (currentStrikes === 2) {
            await evolution.sendText(instanceName, groupJid, `⛔️ PERIGO @${memberJid.split('@')[0]}, este é seu SEGUNDO AVISO (2/3). O próximo resultará em banimento imediato. Motivo: ${reason}.`);
        } else if (currentStrikes >= 3) {
            await evolution.sendText(instanceName, groupJid, `🚨 LIMITE EXCEDIDO. @${memberJid.split('@')[0]} foi banido do grupo após 3 violações. Motivo Final: ${reason}`);
            await evolution.removeParticipant(instanceName, groupJid, memberJid);

            // Log banimento final
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
        console.log(`[STRIKE-MANAGER] Incrementing count for ${memberJid} in group ${groupId}`);
        // We use a "upsert-like" logic. If member exists, increment. 
        // If not, we create it (this helps with members who were already in the group before the bot).
        const { data: member, error } = await supabase
            .from('members')
            .select('id, message_count, lead_score')
            .eq('group_id', groupId)
            .eq('jid', memberJid)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error("[STRIKE-MANAGER] Error fetching member for count:", error);
        }

        if (!member) {
            console.log(`[STRIKE-MANAGER] Creating new member record for ${memberJid}`);
            await supabase.from('members').insert({
                group_id: groupId,
                jid: memberJid,
                message_count: 1,
                lead_score: 1 
            });
        } else {
            const newCount = (member.message_count || 0) + 1;
            const newScore = (member.lead_score || 0) + 1;
            console.log(`[STRIKE-MANAGER] Updating member ${member.id}: count=${newCount}, score=${newScore}`);
            await supabase.from('members').update({
                message_count: newCount,
                lead_score: newScore
            }).eq('id', member.id);
        }
    }
}
