import 'dotenv/config';
import { eq, inArray } from 'drizzle-orm';
import { db } from './index';
import { users, lists, tasks } from './schema';

const SEED_EMAIL = process.env.SEED_EMAIL ?? 'alexart79@gmail.com';

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

async function seed() {
  const [user] = await db.select().from(users).where(eq(users.email, SEED_EMAIL));

  if (!user) {
    console.error(`No user found with email "${SEED_EMAIL}".`);
    console.error('Log in via OAuth first, or override the email: SEED_EMAIL=you@example.com pnpm --filter backend db:seed');
    process.exit(1);
  }
  console.log(`Seeding for user: ${user.displayName ?? user.email ?? user.id}`);

  // Create a dedicated demo list (idempotent: same id each run)
  const listId = `seed-demo-list-${user.id}`;
  await db
    .insert(lists)
    .values({ id: listId, userId: user.id, name: 'Notification Demo' })
    .onConflictDoNothing();

  // Remove previous seed tasks so the script is idempotent
  await db.delete(tasks).where(
    inArray(tasks.id, [
      'seed-overdue-1',
      'seed-overdue-2',
      'seed-today',
      'seed-tomorrow',
      'seed-in-3-days',
      'seed-future',
      'seed-done',
    ]),
  );

  await db.insert(tasks).values([
    {
      id: 'seed-overdue-1',
      listId,
      userId: user.id,
      title: 'Fix critical login bug',
      description: 'Users cannot log in on Safari — must be resolved.',
      status: 'in_progress',
      dueDate: daysFromNow(-5),
      priority: 'high',
    },
    {
      id: 'seed-overdue-2',
      listId,
      userId: user.id,
      title: 'Write quarterly report',
      description: null,
      status: 'todo',
      dueDate: daysFromNow(-2),
      priority: 'medium',
    },
    {
      id: 'seed-today',
      listId,
      userId: user.id,
      title: 'Deploy staging build',
      description: null,
      status: 'todo',
      dueDate: daysFromNow(0),
      priority: 'high',
    },
    {
      id: 'seed-tomorrow',
      listId,
      userId: user.id,
      title: 'Code review for PR #42',
      description: null,
      status: 'todo',
      dueDate: daysFromNow(1),
      priority: 'medium',
    },
    {
      id: 'seed-in-3-days',
      listId,
      userId: user.id,
      title: 'Update dependencies',
      description: null,
      status: 'todo',
      dueDate: daysFromNow(3),
      priority: 'low',
    },
    {
      id: 'seed-future',
      listId,
      userId: user.id,
      title: 'Plan next sprint',
      description: null,
      status: 'todo',
      dueDate: daysFromNow(14),
      priority: 'medium',
    },
    {
      id: 'seed-done',
      listId,
      userId: user.id,
      title: 'Set up CI pipeline',
      description: 'Already shipped — should not appear in notifications.',
      status: 'done',
      dueDate: daysFromNow(-10),
      priority: 'high',
    },
  ]);

  console.log('Seeded "Notification Demo" tasks:');
  console.log('  2 overdue  (should trigger notifications)');
  console.log('  3 due soon — today, tomorrow, in 3 days  (should trigger notifications)');
  console.log('  1 future   — in 14 days  (no notification yet)');
  console.log('  1 done     — overdue but status=done  (no notification)');
  console.log('\nOpen the app and the bell icon should show 5 notifications.');

  // Second list: general tasks for UI review
  const generalListId = `seed-general-list-${user.id}`;
  await db
    .insert(lists)
    .values({ id: generalListId, userId: user.id, name: 'General Tasks' })
    .onConflictDoNothing();

  await db.delete(tasks).where(
    inArray(tasks.id, [
      'seed-general-1',
      'seed-general-2',
      'seed-general-3',
      'seed-general-4',
      'seed-general-5',
    ]),
  );

  await db.insert(tasks).values([
    {
      id: 'seed-general-1',
      listId: generalListId,
      userId: user.id,
      title: 'Design onboarding flow',
      description: 'Wireframes and user stories for the improved signup experience.',
      status: 'in_progress',
      dueDate: daysFromNow(7),
      priority: 'high',
    },
    {
      id: 'seed-general-2',
      listId: generalListId,
      userId: user.id,
      title: 'Write auth module unit tests',
      description: null,
      status: 'todo',
      dueDate: daysFromNow(10),
      priority: 'medium',
    },
    {
      id: 'seed-general-3',
      listId: generalListId,
      userId: user.id,
      title: 'Refactor DB connection pooling',
      description: null,
      status: 'todo',
      dueDate: null,
      priority: 'low',
    },
    {
      id: 'seed-general-4',
      listId: generalListId,
      userId: user.id,
      title: 'Update project README',
      description: 'Docker setup and environment variable documentation.',
      status: 'done',
      dueDate: daysFromNow(-3),
      priority: 'low',
    },
    {
      id: 'seed-general-5',
      listId: generalListId,
      userId: user.id,
      title: 'Conduct security audit',
      description: null,
      status: 'todo',
      dueDate: daysFromNow(21),
      priority: 'high',
    },
  ]);

  console.log('\nSeeded "General Tasks" list with 5 tasks (various statuses and priorities).');
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
