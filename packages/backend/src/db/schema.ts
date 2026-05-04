import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable(
  'users',
  {
    id: text('id').primaryKey(),
    provider: text('provider', { enum: ['google', 'github'] }).notNull(),
    providerUserId: text('provider_user_id').notNull(),
    email: text('email'),
    displayName: text('display_name'),
    avatarUrl: text('avatar_url'),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [uniqueIndex('uniq_provider_uid').on(t.provider, t.providerUserId)],
);

export const lists = sqliteTable('lists', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});
