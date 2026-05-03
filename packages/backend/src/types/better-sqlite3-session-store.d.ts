declare module 'better-sqlite3-session-store' {
  import session from 'express-session';
  import type Database from 'better-sqlite3';

  type StoreConstructor = new (options: {
    client: Database.Database;
    expired?: { clear?: boolean; intervalMs?: number };
  }) => session.Store;

  function factory(s: typeof session): StoreConstructor;
  export = factory;
}
