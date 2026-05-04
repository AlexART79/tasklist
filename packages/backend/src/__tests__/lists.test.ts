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
  testApp = buildApp({ sqlite, db });
});

describe('GET /api/lists', () => {
  it('returns 401 when unauthenticated', async () => {
    await request(testApp).get('/api/lists').expect(401);
  });

  it('returns empty array for a new user', async () => {
    const agent = request.agent(testApp);
    await agent.get('/auth/test-login').expect(200);
    const res = await agent.get('/api/lists').expect(200);
    expect(res.body).toEqual([]);
  });

  it('only returns lists belonging to the authenticated user', async () => {
    const agentA = request.agent(testApp);
    await agentA.get('/auth/test-login?seed=a').expect(200);
    await agentA.post('/api/lists').send({ name: 'List A' }).expect(201);

    const agentB = request.agent(testApp);
    await agentB.get('/auth/test-login?seed=b').expect(200);
    const res = await agentB.get('/api/lists').expect(200);
    expect(res.body).toEqual([]);
  });
});

describe('POST /api/lists', () => {
  it('creates a list and returns 201 with the row', async () => {
    const agent = request.agent(testApp);
    await agent.get('/auth/test-login?seed=post1').expect(200);
    const res = await agent.post('/api/lists').send({ name: 'My List' }).expect(201);
    expect(res.body.name).toBe('My List');
    expect(typeof res.body.id).toBe('string');
  });

  it('returns 400 when name is missing', async () => {
    const agent = request.agent(testApp);
    await agent.get('/auth/test-login?seed=post2').expect(200);
    await agent.post('/api/lists').send({}).expect(400);
  });

  it('returns 400 when name is empty string', async () => {
    const agent = request.agent(testApp);
    await agent.get('/auth/test-login?seed=post3').expect(200);
    await agent.post('/api/lists').send({ name: '' }).expect(400);
  });

  it('returns 400 when name exceeds 255 characters', async () => {
    const agent = request.agent(testApp);
    await agent.get('/auth/test-login?seed=post4').expect(200);
    await agent.post('/api/lists').send({ name: 'x'.repeat(256) }).expect(400);
  });
});

describe('PATCH /api/lists/:id', () => {
  it('renames a list and returns the updated row', async () => {
    const agent = request.agent(testApp);
    await agent.get('/auth/test-login?seed=patch1').expect(200);
    const created = await agent.post('/api/lists').send({ name: 'Old Name' });
    const res = await agent
      .patch(`/api/lists/${created.body.id}`)
      .send({ name: 'New Name' })
      .expect(200);
    expect(res.body.name).toBe('New Name');
  });

  it('returns 404 when the list belongs to another user', async () => {
    const agentA = request.agent(testApp);
    await agentA.get('/auth/test-login?seed=patch2a').expect(200);
    const created = await agentA.post('/api/lists').send({ name: 'A List' });

    const agentB = request.agent(testApp);
    await agentB.get('/auth/test-login?seed=patch2b').expect(200);
    await agentB.patch(`/api/lists/${created.body.id}`).send({ name: 'Stolen' }).expect(404);
  });

  it('returns 404 for a nonexistent list id', async () => {
    const agent = request.agent(testApp);
    await agent.get('/auth/test-login?seed=patch3').expect(200);
    await agent.patch('/api/lists/does-not-exist').send({ name: 'X' }).expect(404);
  });
});

describe('DELETE /api/lists/:id', () => {
  it('deletes a list and returns 204', async () => {
    const agent = request.agent(testApp);
    await agent.get('/auth/test-login?seed=del1').expect(200);
    const created = await agent.post('/api/lists').send({ name: 'To Delete' });
    await agent.delete(`/api/lists/${created.body.id}`).expect(204);
    const res = await agent.get('/api/lists').expect(200);
    expect(res.body.find((l: { id: string }) => l.id === created.body.id)).toBeUndefined();
  });

  it('returns 404 when the list belongs to another user', async () => {
    const agentA = request.agent(testApp);
    await agentA.get('/auth/test-login?seed=del2a').expect(200);
    const created = await agentA.post('/api/lists').send({ name: 'Protected' });

    const agentB = request.agent(testApp);
    await agentB.get('/auth/test-login?seed=del2b').expect(200);
    await agentB.delete(`/api/lists/${created.body.id}`).expect(404);
  });

  it('returns 404 for a nonexistent list id', async () => {
    const agent = request.agent(testApp);
    await agent.get('/auth/test-login?seed=del3').expect(200);
    await agent.delete('/api/lists/does-not-exist').expect(404);
  });
});
