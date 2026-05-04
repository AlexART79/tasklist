import { Router } from 'express';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { requireAuth } from '../middleware/requireAuth';
import { lists } from '../db/schema';
import type { db as DbType } from '../db';

const nameSchema = z.object({ name: z.string().min(1).max(255) });

export function buildListsRouter(db: typeof DbType) {
  const router = Router();

  router.get('/api/lists', requireAuth, async (req, res, next) => {
    try {
      const rows = await db.select().from(lists).where(eq(lists.userId, req.user!.id)).orderBy(lists.createdAt);
      res.json(rows);
    } catch (err) {
      next(err);
    }
  });

  router.post('/api/lists', requireAuth, async (req, res, next) => {
    try {
      const parsed = nameSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
      const [row] = await db
        .insert(lists)
        .values({ id: crypto.randomUUID(), userId: req.user!.id, name: parsed.data.name })
        .returning();
      res.status(201).json(row);
    } catch (err) {
      next(err);
    }
  });

  router.patch('/api/lists/:id', requireAuth, async (req, res, next) => {
    try {
      const parsed = nameSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
      const [row] = await db
        .update(lists)
        .set({ name: parsed.data.name, updatedAt: new Date() })
        .where(and(eq(lists.id, req.params.id), eq(lists.userId, req.user!.id)))
        .returning();
      if (!row) return res.sendStatus(404);
      res.json(row);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/api/lists/:id', requireAuth, async (req, res, next) => {
    try {
      const [row] = await db
        .delete(lists)
        .where(and(eq(lists.id, req.params.id), eq(lists.userId, req.user!.id)))
        .returning();
      if (!row) return res.sendStatus(404);
      res.sendStatus(204);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
