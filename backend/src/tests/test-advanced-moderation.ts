import 'dotenv/config';
import { RuleEngine } from '../services/rule-engine';
import { supabase, redisConnection as redis } from '../db';

const GROUP_JID = '120363399572244431@g.us';
const INSTANCE_NAME = 'kadu';
const SENDER_JID = '5511999999999@s.whatsapp.net';

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
    console.log('🚀 Starting Advanced Moderation Tests...');

    // Cleanup Supabase member strikes/count for this test
    console.log(`🧹 Cleaning up Supabase data for ${SENDER_JID}...`);
    await supabase.from('members').delete().eq('jid', SENDER_JID).eq('group_id', '61aac9b3-a441-4bd0-98ab-4cc045468f1d');

    // Cleanup Redis keys for this group/sender to start fresh
    console.log('🧹 Cleaning up Redis keys...');
    const keys = await redis.keys(`*:${GROUP_JID}:${SENDER_JID}*`);
    const groupKeys = await redis.keys(`group_rules:${INSTANCE_NAME}:${GROUP_JID}*`);
    if (keys.length > 0) await redis.del(...keys);
    if (groupKeys.length > 0) await redis.del(...groupKeys);

    // 1. Test Flood Control
    console.log('\n--- 1. Testing Flood Control ---');
    console.log('Sending 4 messages rapidly (Limit is 3)...');
    for (let i = 1; i <= 4; i++) {
        console.log(`Sending message ${i}...`);
        try {
            await RuleEngine.processMessage({
                instance: INSTANCE_NAME,
                data: {
                    key: { remoteJid: GROUP_JID, participant: `551198888777${i}@s.whatsapp.net`, id: `test-flood-${i}` },
                    message: { conversation: `Mensagem de teste flood ${i}` },
                    messageType: 'conversation'
                }
            });
        } catch (e) {
            console.error(`Flood test msg ${i} error (ignoring for strike test):`, e);
        }
        await sleep(1000);
    }

    await sleep(2000);

    // 2. Test Behavior Alert (Panfleteiro)
    console.log('\n--- 2. Testing Behavior Alert (Panfleteiros) ---');
    console.log('Sending 3 links rapidly...');
    const PANFLETEIRO_JID = '5511777777777@s.whatsapp.net';
    for (let i = 1; i <= 3; i++) {
        console.log(`Sending link ${i}...`);
        try {
            await RuleEngine.processMessage({
                instance: INSTANCE_NAME,
                data: {
                    key: { remoteJid: GROUP_JID, participant: PANFLETEIRO_JID, id: `test-link-${i}` },
                    message: { conversation: `Confira este link ${i}: http://example.com/${i}` },
                    messageType: 'conversation'
                }
            });
        } catch (e) {
            console.error(`Link test msg ${i} error (ignoring):`, e);
        }
        await sleep(1000);
    }

    await sleep(5000); // Wait for AI cooldown

    // 3. Test AI Blacklist (Intent)
    console.log('\n--- 3. Testing AI Blacklist (Intent) ---');
    console.log('Sending offensive/scam message...');
    try {
        await RuleEngine.processMessage({
            instance: INSTANCE_NAME,
            data: {
                key: { remoteJid: GROUP_JID, participant: '5511666666666@s.whatsapp.net', id: `test-ai-blacklist` },
                message: { conversation: `Isso aqui é um g0lp3 do tigrinho, clique e perca dinheiro` },
                messageType: 'conversation'
            }
        });
    } catch (e) { console.error('AI Blacklist test error:', e); }

    await sleep(5000);

    // 4. Test AI Topic Enforcement
    console.log('\n--- 4. Testing AI Topic Enforcement ---');
    console.log('Topic is "Tecnologia, IA e Automação". Sending off-topic message...');
    try {
        await RuleEngine.processMessage({
            instance: INSTANCE_NAME,
            data: {
                key: { remoteJid: GROUP_JID, participant: '5511555555555@s.whatsapp.net', id: `test-ai-topic` },
                message: { conversation: `Como fazer um bolo de cenoura com cobertura de chocolate bem fofinho?` },
                messageType: 'conversation'
            }
        });
    } catch (e) { console.error('AI Topic test error:', e); }

    console.log('\n✅ Tests Simulation Complete.');
    console.log('Check the console logs above for deletion/strike triggers.');
    console.log('Also check "audit_logs" and "members" tables in Supabase.');
    
    process.exit(0);
}

runTests().catch(err => {
    console.error('Test Suite Failed:', err);
    process.exit(1);
});
