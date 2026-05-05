import passport from 'passport';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import type { db as DbType } from '../db';

let configured = false;

type PassportRequest = import('http').IncomingMessage & {
  app: {
    get(name: 'db'): typeof DbType;
  };
};

export function configurePassport() {
  if (configured) return passport;
  configured = true;

  passport.serializeUser((user: Express.User, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (req: import('http').IncomingMessage, id: string, done: (err: unknown, user?: Express.User | false | null) => void) => {
    try {
      const db = (req as PassportRequest).app.get('db');
      const user = await db.query.users.findFirst({ where: eq(users.id, id) });
      done(null, user ?? false);
    } catch (err) {
      done(err);
    }
  });

  return passport;
}
