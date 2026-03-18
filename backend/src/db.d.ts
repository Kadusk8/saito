import 'dotenv/config';
import { Queue } from 'bullmq';
import { EvolutionAPI } from './services/evolution';
export declare const supabase: import("@supabase/supabase-js").SupabaseClient<any, "public", "public", any, any>;
export declare const redisConnection: any;
export declare const messageQueue: Queue<any, any, string, any, any, string>;
export declare const evolution: EvolutionAPI;
//# sourceMappingURL=db.d.ts.map