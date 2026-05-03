import { Router } from 'express';
import passport from 'passport';
import { requireAuth } from '../middleware/requireAuth';
import { db } from '../db';
import { users } from '../db/schema';

export function buildAuthRouter() {
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
        const { eq } = await import('drizzle-orm');
        const [user] = await db
          .insert(users)
          .values({
            id: 'test-user-id',
            provider: 'google',
            providerUserId: 'google-test-id',
            email: 'test@example.com',
            displayName: 'Test User',
            avatarUrl: null,
          })
          .onConflictDoUpdate({
            target: users.id,
            set: { email: 'test@example.com' },
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
