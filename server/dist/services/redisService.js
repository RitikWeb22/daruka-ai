"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalRedis = exports.RedisService = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../../.env') });
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
class RedisService {
    client = null;
    isConnected = false;
    inMemoryFallback = new Map();
    constructor() {
        this.init();
    }
    init() {
        const rawUrl = process.env.REDIS_URL?.trim();
        if (!rawUrl) {
            console.log('[Redis] No REDIS_URL configured. Operating in high-speed in-memory store mode.');
            return;
        }
        try {
            let options = {
                maxRetriesPerRequest: 1,
                connectTimeout: 5000,
                enableOfflineQueue: false,
                retryStrategy: (times) => {
                    if (times > 3) {
                        console.warn('[Redis] Max reconnection attempts reached. Reverting to memory fallback.');
                        return null; // Stop retrying
                    }
                    return Math.min(times * 500, 2000);
                }
            };
            if (rawUrl.startsWith('redis://') || rawUrl.startsWith('rediss://')) {
                this.client = new ioredis_1.default(rawUrl, options);
            }
            else {
                // If user provided a password or host without URI scheme
                const host = process.env.REDIS_HOST || '127.0.0.1';
                const port = Number(process.env.REDIS_PORT) || 6379;
                this.client = new ioredis_1.default({
                    ...options,
                    host,
                    port,
                    password: rawUrl // treat raw string as password/token
                });
            }
            this.client.on('connect', () => {
                this.isConnected = true;
                console.log('✅ [Redis] Connected successfully to Redis server via ioredis.');
            });
            this.client.on('ready', () => {
                this.isConnected = true;
            });
            this.client.on('error', (err) => {
                this.isConnected = false;
                console.warn(`⚠️ [Redis] Connection notice (${err.message}). Using resilient in-memory fallback.`);
            });
            this.client.on('close', () => {
                this.isConnected = false;
            });
        }
        catch (err) {
            console.warn(`⚠️ [Redis] Initialization failed (${err.message}). Continuing with in-memory fallback.`);
            this.client = null;
            this.isConnected = false;
        }
    }
    async get(key) {
        if (this.client && this.isConnected) {
            try {
                const data = await this.client.get(key);
                return data ? JSON.parse(data) : null;
            }
            catch (err) {
                // fallback to memory
            }
        }
        // In-memory fallback
        const item = this.inMemoryFallback.get(key);
        if (!item)
            return null;
        if (item.expiresAt && Date.now() > item.expiresAt) {
            this.inMemoryFallback.delete(key);
            return null;
        }
        return JSON.parse(item.value);
    }
    async set(key, value, ttlSeconds = 86400) {
        const serialized = JSON.stringify(value);
        // Save to memory cache as well
        this.inMemoryFallback.set(key, {
            value: serialized,
            expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined
        });
        if (this.client && this.isConnected) {
            try {
                if (ttlSeconds) {
                    await this.client.set(key, serialized, 'EX', ttlSeconds);
                }
                else {
                    await this.client.set(key, serialized);
                }
                return true;
            }
            catch (err) {
                return false;
            }
        }
        return true;
    }
    async del(key) {
        this.inMemoryFallback.delete(key);
        if (this.client && this.isConnected) {
            try {
                await this.client.del(key);
                return true;
            }
            catch (err) {
                return false;
            }
        }
        return true;
    }
    isRedisActive() {
        return this.isConnected;
    }
    isLive() {
        return this.isConnected;
    }
    async disconnect() {
        if (this.client) {
            await this.client.quit().catch(() => { });
        }
    }
}
exports.RedisService = RedisService;
exports.globalRedis = new RedisService();
