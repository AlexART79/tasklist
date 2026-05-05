import { describe, expect, it } from 'vitest';
import { createAppLogger, redactPaths, resolveLoggerConfig } from '../logger';

describe('backend logger config', () => {
  it('uses developer-friendly defaults outside production and test', () => {
    const config = resolveLoggerConfig({ NODE_ENV: 'development' });

    expect(config).toMatchObject({
      level: 'debug',
      format: 'pretty',
      toConsole: true,
      toFile: true,
      dir: 'logs/backend',
    });
  });

  it('supports explicit level, format, destinations, and directory', () => {
    const config = resolveLoggerConfig({
      NODE_ENV: 'production',
      LOG_LEVEL: 'warn',
      LOG_FORMAT: 'pretty',
      LOG_TO_CONSOLE: 'false',
      LOG_TO_FILE: 'true',
      LOG_DIR: 'tmp/logs',
    });

    expect(config).toEqual({
      level: 'warn',
      format: 'pretty',
      toConsole: false,
      toFile: true,
      dir: 'tmp/logs',
    });
  });

  it('keeps tests quiet by default', () => {
    const config = resolveLoggerConfig({ NODE_ENV: 'test' });

    expect(config.level).toBe('silent');
    expect(config.toConsole).toBe(false);
    expect(config.toFile).toBe(false);
  });
});

describe('backend logger safety', () => {
  it('redacts common sensitive fields', () => {
    expect(redactPaths).toContain('req.headers.cookie');
    expect(redactPaths).toContain('req.headers.authorization');
    expect(redactPaths).toContain('*.secret');
    expect(redactPaths).toContain('*.accessToken');
  });

  it('filters messages below the configured level', () => {
    const logger = createAppLogger({
      level: 'warn',
      format: 'json',
      toConsole: false,
      toFile: false,
      dir: 'logs/backend',
    });

    expect(logger.isLevelEnabled('debug')).toBe(false);
    expect(logger.isLevelEnabled('info')).toBe(false);
    expect(logger.isLevelEnabled('warn')).toBe(true);
    expect(logger.isLevelEnabled('error')).toBe(true);
  });
});
