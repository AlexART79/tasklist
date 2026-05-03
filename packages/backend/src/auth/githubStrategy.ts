import { Strategy as GitHubStrategy } from 'passport-github2';
import { db } from '../db';
import { users } from '../db/schema';

export function buildGithubStrategy() {
  return new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      callbackURL: process.env.GITHUB_CALLBACK_URL!,
    },
    async (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
      try {
        const [user] = await db
          .insert(users)
          .values({
            id: crypto.randomUUID(),
            provider: 'github',
            providerUserId: profile.id,
            email: profile.emails?.[0]?.value ?? null,
            displayName: profile.displayName ?? profile.username ?? null,
            avatarUrl: profile.photos?.[0]?.value ?? null,
          })
          .onConflictDoUpdate({
            target: [users.provider, users.providerUserId],
            set: {
              displayName: profile.displayName ?? profile.username ?? null,
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
