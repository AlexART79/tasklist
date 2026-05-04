import passport from 'passport';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import type { db as DbType } from '../db';

let configured = false;

export function configurePassport() {
  if (configured) return passport;
  configured = true;

  passport.serializeUser((user: Express.User, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (req: Express.Request, id: string, done) => {
    try {
      const db: typeof DbType = (req as any).app.get('db');
      const user = await db.query.users.findFirst({ where: eq(users.id, id) });
      done(null, user ?? false);
    } catch (err) {
      done(err);
    }
  });

  return passport;
}
