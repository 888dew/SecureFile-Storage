import { DataSource } from 'typeorm';
import { env } from '@shared/config/env';
import { UserEntity } from './entities/UserEntity';
import { FileEntity } from './entities/FileEntity';
import { FileVersionEntity } from './entities/FileVersionEntity';
import { ShareEntity } from './entities/ShareEntity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  username: env.DB_USER,
  password: env.DB_PASSWORD,
  ssl: env.DB_SSL ? { rejectUnauthorized: false } : false,
  entities: [UserEntity, FileEntity, FileVersionEntity, ShareEntity],
  migrations: ['src/infrastructure/database/typeorm/migrations/*.ts'],
  synchronize: env.NODE_ENV === 'development', // Never true in production
  logging: env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  poolSize: env.DB_POOL_SIZE,
  connectTimeoutMS: 10000,
  extra: {
    max: env.DB_POOL_SIZE,
    min: 2,
    idleTimeoutMillis: 30000,
  },
});
