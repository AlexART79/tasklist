# Task Manager

A full-stack task management app with Google + GitHub OAuth, real-time WebSocket notifications, and per-user list/task isolation.

**Stack**: Express + TypeScript · React + Vite + TypeScript · Drizzle ORM + SQLite · WebSockets

API details are documented in [docs/api.md](docs/api.md).

---

## Prerequisites

- Node.js 22 ([nvm](https://github.com/nvm-sh/nvm): `nvm use`)
- pnpm 9 (`npm install -g pnpm`)
- Docker + Docker Compose (for containerised run)

---

## Local run (native)

```bash
# 1. Install dependencies
pnpm install

# 2. Set up environment
cp packages/backend/.env.example packages/backend/.env
cp packages/frontend/.env.example packages/frontend/.env
# Edit packages/backend/.env and fill in OAuth credentials

# 3. Run database migrations
pnpm --filter backend db:migrate

# 4. Start both services
pnpm dev
```

Frontend: http://localhost:5173  
Backend API: http://localhost:3001

---

## Local run (Docker)

```bash
cp packages/backend/.env.example packages/backend/.env
# Edit packages/backend/.env with real OAuth credentials

docker compose up --build
```

Frontend: http://localhost:5173  
The SQLite file is persisted in a Docker volume (`sqlite-data`).

---

## Google OAuth setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. Create an OAuth 2.0 Client ID (Web application)
3. Add `http://localhost:3001/auth/google/callback` as an Authorized redirect URI
4. Copy Client ID and Secret into `packages/backend/.env`

## GitHub OAuth setup

1. Go to GitHub → Settings → Developer settings → OAuth Apps → New OAuth App
2. Set Authorization callback URL to `http://localhost:3001/auth/github/callback`
3. Copy Client ID and Secret into `packages/backend/.env`

---

## Commands

```bash
pnpm dev                          # start both backend + frontend
pnpm build                        # production build
pnpm typecheck                    # TypeScript checks for both packages
pnpm test                         # run all tests
pnpm db:seed                      # seed demo user, lists, and tasks
pnpm --filter backend test        # backend tests only
pnpm --filter frontend test       # frontend tests only
pnpm --filter backend db:generate # generate migration from schema changes
pnpm --filter backend db:migrate  # apply pending migrations
pnpm --filter backend db:seed     # backend seed command
```

---

## Demo seed data

Run the seed command after migrations:

```bash
pnpm db:seed
```

The script is idempotent for seed-owned rows. It seeds an existing user matching `SEED_EMAIL` when found; otherwise it creates a mock demo user (`demo@example.com` by default). It creates two lists and tasks covering overdue, due-soon, future, no-date, done, and mixed priority/status cases. Override the demo email with:

```bash
SEED_EMAIL=reviewer@example.com pnpm db:seed
```

The app still requires an authenticated browser session. For UI exploration with real OAuth, sign in once, then rerun the seed command with `SEED_EMAIL` set to that account email.

---

## Environment variables

| Variable | Package | Description |
|---|---|---|
| `PORT` | backend | HTTP server port (default: 3001) |
| `DATABASE_URL` | backend | Path to SQLite file (default: `./dev.db`) |
| `SESSION_SECRET` | backend | Secret for express-session |
| `NODE_ENV` | backend | `development` or `production` |
| `GOOGLE_CLIENT_ID` | backend | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | backend | Google OAuth client secret |
| `GOOGLE_CALLBACK_URL` | backend | Google OAuth callback URL |
| `GITHUB_CLIENT_ID` | backend | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | backend | GitHub OAuth client secret |
| `GITHUB_CALLBACK_URL` | backend | GitHub OAuth callback URL |
| `VITE_API_BASE_URL` | frontend | Backend base URL (used in production builds) |
| `WS_INTERVAL_MS` | backend | WebSocket notification push interval in ms (default: 60000) |
| `LOG_LEVEL` | backend | Backend log level: `debug`, `info`, `warn`, `error`, or `silent` |
| `LOG_FORMAT` | backend | Backend console log format: `pretty` or `json` |
| `LOG_TO_CONSOLE` | backend | Write backend logs to console output |
| `LOG_TO_FILE` | backend | Write backend logs to local files |
| `LOG_DIR` | backend | Backend log directory (default: `logs/backend`) |
| `VITE_LOG_LEVEL` | frontend | Frontend log level: `debug`, `info`, `warn`, `error`, or `silent` |
| `VITE_LOG_FORMAT` | frontend | Browser console log format: `pretty` or `json` |
| `VITE_LOG_BUFFER_SIZE` | frontend | Number of recent browser log entries kept in memory |
| `VITE_LOG_DEBUG_PANEL` | frontend | Expose `window.__APP_LOGS__` helpers for local debugging |

---

## Logging

Backend logs are written to the console and, by default, to ignored local files:

```text
logs/backend/app.log
logs/backend/error.log
```

Configure backend logging in `packages/backend/.env`:

```bash
LOG_LEVEL=debug
LOG_FORMAT=pretty
LOG_TO_CONSOLE=true
LOG_TO_FILE=true
LOG_DIR=logs/backend
```

Use `LOG_FORMAT=json` for searchable structured logs, especially in production or Docker. In Docker, backend logs are also available through normal container output:

```bash
docker compose logs backend
```

Frontend logs are written to the browser console and kept in a bounded in-memory buffer. Configure them in `packages/frontend/.env`:

```bash
VITE_LOG_LEVEL=debug
VITE_LOG_FORMAT=pretty
VITE_LOG_BUFFER_SIZE=500
VITE_LOG_DEBUG_PANEL=true
```

When `VITE_LOG_DEBUG_PANEL=true`, open the browser console and use:

```js
window.__APP_LOGS__.get()
window.__APP_LOGS__.export()
window.__APP_LOGS__.clear()
```

`export()` returns JSON that can be attached to an issue report. Frontend logs stay in the browser and are not sent to the backend.

---

## Delete strategy

Deleting a list cascades to all its tasks. This is enforced at the database level via `ON DELETE CASCADE` on the `tasks.list_id` foreign key. There is no soft-delete or undo.

---

## WebSocket notifications

After connecting, the client sends a `subscribe` message:
```json
{ "type": "subscribe", "payload": { "types": ["overdue", "due_soon"] } }
```

The server responds with a `notifications` message immediately on connect and then every 60 seconds (configurable via `WS_INTERVAL_MS` env var):
```json
{ "type": "notifications", "payload": [{ "taskId": "...", "title": "...", "type": "overdue", "dueDate": "..." }] }
```

The client dismisses a notification with an `ack`:
```json
{ "type": "ack", "payload": { "taskId": "..." } }
```

Acked task IDs are suppressed for the duration of the session.

---

## Theme

The UI supports light and dark themes. On first visit it follows the browser/OS color-scheme preference. After the user toggles the theme, the selected value is stored in `localStorage` under `task-manager-theme` and is restored on later visits.
