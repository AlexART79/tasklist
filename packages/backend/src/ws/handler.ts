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
    console.log('[WS] upgrade request — cookie header:', req.headers.cookie ? `present (${req.headers.cookie.length} chars)` : 'MISSING');
    const rawCookies = cookie.parse(req.headers.cookie ?? '');
    const rawSid = rawCookies['connect.sid'];
    if (!rawSid) {
      console.log('[WS] rejected: no connect.sid cookie. All cookie keys:', Object.keys(rawCookies));
      return reject401(socket);
    }

    const sid = rawSid.startsWith('s:')
      ? cookieSignature.unsign(rawSid.slice(2), process.env.SESSION_SECRET ?? 'dev-secret')
      : false;
    if (!sid) {
      console.log('[WS] rejected: invalid session signature (secret mismatch?)');
      return reject401(socket);
    }

    store.get(sid, (err, session) => {
      if (err || !session) {
        console.log('[WS] rejected: session not found in store', err?.message ?? '');
        return reject401(socket);
      }

      const passportUserId = (session as unknown as { passport?: { user?: string } })
        ?.passport?.user;
      if (!passportUserId) {
        console.log('[WS] rejected: no passport.user in session');
        return reject401(socket);
      }

      db.select()
        .from(users)
        .where(eq(users.id, passportUserId))
        .then(([user]) => {
          if (!user) {
            console.log('[WS] rejected: user not in DB, passportUserId=', passportUserId);
            return reject401(socket);
          }
          console.log('[WS] authenticated userId:', user.id);
          wss.handleUpgrade(req, socket, head, (ws) => {
            wss.emit('connection', ws, req, user);
          });
        })
        .catch((e) => {
          console.error('[WS] DB error during auth:', e);
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
        console.log('[WS] sent', filtered.length, 'notifications to userId:', user.id);
      }
    }

    function pushNotifications() {
      if (ws.readyState !== WebSocket.OPEN) {
        console.log('[WS] pushNotifications skipped: socket not open, state=', ws.readyState);
        return;
      }
      queryNotifications(db, user.id)
        .then((items) => {
          console.log('[WS] queryNotifications result:', items.length, 'items for userId:', user.id);
          sendNotifications(items);
        })
        .catch((e) => console.error('[WS] queryNotifications error:', e));
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
