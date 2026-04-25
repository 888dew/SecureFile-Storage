export interface ICacheProvider {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  increment(key: string): Promise<number>;
  expire(key: string, ttlSeconds: number): Promise<void>;
  addToSet(key: string, member: string): Promise<void>;
  isMemberOfSet(key: string, member: string): Promise<boolean>;
}
