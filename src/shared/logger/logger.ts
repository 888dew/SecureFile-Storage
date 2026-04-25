import pino, { Logger } from 'pino';
import { env } from '@shared/config/env';

const transport =
  env.NODE_ENV !== 'production'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined;

export const logger: Logger = pino({
  level: env.LOG_LEVEL,
  transport,
  base: {
    service: 'securefile-storage',
    env: env.NODE_ENV,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.token'],
    censor: '[REDACTED]',
  },
});

export function createChildLogger(context: string, meta?: Record<string, unknown>): Logger {
  return logger.child({ context, ...meta });
}
