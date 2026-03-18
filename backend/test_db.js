"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_js_1 = require("@supabase/supabase-js");
require("dotenv/config");
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
async function test() {
    console.log('--- RLS Policies ---');
    const { data, error } = await supabase.rpc('execute_sql', { sql: "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'launch_%';" });
    if (error) {
        // If execute_sql RPC doesn't exist, try a different approach or just list tables
        console.log('execute_sql RPC failed, trying simple select...');
        const tables = ['launch_campaigns', 'launch_groups', 'launch_messages', 'launch_leads'];
        for (const table of tables) {
            const { data: rows, error: te } = await supabase.from(table).select('*').limit(1);
            console.log(`Table ${table}: ${te ? 'Error/Active RLS? (' + te.message + ')' : 'Data returned (Maybe RLS disabled/empty)'}`);
        }
    }
    else {
        console.log('RLS Status:', JSON.stringify(data, null, 2));
    }
}
test();
//# sourceMappingURL=test_db.js.map