export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';
export type LogFormat = 'json' | 'pretty';

export interface LogEntry {
  timestamp: string;
  level: Exclude<LogLevel, 'silent'>;
  message: string;
  context?: unknown;
}

export interface FrontendLoggerConfig {
  level: LogLevel;
  format: LogFormat;
  bufferSize: number;
  debugPanel: boolean;
}

export interface AppLogsApi {
  get: () => LogEntry[];
  clear: () => void;
  export: () => string;
}

declare global {
  interface Window {
    __APP_LOGS__?: AppLogsApi;
  }
}

const order: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: 50,
};
const levels = new Set<LogLevel>(['debug', 'info', 'warn', 'error', 'silent']);
const formats = new Set<LogFormat>(['json', 'pretty']);
const sensitiveKeys = ['password', 'token', 'secret', 'authorization', 'cookie', 'accessToken', 'refreshToken'];

type EnvLike = Record<string, string | boolean | undefined>;

function envString(value: string | boolean | undefined) {
  return typeof value === 'string' ? value : undefined;
}

function envBoolean(value: string | boolean | undefined, fallback: boolean) {
  if (typeof value === 'boolean') return value;
  if (value === undefined) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

function envNumber(value: string | boolean | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function envLevel(value: string | boolean | undefined, fallback: LogLevel) {
  const raw = envString(value);
  return raw && levels.has(raw as LogLevel) ? (raw as LogLevel) : fallback;
}

function envFormat(value: string | boolean | undefined, fallback: LogFormat) {
  const raw = envString(value);
  return raw && formats.has(raw as LogFormat) ? (raw as LogFormat) : fallback;
}

export function resolveFrontendLoggerConfig(env: EnvLike = import.meta.env): FrontendLoggerConfig {
  const isProd = env.PROD === true || envString(env.MODE) === 'production';

  return {
    level: envLevel(env.VITE_LOG_LEVEL, isProd ? 'warn' : 'debug'),
    format: envFormat(env.VITE_LOG_FORMAT, 'pretty'),
    bufferSize: envNumber(env.VITE_LOG_BUFFER_SIZE, 500),
    debugPanel: envBoolean(env.VITE_LOG_DEBUG_PANEL, !isProd),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function redact(value: unknown): unknown {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  if (Array.isArray(value)) return value.map(redact);

  if (!isRecord(value)) return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      sensitiveKeys.some((sensitiveKey) => key.toLowerCase().includes(sensitiveKey.toLowerCase()))
        ? '[redacted]'
        : redact(entry),
    ]),
  );
}

function writeConsole(entry: LogEntry, format: LogFormat) {
  const method = entry.level === 'debug' ? 'debug' : entry.level === 'info' ? 'info' : entry.level;

  if (format === 'json') {
    console[method](JSON.stringify(entry));
    return;
  }

  if (entry.context === undefined) {
    console[method](`[${entry.level}] ${entry.message}`);
    return;
  }

  console[method](`[${entry.level}] ${entry.message}`, entry.context);
}

export function createFrontendLogger(config: FrontendLoggerConfig = resolveFrontendLoggerConfig()) {
  const buffer: LogEntry[] = [];

  function emit(level: Exclude<LogLevel, 'silent'>, message: string, context?: unknown) {
    if (order[level] < order[config.level]) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: context === undefined ? undefined : redact(context),
    };

    if (config.bufferSize > 0) {
      buffer.push(entry);
      if (buffer.length > config.bufferSize) buffer.splice(0, buffer.length - config.bufferSize);
    }

    writeConsole(entry, config.format);
  }

  const api: AppLogsApi = {
    get: () => [...buffer],
    clear: () => {
      buffer.length = 0;
    },
    export: () => JSON.stringify(buffer, null, 2),
  };

  return {
    debug: (message: string, context?: unknown) => emit('debug', message, context),
    info: (message: string, context?: unknown) => emit('info', message, context),
    warn: (message: string, context?: unknown) => emit('warn', message, context),
    error: (message: string, context?: unknown) => emit('error', message, context),
    api,
    config,
  };
}

export const logger = createFrontendLogger();

export function installGlobalLogging(appLogger = logger) {
  if (appLogger.config.debugPanel) {
    window.__APP_LOGS__ = appLogger.api;
  } else {
    delete window.__APP_LOGS__;
  }

  window.addEventListener('error', (event) => {
    appLogger.error('Unhandled browser error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    appLogger.error('Unhandled promise rejection', { reason: event.reason });
  });
}
