import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '../db/schema';
import { buildApp } from '../app';

let testApp: ReturnType<typeof buildApp>;

beforeAll(() => {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: './src/db/migrations' });
  testApp = buildApp({ sqlite });
});

describe('GET /auth/me', () => {
  it('returns 401 when unauthenticated', async () => {
    await request(testApp).get('/auth/me').expect(401);
  });

  it('returns user when authenticated', async () => {
    const agent = request.agent(testApp);
    await agent.get('/auth/test-login').expect(200);
    const res = await agent.get('/auth/me').expect(200);
    expect(res.body.email).toBe('test@example.com');
    expect(res.body.provider).toBe('google');
  });
});

describe('POST /auth/logout', () => {
  it('returns 204 when not authenticated', async () => {
    await request(testApp).post('/auth/logout').expect(204);
  });

  it('destroys session; subsequent /auth/me returns 401', async () => {
    const agent = request.agent(testApp);
    await agent.get('/auth/test-login').expect(200);
    await agent.post('/auth/logout').expect(204);
    await agent.get('/auth/me').expect(401);
  });
});
