import Redis from 'ioredis';
import { ICacheProvider } from '@application/ports/ICacheProvider';
import { env } from '@shared/config/env';
import { createChildLogger } from '@shared/logger/logger';

const log = createChildLogger('RedisProvider');

export class RedisProvider implements ICacheProvider {
  private readonly client: Redis;

  constructor() {
    this.client = new Redis({
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD,
      db: env.REDIS_DB,
      lazyConnect: true,
      retryStrategy: (times) => Math.min(times * 100, 3000),
      enableReadyCheck: true,
    });

    this.client.on('connect', () => log.info('Redis connected'));
    this.client.on('error', (err) => log.error({ err }, 'Redis error'));
  }

  async connect(): Promise<void> {
    await this.client.connect();
  }

  async disconnect(): Promise<void> {
    await this.client.quit();
  }

  get rawClient(): Redis {
    return this.client;
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    if (value === null) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, serialized);
    } else {
      await this.client.set(key, serialized);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const count = await this.client.exists(key);
    return count > 0;
  }

  async increment(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    await this.client.expire(key, ttlSeconds);
  }

  async addToSet(key: string, member: string): Promise<void> {
    await this.client.sadd(key, member);
  }

  async isMemberOfSet(key: string, member: string): Promise<boolean> {
    const result = await this.client.sismember(key, member);
    return result === 1;
  }
}
