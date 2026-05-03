import 'dotenv/config';
import express from 'express';
import passport from 'passport';
import type Database from 'better-sqlite3';
import { buildSessionMiddleware } from './middleware/session';
import { buildSqliteSessionStore } from './auth/sessionStore';
import { configurePassport } from './auth/passport';
import { buildGoogleStrategy } from './auth/googleStrategy';
import { buildGithubStrategy } from './auth/githubStrategy';
import { buildAuthRouter } from './routes/auth';
import { sqlite as defaultSqlite } from './db';

interface AppOptions {
  sqlite?: Database.Database;
}

export function buildApp(options?: AppOptions) {
  const sqliteInst = options?.sqlite ?? defaultSqlite;
  const app = express();

  app.use(express.json());
  app.use(buildSessionMiddleware({ store: buildSqliteSessionStore(sqliteInst) }));

  configurePassport();
  if (process.env.GOOGLE_CLIENT_ID) passport.use(buildGoogleStrategy());
  if (process.env.GITHUB_CLIENT_ID) passport.use(buildGithubStrategy());
  app.use(passport.initialize());
  app.use(passport.session());

  app.use(buildAuthRouter());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  return app;
}

export const app = buildApp();
