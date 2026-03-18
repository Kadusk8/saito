"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.evolution = exports.messageQueue = exports.redisConnection = exports.supabase = void 0;
require("dotenv/config");
const supabase_js_1 = require("@supabase/supabase-js");
const ioredis_1 = __importDefault(require("ioredis"));
const bullmq_1 = require("bullmq");
const evolution_1 = require("./services/evolution");
// Supabase Setup
exports.supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
// Redis Setup
exports.redisConnection = new ioredis_1.default({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: null
});
// Queues
exports.messageQueue = new bullmq_1.Queue('message-processing', { connection: exports.redisConnection });
// Evolution API
exports.evolution = new evolution_1.EvolutionAPI(process.env.EVOLUTION_URL || 'http://localhost:8080', process.env.EVOLUTION_GLOBAL_KEY || 'global-api-key');
//# sourceMappingURL=db.js.map