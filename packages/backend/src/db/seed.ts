import 'dotenv/config';
import { eq, inArray } from 'drizzle-orm';
import { db } from './index';
import { users, lists, tasks } from './schema';

const DEMO_USER_ID = 'seed-demo-user';
const DEMO_EMAIL = process.env.SEED_EMAIL ?? 'demo@example.com';
const DEMO_PROVIDER_USER_ID = 'mock-provider-token-demo';
const SEED_LIST_IDS = ['seed-demo-list-work', 'seed-demo-list-personal'];
const SEED_TASK_IDS = [
  'seed-overdue-1',
  'seed-overdue-2',
  'seed-today',
  'seed-tomorrow',
  'seed-in-3-days',
  'seed-future',
  'seed-done',
  'seed-personal-overdue',
  'seed-personal-due-soon',
  'seed-personal-no-date',
];

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

async function seed() {
  let [user] = await db.select().from(users).where(eq(users.email, DEMO_EMAIL));

  if (user) {
    console.log(`Seeding existing user: ${user.displayName ?? user.email ?? user.id}`);
  } else {
    [user] = await db
      .insert(users)
      .values({
        id: DEMO_USER_ID,
        provider: 'google',
        providerUserId: DEMO_PROVIDER_USER_ID,
        email: DEMO_EMAIL,
        displayName: 'Demo User',
        avatarUrl: null,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          provider: 'google',
          providerUserId: DEMO_PROVIDER_USER_ID,
          email: DEMO_EMAIL,
          displayName: 'Demo User',
          avatarUrl: null,
        },
      })
      .returning();
    console.log(`Created demo user: ${user.displayName ?? user.email ?? user.id}`);
  }

  await db.delete(tasks).where(inArray(tasks.id, SEED_TASK_IDS));
  await db.delete(lists).where(inArray(lists.id, SEED_LIST_IDS));

  await db.insert(lists).values([
    { id: 'seed-demo-list-work', userId: user.id, name: 'Work Launch' },
    { id: 'seed-demo-list-personal', userId: user.id, name: 'Personal Admin' },
  ]);

  await db.insert(tasks).values([
    {
      id: 'seed-overdue-1',
      listId: 'seed-demo-list-work',
      userId: user.id,
      title: 'Fix critical login bug',
      description: 'Users cannot log in on Safari — must be resolved.',
      status: 'in_progress',
      dueDate: daysFromNow(-5),
      priority: 'high',
    },
    {
      id: 'seed-overdue-2',
      listId: 'seed-demo-list-work',
      userId: user.id,
      title: 'Write quarterly report',
      description: null,
      status: 'todo',
      dueDate: daysFromNow(-2),
      priority: 'medium',
    },
    {
      id: 'seed-today',
      listId: 'seed-demo-list-work',
      userId: user.id,
      title: 'Deploy staging build',
      description: null,
      status: 'todo',
      dueDate: daysFromNow(0),
      priority: 'high',
    },
    {
      id: 'seed-tomorrow',
      listId: 'seed-demo-list-work',
      userId: user.id,
      title: 'Code review for PR #42',
      description: null,
      status: 'todo',
      dueDate: daysFromNow(1),
      priority: 'medium',
    },
    {
      id: 'seed-in-3-days',
      listId: 'seed-demo-list-work',
      userId: user.id,
      title: 'Update dependencies',
      description: null,
      status: 'todo',
      dueDate: daysFromNow(3),
      priority: 'low',
    },
    {
      id: 'seed-future',
      listId: 'seed-demo-list-work',
      userId: user.id,
      title: 'Plan next sprint',
      description: null,
      status: 'todo',
      dueDate: daysFromNow(14),
      priority: 'medium',
    },
    {
      id: 'seed-done',
      listId: 'seed-demo-list-work',
      userId: user.id,
      title: 'Set up CI pipeline',
      description: 'Already shipped — should not appear in notifications.',
      status: 'done',
      dueDate: daysFromNow(-10),
      priority: 'high',
    },
    {
      id: 'seed-personal-overdue',
      listId: 'seed-demo-list-personal',
      userId: user.id,
      title: 'Renew passport paperwork',
      description: 'Collect documents and submit the renewal form.',
      status: 'todo',
      dueDate: daysFromNow(-1),
      priority: 'high',
    },
    {
      id: 'seed-personal-due-soon',
      listId: 'seed-demo-list-personal',
      userId: user.id,
      title: 'Book dentist appointment',
      description: null,
      status: 'in_progress',
      dueDate: daysFromNow(2),
      priority: 'medium',
    },
    {
      id: 'seed-personal-no-date',
      listId: 'seed-demo-list-personal',
      userId: user.id,
      title: 'Sort photo backups',
      description: 'Move old exports into cloud storage.',
      status: 'todo',
      dueDate: null,
      priority: 'low',
    },
  ]);

  console.log('Seeded lists: Work Launch, Personal Admin');
  console.log('Seeded tasks:');
  console.log('  3 overdue  (should trigger notifications)');
  console.log('  4 due soon — today, tomorrow, in 2 days, in 3 days  (should trigger notifications)');
  console.log('  1 future   — in 14 days  (no notification yet)');
  console.log('  1 no date  (no notification)');
  console.log('  1 done     — overdue but status=done  (no notification)');
  console.log('\nOpen the app as the demo user or inspect the DB to review seeded data.');
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
