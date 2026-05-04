# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A full-stack task management app (monorepo) with Google + GitHub OAuth, real-time WebSocket notifications, and per-user list/task isolation. Stack: Express + TypeScript backend, React + Vite + TypeScript frontend, Drizzle ORM + SQLite (`better-sqlite3`).

## Monorepo structure

```
packages/backend/   — Express + TypeScript API server
packages/frontend/  — React + Vite + TypeScript SPA
```

Root `package.json` uses `pnpm` workspaces. Scripts at root delegate to both packages.

## Commands

```bash
# Install all deps (run from repo root)
pnpm install

# Dev (both packages in parallel)
pnpm dev

# Build
pnpm build

# Tests
pnpm test                          # all packages
pnpm --filter backend test         # backend only
pnpm --filter frontend test        # frontend only

# DB migrations
pnpm --filter backend db:migrate

# DB seed (demo user + lists + tasks)
pnpm --filter backend db:seed
```

Within `packages/backend`: `ts-node-dev` for dev, `tsc` for prod build.
Within `packages/frontend`: `vite` for dev, `vite build` for prod.

## Environment variables

Each package has its own `.env` (see `.env.example`). Key vars:

| Var                                                                 | Package | Purpose                       |
| ------------------------------------------------------------------- | ------- | ----------------------------- |
| `PORT`                                                              | backend | HTTP server port              |
| `DATABASE_URL`                                                      | backend | Path to SQLite file           |
| `SESSION_SECRET`                                                    | backend | express-session secret        |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_CALLBACK_URL` | backend | Google OAuth                  |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` / `GITHUB_CALLBACK_URL` | backend | GitHub OAuth                  |
| `NODE_ENV`                                                          | backend | `development` \| `production` |

## Architecture

### Backend

- `src/index.ts` — server entry, mounts middleware and routers
- `src/db/` — Drizzle schema definitions and migration runner
- `src/routes/auth.ts` — Passport.js OAuth routes (`/auth/google`, `/auth/github`, `/auth/logout`, `/auth/me`)
- `src/routes/lists.ts` — Lists CRUD (`/api/lists`)
- `src/routes/tasks.ts` — Tasks CRUD (`/api/lists/:listId/tasks`, `/api/tasks/:id`)
- `src/middleware/requireAuth.ts` — session-based auth guard used on all protected routes
- `src/ws/` — WebSocket server; authenticates via session cookie on upgrade, pushes overdue/due-soon notifications on connect and every 60s, handles `subscribe` and `ack` client messages

Input validation uses `zod` on all API routes.

### Frontend

See [`packages/frontend/CLAUDE.md`](packages/frontend/CLAUDE.md) for frontend architecture, conventions, and styling.

### Database schema (Drizzle + SQLite)

- `users` — `id`, `provider`, `provider_user_id`, `email`, `display_name`, `avatar_url`, `created_at`
- `lists` — `id`, `user_id` (FK→users), `name`, `created_at`, `updated_at`
- `tasks` — `id`, `list_id` (FK→lists ON DELETE CASCADE), `user_id` (denormalized), `title`, `description`, `status` (`todo`|`in_progress`|`done`), `due_date`, `priority` (`low`|`medium`|`high`), `created_at`, `updated_at`

Deleting a list cascades to all its tasks (DB-level `ON DELETE CASCADE`).

## Auth flow

Passport.js handles OAuth. On callback, users are upserted by `provider + provider_user_id`. Sessions are stored in SQLite via `better-sqlite3-session-store`. `requireAuth` middleware returns 401 for unauthenticated API calls and redirects to `/login` for page routes.

## WebSocket protocol

Client sends on connect:

```json
{ "type": "subscribe", "payload": { "types": ["overdue", "due_soon"] } }
```

Server pushes:

```json
{ "type": "notifications", "payload": [{ "taskId": "...", "title": "...", "type": "overdue"|"due_soon", "dueDate": "..." }] }
```

Client dismisses:

```json
{ "type": "ack", "payload": { "taskId": "..." } }
```

Acked task IDs are suppressed in-memory for the session duration.

## Key conventions

- All mutating API endpoints verify the requesting user owns the resource (return 404 — not 403 — to avoid leaking existence).
- Zod schemas live alongside their routes; do not share schemas between packages to keep the packages independently deployable.
- Filter params on `GET /api/lists/:listId/tasks`: `search`, `status`, `priority`, `due_category` (`overdue`|`today`|`next7days`|`all`). Date logic runs server-side via SQLite date functions.

## Docker

```bash
docker compose up   # starts backend + frontend, mounts SQLite volume
```

Multi-stage `Dockerfile` for backend (build → runtime). Frontend built by Vite and either served by Nginx or as static files from the backend.

## Testing

Vitest for both packages. Backend integration tests start an in-process server — no mocking of the database. WebSocket tests use an in-process WS client against a seeded DB. See [`packages/frontend/CLAUDE.md`](packages/frontend/CLAUDE.md) for frontend testing details.
