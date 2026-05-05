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
import { buildListsRouter } from './routes/lists';
import { buildTasksRouter } from './routes/tasks';
import { sqlite as defaultSqlite, db as defaultDb } from './db';
import { buildRequestLogger, errorLogger } from './middleware/logging';

interface AppOptions {
  sqlite?: Database.Database;
  db?: typeof defaultDb;
}

export function buildApp(options?: AppOptions) {
  const sqliteInst = options?.sqlite ?? defaultSqlite;
  const dbInst = options?.db ?? defaultDb;
  const app = express();
  app.set('db', dbInst);

  app.use(express.json());
  app.use(buildSessionMiddleware({ store: buildSqliteSessionStore(sqliteInst) }));

  configurePassport();
  if (process.env.GOOGLE_CLIENT_ID) passport.use(buildGoogleStrategy());
  if (process.env.GITHUB_CLIENT_ID) passport.use(buildGithubStrategy());
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(buildRequestLogger());

  app.use(buildAuthRouter(dbInst));
  app.use(buildListsRouter(dbInst));
  app.use(buildTasksRouter(dbInst));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use(errorLogger);

  return app;
}

export const app = buildApp();
