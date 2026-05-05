import { Router } from 'express';
import passport from 'passport';
import { requireAuth } from '../middleware/requireAuth';
import { db as defaultDb } from '../db';
import { users } from '../db/schema';
import type { db as DbType } from '../db';

export function buildAuthRouter(db: typeof DbType = defaultDb) {
  const router = Router();

  router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

  router.get(
    '/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (_req, res) => res.redirect(process.env.FRONTEND_URL ?? 'http://localhost:5173/'),
  );

  router.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }));

  router.get(
    '/auth/github/callback',
    passport.authenticate('github', { failureRedirect: '/login' }),
    (_req, res) => res.redirect(process.env.FRONTEND_URL ?? 'http://localhost:5173/'),
  );

  router.get('/auth/me', requireAuth, (req, res) => {
    res.json(req.user);
  });

  router.post('/auth/logout', (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy(() => res.sendStatus(204));
    });
  });

  if (process.env.NODE_ENV === 'test') {
    router.get('/auth/test-login', async (req, res, next) => {
      try {
        const seed = req.query.seed as string | undefined;
        const userId = seed ? `test-user-${seed}` : 'test-user-id';
        const providerUserId = seed ? `google-test-id-${seed}` : 'google-test-id';
        const email = seed ? `test-${seed}@example.com` : 'test@example.com';
        const [user] = await db
          .insert(users)
          .values({
            id: userId,
            provider: 'google',
            providerUserId,
            email,
            displayName: 'Test User',
            avatarUrl: null,
          })
          .onConflictDoUpdate({
            target: users.id,
            set: { email },
          })
          .returning();
        req.login(user, (err) => (err ? next(err) : res.sendStatus(200)));
      } catch (err) {
        next(err);
      }
    });
  }

  return router;
}
