import { and, eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../db/schema';
import { tasks } from '../db/schema';
import type { NotificationItem } from './types';

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

export async function queryNotifications(db: DrizzleDb, userId: string): Promise<NotificationItem[]> {
  const overdue = await db
    .select({ id: tasks.id, title: tasks.title, dueDate: tasks.dueDate })
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, userId),
        sql`${tasks.dueDate} < date('now')`,
        sql`${tasks.status} != 'done'`,
      ),
    );

  const dueSoon = await db
    .select({ id: tasks.id, title: tasks.title, dueDate: tasks.dueDate })
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, userId),
        sql`${tasks.dueDate} >= date('now')`,
        sql`${tasks.dueDate} <= date('now', '+3 days')`,
        sql`${tasks.status} != 'done'`,
      ),
    );

  return [
    ...overdue
      .filter((t) => t.dueDate != null)
      .map((t) => ({ taskId: t.id, title: t.title, type: 'overdue' as const, dueDate: t.dueDate! })),
    ...dueSoon
      .filter((t) => t.dueDate != null)
      .map((t) => ({ taskId: t.id, title: t.title, type: 'due_soon' as const, dueDate: t.dueDate! })),
  ];
}
