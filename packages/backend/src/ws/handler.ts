import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import type { Duplex } from 'stream';
import * as cookie from 'cookie';
import * as cookieSignature from 'cookie-signature';
import type Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { eq, type InferSelectModel } from 'drizzle-orm';
import * as schema from '../db/schema';
import { users } from '../db/schema';
import { buildSqliteSessionStore } from '../auth/sessionStore';
import { queryNotifications } from './queryNotifications';
import type { ClientMessage, NotificationItem } from './types';
import { logger } from '../logger';

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

interface WsHandlerOptions {
  sqlite: Database.Database;
  db: DrizzleDb;
  intervalMs?: number;
}

const DEFAULT_INTERVAL_MS = Number(process.env.WS_INTERVAL_MS ?? 60_000);

function reject401(socket: Duplex) {
  socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
  socket.destroy();
}

export function buildWsHandler({ sqlite, db, intervalMs = DEFAULT_INTERVAL_MS }: WsHandlerOptions) {
  const store = buildSqliteSessionStore(sqlite);
  const wss = new WebSocketServer({ noServer: true });

  function handleUpgrade(req: IncomingMessage, socket: Duplex, head: Buffer) {
    logger.debug({ hasCookieHeader: Boolean(req.headers.cookie) }, 'WebSocket upgrade requested');
    const rawCookies = cookie.parse(req.headers.cookie ?? '');
    const rawSid = rawCookies['connect.sid'];
    if (!rawSid) {
      logger.warn({ cookieKeys: Object.keys(rawCookies) }, 'WebSocket rejected: missing session cookie');
      return reject401(socket);
    }

    const sid = rawSid.startsWith('s:')
      ? cookieSignature.unsign(rawSid.slice(2), process.env.SESSION_SECRET ?? 'dev-secret')
      : false;
    if (!sid) {
      logger.warn('WebSocket rejected: invalid session signature');
      return reject401(socket);
    }

    store.get(sid, (err, session) => {
      if (err || !session) {
        logger.warn({ err }, 'WebSocket rejected: session not found');
        return reject401(socket);
      }

      const passportUserId = (session as unknown as { passport?: { user?: string } })
        ?.passport?.user;
      if (!passportUserId) {
        logger.warn('WebSocket rejected: missing authenticated user in session');
        return reject401(socket);
      }

      db.select()
        .from(users)
        .where(eq(users.id, passportUserId))
        .then(([user]) => {
          if (!user) {
            logger.warn({ passportUserId }, 'WebSocket rejected: user not found');
            return reject401(socket);
          }
          logger.info({ userId: user.id }, 'WebSocket authenticated');
          wss.handleUpgrade(req, socket, head, (ws) => {
            wss.emit('connection', ws, req, user);
          });
        })
        .catch((e) => {
          logger.error({ err: e }, 'WebSocket auth database error');
          reject401(socket);
        });
    });
  }

  wss.on('connection', (ws: WebSocket, _req: IncomingMessage, user: InferSelectModel<typeof users>) => {
    let subscribedTypes: Array<'overdue' | 'due_soon'> = ['overdue', 'due_soon'];
    const ackedIds = new Set<string>();

    function sendNotifications(items: NotificationItem[]) {
      const filtered = items
        .filter((n) => subscribedTypes.includes(n.type))
        .filter((n) => !ackedIds.has(n.taskId));
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'notifications', payload: filtered }));
        logger.debug({ count: filtered.length, userId: user.id }, 'WebSocket notifications sent');
      }
    }

    function pushNotifications() {
      if (ws.readyState !== WebSocket.OPEN) {
        logger.debug({ state: ws.readyState, userId: user.id }, 'WebSocket notification push skipped');
        return;
      }
      queryNotifications(db, user.id)
        .then((items) => {
          logger.debug({ count: items.length, userId: user.id }, 'WebSocket notifications queried');
          sendNotifications(items);
        })
        .catch((e) => logger.error({ err: e, userId: user.id }, 'WebSocket notification query failed'));
    }

    pushNotifications();
    const timer = setInterval(pushNotifications, intervalMs);

    ws.on('message', (raw) => {
      let msg: ClientMessage;
      try {
        msg = JSON.parse(raw.toString()) as ClientMessage;
      } catch {
        return;
      }
      if (msg.type === 'subscribe') {
        subscribedTypes = msg.payload.types;
      } else if (msg.type === 'ack') {
        ackedIds.add(msg.payload.taskId);
      }
    });

    ws.on('close', () => clearInterval(timer));
    ws.on('error', () => clearInterval(timer));
  });

  return { handleUpgrade, wss };
}
