import { Worker } from 'bullmq';
import { RuleEngine } from '../services/rule-engine';
import { redisConnection } from '../db';

// Create a worker that processes Evolution Webhooks
export const messageWorker = new Worker('message-processing', async (job) => {
    const payload = job.data;

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
}, { connection: redisConnection });

messageWorker.on('completed', (job) => {
    // console.log(`Processed webhook job ${job.id}`);
});

messageWorker.on('failed', (job, err) => {
    console.error(`Failed to process webhook ${job?.id}:`, err);
});
