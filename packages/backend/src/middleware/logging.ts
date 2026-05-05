import type { ErrorRequestHandler, RequestHandler } from 'express';
import pinoHttp from 'pino-http';
import type { Logger } from 'pino';
import { logger } from '../logger';

function getRequestId(req: Parameters<RequestHandler>[0]) {
  const header = req.headers['x-request-id'];
  return Array.isArray(header) ? header[0] : header;
}

export function buildRequestLogger(appLogger: Logger = logger): RequestHandler {
  return pinoHttp({
    logger: appLogger,
    genReqId: (req) => getRequestId(req) ?? crypto.randomUUID(),
    customProps: (req) => ({
      userId: req.user?.id,
    }),
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url,
          remoteAddress: req.remoteAddress,
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
    customLogLevel: (_req, res, err) => {
      if (err || res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
    customSuccessMessage: (req, res) => `${req.method} ${req.url} completed with ${res.statusCode}`,
    customErrorMessage: (req, res) => `${req.method} ${req.url} failed with ${res.statusCode}`,
  });
}

export const errorLogger: ErrorRequestHandler = (err, req, res, next) => {
  req.log?.error({ err }, 'Unhandled request error');

  if (res.headersSent) {
    next(err);
    return;
  }

  res.status(500).json({ error: 'Internal Server Error' });
};
