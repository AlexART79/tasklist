import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { db } from '../db';
import { users } from '../db/schema';

export function buildGoogleStrategy() {
  return new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const [user] = await db
          .insert(users)
          .values({
            id: crypto.randomUUID(),
            provider: 'google',
            providerUserId: profile.id,
            email: profile.emails?.[0]?.value ?? null,
            displayName: profile.displayName ?? null,
            avatarUrl: profile.photos?.[0]?.value ?? null,
          })
          .onConflictDoUpdate({
            target: [users.provider, users.providerUserId],
            set: {
              displayName: profile.displayName ?? null,
              avatarUrl: profile.photos?.[0]?.value ?? null,
              email: profile.emails?.[0]?.value ?? null,
            },
          })
          .returning();
        done(null, user);
      } catch (err) {
        done(err as Error);
      }
    },
  );
}
