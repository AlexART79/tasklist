import { Router } from 'express';
import { eq, and, like, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import { requireAuth } from '../middleware/requireAuth';
import { lists, tasks } from '../db/schema';
import type { db as DbType } from '../db';

const createTaskSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().optional().nullable(),
  status: z.enum(['todo', 'in_progress', 'done']).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
});

const updateTaskSchema = createTaskSchema.partial();

export function buildTasksRouter(db: typeof DbType) {
  const router = Router();

  router.get('/api/lists/:listId/tasks', requireAuth, async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const { listId } = req.params;

      const [list] = await db
        .select()
        .from(lists)
        .where(and(eq(lists.id, listId), eq(lists.userId, userId)));
      if (!list) return res.sendStatus(404);

      const { status, priority, due_category, search } = req.query as Record<string, string>;

      const conditions = [eq(tasks.listId, listId)];

      if (status) conditions.push(eq(tasks.status, status as 'todo' | 'in_progress' | 'done'));
      if (priority) conditions.push(eq(tasks.priority, priority as 'low' | 'medium' | 'high'));
      if (search) {
        const term = `%${search}%`;
        conditions.push(or(like(tasks.title, term), like(tasks.description, term))!);
      }
      if (due_category && due_category !== 'all') {
        if (due_category === 'overdue') {
          conditions.push(sql`${tasks.dueDate} < date('now') AND ${tasks.status} != 'done'`);
        } else if (due_category === 'today') {
          conditions.push(sql`${tasks.dueDate} = date('now')`);
        } else if (due_category === 'next7days') {
          conditions.push(sql`${tasks.dueDate} BETWEEN date('now') AND date('now', '+7 days')`);
        }
      }

      const rows = await db
        .select()
        .from(tasks)
        .where(and(...conditions))
        .orderBy(tasks.createdAt);

      res.json(rows);
    } catch (err) {
      next(err);
    }
  });

  router.post('/api/lists/:listId/tasks', requireAuth, async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const { listId } = req.params;

      const [list] = await db
        .select()
        .from(lists)
        .where(and(eq(lists.id, listId), eq(lists.userId, userId)));
      if (!list) return res.sendStatus(404);

      const parsed = createTaskSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

      const [row] = await db
        .insert(tasks)
        .values({
          id: crypto.randomUUID(),
          listId,
          userId,
          title: parsed.data.title,
          description: parsed.data.description ?? null,
          status: parsed.data.status ?? 'todo',
          dueDate: parsed.data.dueDate ?? null,
          priority: parsed.data.priority ?? 'medium',
        })
        .returning();

      res.status(201).json(row);
    } catch (err) {
      next(err);
    }
  });

  router.patch('/api/tasks/:id', requireAuth, async (req, res, next) => {
    try {
      const parsed = updateTaskSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

      const updates: Record<string, unknown> = { updatedAt: new Date() };
      if (parsed.data.title !== undefined) updates.title = parsed.data.title;
      if (parsed.data.description !== undefined) updates.description = parsed.data.description;
      if (parsed.data.status !== undefined) updates.status = parsed.data.status;
      if (parsed.data.dueDate !== undefined) updates.dueDate = parsed.data.dueDate;
      if (parsed.data.priority !== undefined) updates.priority = parsed.data.priority;

      const [row] = await db
        .update(tasks)
        .set(updates)
        .where(and(eq(tasks.id, req.params.id), eq(tasks.userId, req.user!.id)))
        .returning();

      if (!row) return res.sendStatus(404);
      res.json(row);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/api/tasks/:id', requireAuth, async (req, res, next) => {
    try {
      const [row] = await db
        .delete(tasks)
        .where(and(eq(tasks.id, req.params.id), eq(tasks.userId, req.user!.id)))
        .returning();

      if (!row) return res.sendStatus(404);
      res.sendStatus(204);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
