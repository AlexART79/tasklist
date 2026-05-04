import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { WebSocket } from 'ws';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import request from 'supertest';
import * as schema from '../db/schema';
import { lists, tasks } from '../db/schema';
import { buildApp } from '../app';
import { buildWsHandler } from '../ws/handler';

let server: http.Server;
let port: number;
let db: ReturnType<typeof drizzle<typeof schema>>;
let sqlite: InstanceType<typeof Database>;

const SEED = 'ws';
const USER_ID = `test-user-${SEED}`;

// Compute a due-soon date (tomorrow) at test suite load time
function tomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

beforeAll(async () => {
  sqlite = new Database(':memory:');
  db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: './src/db/migrations' });

  const app = buildApp({ sqlite, db });
  server = http.createServer(app);
  const { handleUpgrade } = buildWsHandler({ sqlite, db, intervalMs: 50 });

  server.on('upgrade', (req, socket, head) => {
    if (req.url === '/ws') handleUpgrade(req, socket, head);
    else socket.destroy();
  });

  await new Promise<void>((resolve) => server.listen(0, resolve));
  port = (server.address() as { port: number }).port;

  // Create user via test-login, then seed list + overdue task + due-soon task
  await request(server).get(`/auth/test-login?seed=${SEED}`).expect(200);

  const listId = 'test-list-ws';
  await db.insert(lists).values({ id: listId, userId: USER_ID, name: 'WS List' });
  await db.insert(tasks).values([
    {
      id: 'overdue-task-ws',
      listId,
      userId: USER_ID,
      title: 'Overdue Task',
      status: 'todo',
      dueDate: '2000-01-01',
      priority: 'high',
    },
    {
      id: 'duesoon-task-ws',
      listId,
      userId: USER_ID,
      title: 'Due Soon Task',
      status: 'todo',
      dueDate: tomorrow(),
      priority: 'medium',
    },
  ]);
}, 15_000);

afterAll(
  () =>
    new Promise<void>((resolve) => {
      server.closeAllConnections?.();
      server.close(() => resolve());
    }),
  10_000,
);

async function getSessionCookie(): Promise<string> {
  const res = await request(server).get(`/auth/test-login?seed=${SEED}`);
  const rawHeader = res.headers['set-cookie'];
  const cookies = Array.isArray(rawHeader) ? rawHeader : rawHeader ? [rawHeader] : [];
  if (!cookies.length) throw new Error('No Set-Cookie header');
  return cookies.map((c) => c.split(';')[0]).join('; ');
}

function connectWs(cookie: string): Promise<{ ws: WebSocket; firstMessage: unknown }> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://localhost:${port}/ws`, { headers: { cookie } });
    ws.once('message', (raw) => {
      resolve({ ws, firstMessage: JSON.parse(raw.toString()) });
    });
    ws.once('error', reject);
    ws.once('unexpected-response', (_req, res) => {
      reject(new Error(`Unexpected response: ${res.statusCode}`));
    });
  });
}

function waitForMessage(ws: WebSocket): Promise<unknown> {
  return new Promise((resolve, reject) => {
    ws.once('message', (raw) => resolve(JSON.parse(raw.toString())));
    ws.once('error', reject);
  });
}

describe('WebSocket notifications', () => {
  it('rejects connection without session cookie', () =>
    new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(`ws://localhost:${port}/ws`);
      ws.on('unexpected-response', (_req, res) => {
        expect(res.statusCode).toBe(401);
        resolve();
      });
      ws.on('error', () => resolve()); // socket destroy also emits error
      setTimeout(() => reject(new Error('timeout')), 3000);
    }));

  it('sends overdue notification on connect', async () => {
    const cookie = await getSessionCookie();
    const { ws, firstMessage } = await connectWs(cookie);
    ws.close();

    const msg = firstMessage as { type: string; payload: Array<{ type: string; title: string }> };
    expect(msg.type).toBe('notifications');
    expect(msg.payload.some((n) => n.type === 'overdue' && n.title === 'Overdue Task')).toBe(true);
  });

  it('subscribe filters notification types', async () => {
    const cookie = await getSessionCookie();
    // First message includes both overdue + due_soon
    const { ws } = await connectWs(cookie);

    // Re-subscribe to only due_soon; next interval push should omit overdue
    ws.send(JSON.stringify({ type: 'subscribe', payload: { types: ['due_soon'] } }));
    const second = (await waitForMessage(ws)) as { payload: Array<{ type: string }> };
    ws.close();

    // Only due_soon items (the due-soon task is still present so a message is sent)
    expect(second.payload.every((n) => n.type === 'due_soon')).toBe(true);
  });

  it('ack suppresses re-delivery on subsequent push', async () => {
    const cookie = await getSessionCookie();
    const { ws, firstMessage } = await connectWs(cookie);

    const first = firstMessage as { payload: Array<{ taskId: string; type: string }> };
    const overdueItem = first.payload.find((n) => n.type === 'overdue');
    if (!overdueItem) throw new Error('No overdue item in first message');

    // Ack the overdue task; due_soon task remains so a second push will arrive
    ws.send(JSON.stringify({ type: 'ack', payload: { taskId: overdueItem.taskId } }));
    const second = (await waitForMessage(ws)) as { payload: Array<{ taskId: string }> };
    ws.close();

    expect(second.payload.find((n) => n.taskId === overdueItem.taskId)).toBeUndefined();
  });
});
