import Redis, { RedisOptions } from 'ioredis';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export class RedisService {
  private client: Redis | null = null;
  private isConnected = false;
  private inMemoryFallback: Map<string, { value: string; expiresAt?: number }> = new Map();

  constructor() {
    this.init();
  }

  private init(): void {
    const rawUrl = process.env.REDIS_URL?.trim();
    if (!rawUrl) {
      console.log('[Redis] No REDIS_URL configured. Operating in high-speed in-memory store mode.');
      return;
    }

    try {
      let options: RedisOptions = {
        maxRetriesPerRequest: 1,
        connectTimeout: 5000,
        enableOfflineQueue: false,
        retryStrategy: (times: number) => {
          if (times > 3) {
            console.warn('[Redis] Max reconnection attempts reached. Reverting to memory fallback.');
            return null; // Stop retrying
          }
          return Math.min(times * 500, 2000);
        }
      };

      if (rawUrl.startsWith('redis://') || rawUrl.startsWith('rediss://')) {
        this.client = new Redis(rawUrl, options);
      } else {
        // If user provided a password or host without URI scheme
        const host = process.env.REDIS_HOST || '127.0.0.1';
        const port = Number(process.env.REDIS_PORT) || 6379;
        this.client = new Redis({
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

      this.client.on('error', (err: Error) => {
        this.isConnected = false;
        console.warn(`⚠️ [Redis] Connection notice (${err.message}). Using resilient in-memory fallback.`);
      });

      this.client.on('close', () => {
        this.isConnected = false;
      });
    } catch (err: any) {
      console.warn(`⚠️ [Redis] Initialization failed (${err.message}). Continuing with in-memory fallback.`);
      this.client = null;
      this.isConnected = false;
    }
  }

  public async get<T>(key: string): Promise<T | null> {
    if (this.client && this.isConnected) {
      try {
        const data = await this.client.get(key);
        return data ? JSON.parse(data) : null;
      } catch (err) {
        // fallback to memory
      }
    }

    // In-memory fallback
    const item = this.inMemoryFallback.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.inMemoryFallback.delete(key);
      return null;
    }
    return JSON.parse(item.value);
  }

  public async set(key: string, value: any, ttlSeconds = 86400): Promise<boolean> {
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
        } else {
          await this.client.set(key, serialized);
        }
        return true;
      } catch (err) {
        return false;
      }
    }

    return true;
  }

  public async del(key: string): Promise<boolean> {
    this.inMemoryFallback.delete(key);
    if (this.client && this.isConnected) {
      try {
        await this.client.del(key);
        return true;
      } catch (err) {
        return false;
      }
    }
    return true;
  }

  public isRedisActive(): boolean {
    return this.isConnected;
  }

  public isLive(): boolean {
    return this.isConnected;
  }

  public async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit().catch(() => {});
    }
  }
}

export const globalRedis = new RedisService();
