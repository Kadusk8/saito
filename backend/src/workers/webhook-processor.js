"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageWorker = void 0;
const bullmq_1 = require("bullmq");
const rule_engine_1 = require("../services/rule-engine");
const db_1 = require("../db");
// Create a worker that processes Evolution Webhooks
exports.messageWorker = new bullmq_1.Worker('message-processing', async (job) => {
    const payload = job.data;
    if (['messages.upsert', 'MESSAGES_UPSERT'].includes(payload.event)) {
        // Each message payload can contain multiple messages
        let messages = payload.data?.message || payload.data?.messages || [];
        // Ensure it is an array
        if (!Array.isArray(messages)) {
            messages = [messages];
        }
        for (const messageData of messages) {
            await rule_engine_1.RuleEngine.processMessage({
                instance: payload.instance,
                data: messageData
            }).catch(err => console.error(`[RULE-ENGINE] Error processing message:`, err));
        }
    }
}, { connection: db_1.redisConnection });
exports.messageWorker.on('completed', (job) => {
    // console.log(`Processed webhook job ${job.id}`);
});
exports.messageWorker.on('failed', (job, err) => {
    console.error(`Failed to process webhook ${job?.id}:`, err);
});
//# sourceMappingURL=webhook-processor.js.map