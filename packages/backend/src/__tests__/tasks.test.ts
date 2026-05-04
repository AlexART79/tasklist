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

async function loginAgent(seed: string) {
  const agent = request.agent(testApp);
  await agent.get(`/auth/test-login?seed=${seed}`).expect(200);
  return agent;
}

async function createList(agent: ReturnType<typeof request.agent>, name = 'Test List') {
  const res = await agent.post('/api/lists').send({ name }).expect(201);
  return res.body as { id: string };
}

async function createTask(
  agent: ReturnType<typeof request.agent>,
  listId: string,
  overrides: Record<string, unknown> = {},
) {
  const res = await agent
    .post(`/api/lists/${listId}/tasks`)
    .send({ title: 'Test Task', ...overrides })
    .expect(201);
  return res.body as { id: string };
}

describe('GET /api/lists/:listId/tasks', () => {
  it('returns 401 when unauthenticated', async () => {
    await request(testApp).get('/api/lists/any-id/tasks').expect(401);
  });

  it('returns 404 when listId belongs to another user', async () => {
    const agentA = await loginAgent('gtask_a');
    const list = await createList(agentA);

    const agentB = await loginAgent('gtask_b');
    await agentB.get(`/api/lists/${list.id}/tasks`).expect(404);
  });

  it('returns empty array for a new list', async () => {
    const agent = await loginAgent('gtask_empty');
    const list = await createList(agent);
    const res = await agent.get(`/api/lists/${list.id}/tasks`).expect(200);
    expect(res.body).toEqual([]);
  });

  it('returns tasks belonging to the list', async () => {
    const agent = await loginAgent('gtask_fill');
    const list = await createList(agent);
    await createTask(agent, list.id);
    const res = await agent.get(`/api/lists/${list.id}/tasks`).expect(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe('Test Task');
  });
});

describe('POST /api/lists/:listId/tasks', () => {
  it('returns 401 when unauthenticated', async () => {
    await request(testApp).post('/api/lists/any-id/tasks').send({ title: 'x' }).expect(401);
  });

  it('creates a task and returns 201 with the row', async () => {
    const agent = await loginAgent('ptask1');
    const list = await createList(agent);
    const res = await agent
      .post(`/api/lists/${list.id}/tasks`)
      .send({ title: 'My Task', priority: 'high', dueDate: '2025-12-31' })
      .expect(201);
    expect(res.body.title).toBe('My Task');
    expect(res.body.priority).toBe('high');
    expect(res.body.dueDate).toBe('2025-12-31');
    expect(res.body.status).toBe('todo');
    expect(typeof res.body.id).toBe('string');
  });

  it('returns 400 when title is missing', async () => {
    const agent = await loginAgent('ptask2');
    const list = await createList(agent);
    await agent.post(`/api/lists/${list.id}/tasks`).send({}).expect(400);
  });

  it('returns 400 when title is empty string', async () => {
    const agent = await loginAgent('ptask3');
    const list = await createList(agent);
    await agent.post(`/api/lists/${list.id}/tasks`).send({ title: '' }).expect(400);
  });

  it('returns 404 when listId belongs to another user', async () => {
    const agentA = await loginAgent('ptask4a');
    const list = await createList(agentA);

    const agentB = await loginAgent('ptask4b');
    await agentB.post(`/api/lists/${list.id}/tasks`).send({ title: 'Stolen' }).expect(404);
  });
});

describe('PATCH /api/tasks/:id', () => {
  it('updates a task and returns the updated row', async () => {
    const agent = await loginAgent('patchta1');
    const list = await createList(agent);
    const task = await createTask(agent, list.id);

    const res = await agent
      .patch(`/api/tasks/${task.id}`)
      .send({ title: 'Updated', status: 'in_progress' })
      .expect(200);
    expect(res.body.title).toBe('Updated');
    expect(res.body.status).toBe('in_progress');
  });

  it('returns 404 when task belongs to another user', async () => {
    const agentA = await loginAgent('patchta2a');
    const list = await createList(agentA);
    const task = await createTask(agentA, list.id);

    const agentB = await loginAgent('patchta2b');
    await agentB.patch(`/api/tasks/${task.id}`).send({ title: 'Stolen' }).expect(404);
  });

  it('returns 404 for a nonexistent task id', async () => {
    const agent = await loginAgent('patchta3');
    await agent.patch('/api/tasks/does-not-exist').send({ title: 'X' }).expect(404);
  });
});

describe('DELETE /api/tasks/:id', () => {
  it('deletes a task and returns 204', async () => {
    const agent = await loginAgent('delta1');
    const list = await createList(agent);
    const task = await createTask(agent, list.id);

    await agent.delete(`/api/tasks/${task.id}`).expect(204);
    const res = await agent.get(`/api/lists/${list.id}/tasks`).expect(200);
    expect(res.body.find((t: { id: string }) => t.id === task.id)).toBeUndefined();
  });

  it('returns 404 when task belongs to another user', async () => {
    const agentA = await loginAgent('delta2a');
    const list = await createList(agentA);
    const task = await createTask(agentA, list.id);

    const agentB = await loginAgent('delta2b');
    await agentB.delete(`/api/tasks/${task.id}`).expect(404);
  });

  it('returns 404 for a nonexistent task id', async () => {
    const agent = await loginAgent('delta3');
    await agent.delete('/api/tasks/does-not-exist').expect(404);
  });

  it('cascade — deleting the parent list also removes its tasks', async () => {
    const agent = await loginAgent('delta4');
    const list = await createList(agent);
    const task = await createTask(agent, list.id);

    await agent.delete(`/api/lists/${list.id}`).expect(204);

    // Re-create list to get access; the task row itself should be gone from DB.
    // We verify by checking tasks on a fresh list (no direct query access in integration tests),
    // so we confirm the cascaded task id is no longer reachable via PATCH.
    await agent.patch(`/api/tasks/${task.id}`).send({ title: 'Ghost' }).expect(404);
  });
});
