import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createFrontendLogger, installGlobalLogging, resolveFrontendLoggerConfig } from './logger';

describe('frontend logger config', () => {
  it('defaults to debug in development and warn in production', () => {
    expect(resolveFrontendLoggerConfig({ MODE: 'development', DEV: true }).level).toBe('debug');
    expect(resolveFrontendLoggerConfig({ MODE: 'production', PROD: true }).level).toBe('warn');
  });

  it('supports explicit level, format, buffer size, and debug API toggle', () => {
    expect(
      resolveFrontendLoggerConfig({
        VITE_LOG_LEVEL: 'error',
        VITE_LOG_FORMAT: 'json',
        VITE_LOG_BUFFER_SIZE: '2',
        VITE_LOG_DEBUG_PANEL: 'false',
      }),
    ).toEqual({
      level: 'error',
      format: 'json',
      bufferSize: 2,
      debugPanel: false,
    });
  });
});

describe('frontend logger behavior', () => {
  beforeEach(() => {
    vi.spyOn(console, 'debug').mockImplementation(() => undefined);
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete window.__APP_LOGS__;
  });

  it('respects level filtering', () => {
    const logger = createFrontendLogger({
      level: 'warn',
      format: 'pretty',
      bufferSize: 10,
      debugPanel: true,
    });

    logger.debug('hidden');
    logger.info('hidden');
    logger.warn('visible');

    expect(logger.api.get()).toHaveLength(1);
    expect(logger.api.get()[0].message).toBe('visible');
  });

  it('keeps only the configured number of buffered entries', () => {
    const logger = createFrontendLogger({
      level: 'debug',
      format: 'pretty',
      bufferSize: 2,
      debugPanel: true,
    });

    logger.info('one');
    logger.info('two');
    logger.info('three');

    expect(logger.api.get().map((entry) => entry.message)).toEqual(['two', 'three']);
  });

  it('exports readable JSON and redacts obvious secrets', () => {
    const logger = createFrontendLogger({
      level: 'debug',
      format: 'json',
      bufferSize: 10,
      debugPanel: true,
    });

    logger.error('failed', { accessToken: 'secret-token', nested: { password: 'secret-password' } });

    const exported = JSON.parse(logger.api.export());
    expect(exported[0].context.accessToken).toBe('[redacted]');
    expect(exported[0].context.nested.password).toBe('[redacted]');
  });

  it('captures global browser errors and exposes the debug API when enabled', () => {
    const logger = createFrontendLogger({
      level: 'debug',
      format: 'pretty',
      bufferSize: 10,
      debugPanel: true,
    });

    installGlobalLogging(logger);
    window.dispatchEvent(new ErrorEvent('error', { message: 'boom' }));

    expect(window.__APP_LOGS__).toBeDefined();
    expect(logger.api.get()[0].message).toBe('Unhandled browser error');
  });

  it('does not expose the debug API when disabled', () => {
    const logger = createFrontendLogger({
      level: 'debug',
      format: 'pretty',
      bufferSize: 10,
      debugPanel: false,
    });

    installGlobalLogging(logger);

    expect(window.__APP_LOGS__).toBeUndefined();
  });
});
