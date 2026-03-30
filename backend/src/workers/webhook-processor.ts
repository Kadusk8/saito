import { Worker } from 'bullmq';
import { RuleEngine } from '../services/rule-engine';
import { redisConnection, supabaseAdmin as supabase } from '../db';

// Create a worker that processes Evolution Webhooks
export const messageWorker = new Worker('message-processing', async (job) => {
    const payload = job.data;
    
    // 1. Process Messages for AI Moderation
    if (['messages.upsert', 'MESSAGES_UPSERT'].includes(payload.event)) {
        // Each message payload can contain multiple messages
        let messages = payload.data?.message || payload.data?.messages || [];
        
        // Ensure it is an array
        if (!Array.isArray(messages)) {
            messages = [messages];
        }
        
        for (const messageData of messages) {
            await RuleEngine.processMessage({
                instance: payload.instance,
                data: messageData
            }).catch(err => console.error(`[RULE-ENGINE] Error processing message:`, err));
        }
    }

    // 2. Process Group Participants Update for Overflow (Derramamento)
    if (['group.participants.update', 'GROUP_PARTICIPANTS_UPDATE'].includes(payload.event)) {
        const { id: group_jid, action, participants } = payload.data;
        const instance_name = payload.instance;
        
        if (!group_jid || !action || !participants) return;

        // Calculate member change
        let change = 0;
        if (action === 'add') change = participants.length;
        if (action === 'remove' || action === 'leave') change = -participants.length;

        if (change !== 0) {
            // Find if this group is currently the active one in any campaign
            const { data: activeGroup } = await supabase
                .from('launch_groups')
                .select('*, campaign:launch_campaigns(*, instance:instances(name))')
                .eq('group_jid', group_jid)
                .eq('is_active', true)
                .single();

            if (activeGroup) {
                // Verify instance match to avoid cross-tenant issues
                if (instance_name && activeGroup.campaign?.instance?.name && activeGroup.campaign.instance.name !== instance_name) {
                    return; // Instance mismatch
                }

                // Fetch current member count (fallback to default 1 admin if null)
                const currentCount = activeGroup.member_count || 1;
                const newCount = Math.max(0, currentCount + change);

                // Update real-time count in DB
                await supabase.from('launch_groups').update({ member_count: newCount }).eq('id', activeGroup.id);

                // Check limit
                const limit = activeGroup.campaign?.overflow_limit || 250;
                
                if (newCount >= limit) {
                    // Trigger overflow: Find next inactive group
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
                        // Switch active groups sequentially
                        await supabase.from('launch_groups').update({ is_active: false }).eq('id', activeGroup.id);
                        await supabase.from('launch_groups').update({ is_active: true }).eq('id', nextGroup.id);
                        console.log(`🔄 Super Grupos: Derramamento ativado! Limite de ${limit} batido. O novo grupo ativo é: ${nextGroup.group_name}`);
                    }
                }
            }
        }
    }

}, { connection: redisConnection });

messageWorker.on('completed', (_job) => {
    // console.log(`Processed webhook job ${job.id}`);
});

messageWorker.on('failed', (job, err) => {
    console.error(`Failed to process webhook ${job?.id}:`, err);
});
