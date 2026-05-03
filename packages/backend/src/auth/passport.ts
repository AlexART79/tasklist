import passport from 'passport';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

export function configurePassport() {
  passport.serializeUser((user: Express.User, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await db.query.users.findFirst({ where: eq(users.id, id) });
      done(null, user ?? false);
    } catch (err) {
      done(err);
    }
  });

  return passport;
}
