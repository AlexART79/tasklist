import fs from 'fs';
import path from 'path';
import { Writable } from 'stream';
import pino, { type DestinationStream, type Logger, type LoggerOptions, type StreamEntry } from 'pino';
import pretty from 'pino-pretty';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';
export type LogFormat = 'json' | 'pretty';

export interface LoggerConfig {
  level: LogLevel;
  format: LogFormat;
  toConsole: boolean;
  toFile: boolean;
  dir: string;
}

const levels = new Set<LogLevel>(['debug', 'info', 'warn', 'error', 'silent']);
const formats = new Set<LogFormat>(['json', 'pretty']);

function readBoolean(value: string | undefined, fallback: boolean) {
  if (value === undefined) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

function readLevel(value: string | undefined, fallback: LogLevel): LogLevel {
  return value && levels.has(value as LogLevel) ? (value as LogLevel) : fallback;
}

function readFormat(value: string | undefined, fallback: LogFormat): LogFormat {
  return value && formats.has(value as LogFormat) ? (value as LogFormat) : fallback;
}

export function resolveLoggerConfig(env: NodeJS.ProcessEnv = process.env): LoggerConfig {
  const isProduction = env.NODE_ENV === 'production';
  const isTest = env.NODE_ENV === 'test';

  return {
    level: readLevel(env.LOG_LEVEL, isProduction ? 'info' : isTest ? 'silent' : 'debug'),
    format: readFormat(env.LOG_FORMAT, isProduction ? 'json' : 'pretty'),
    toConsole: readBoolean(env.LOG_TO_CONSOLE, !isTest),
    toFile: readBoolean(env.LOG_TO_FILE, !isTest),
    dir: env.LOG_DIR ?? 'logs/backend',
  };
}

export const redactPaths = [
  'req.headers.cookie',
  'req.headers.authorization',
  'req.headers["set-cookie"]',
  'res.headers["set-cookie"]',
  'session',
  'sid',
  'cookie',
  '*.password',
  '*.token',
  '*.secret',
  '*.clientSecret',
  '*.accessToken',
  '*.refreshToken',
];

const blackhole = new Writable({
  write(_chunk, _encoding, callback) {
    callback();
  },
});

function ensureLogDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function buildStreams(config: LoggerConfig): StreamEntry[] {
  const streams: StreamEntry[] = [];

  if (config.toConsole) {
    streams.push({
      level: 'debug',
      stream:
        config.format === 'pretty'
          ? (pretty({
              colorize: true,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname',
            }) as DestinationStream)
          : process.stdout,
    });
  }

  if (config.toFile) {
    ensureLogDir(config.dir);
    streams.push({
      level: 'debug',
      stream: pino.destination({ dest: path.join(config.dir, 'app.log'), mkdir: true, sync: false }),
    });
    streams.push({
      level: 'error',
      stream: pino.destination({ dest: path.join(config.dir, 'error.log'), mkdir: true, sync: false }),
    });
  }

  return streams;
}

export function createAppLogger(config: LoggerConfig = resolveLoggerConfig()): Logger {
  const options: LoggerOptions = {
    level: config.level,
    base: { service: 'backend' },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
      paths: redactPaths,
      censor: '[redacted]',
    },
  };
  const streams = buildStreams(config);

  if (streams.length === 0) {
    return pino(options, blackhole);
  }

  return pino(options, pino.multistream(streams, { dedupe: false }));
}

export const logger = createAppLogger();
