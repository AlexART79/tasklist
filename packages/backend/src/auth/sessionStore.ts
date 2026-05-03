import BetterSqliteStore from 'better-sqlite3-session-store';
import session from 'express-session';
import type Database from 'better-sqlite3';

const SqliteStore = BetterSqliteStore(session);

export function buildSqliteSessionStore(db: Database.Database) {
  return new SqliteStore({ client: db, expired: { clear: true, intervalMs: 900_000 } });
}
