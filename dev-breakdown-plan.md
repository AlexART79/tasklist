Here's a comprehensive breakdown of the project into phases and stories. I'll show you the architecture first, then the full plan.Now here's the full phased plan:

---

## Phase 0 — Project scaffolding

**Goal**: A runnable monorepo with a "Hello World" homepage, Docker support, and CI-ready structure. Every subsequent phase builds on this foundation.

**Story 0.1 — Monorepo init**
Set up a `pnpm` (or npm) workspace with two packages: `packages/backend` and `packages/frontend`. Add root-level `package.json` with workspace scripts (`dev`, `build`, `test`). Initialize git, add `.gitignore`, `.nvmrc`, and `README.md` skeleton.

**Story 0.2 — Backend skeleton**
Scaffold Express + TypeScript (`tsconfig.json`, `ts-node-dev` for dev, `tsc` for prod build). Add a single `GET /health` endpoint returning `{ status: "ok" }`. Configure ESLint + Prettier.

**Story 0.3 — Frontend skeleton**
Scaffold React + Vite + TypeScript. Add React Router (for future routing). Create a bare `HomePage` component that fetches `/health` and displays "App is running". Configure proxy in `vite.config.ts` so `/api/*` forwards to the backend.

**Story 0.4 — Database bootstrap**
Integrate Drizzle ORM with `better-sqlite3`. Create the database file at a configurable path (`DATABASE_URL` env var). Add a `db:migrate` script. Create the first migration (empty, just to prove the toolchain works).

**Story 0.5 — Environment config**
Add `dotenv` to both packages. Document all env vars in `README.md` and provide `.env.example` files. Vars needed at this stage: `PORT`, `DATABASE_URL`, `NODE_ENV`, `SESSION_SECRET`.

**Story 0.6 — Docker setup**
Write `Dockerfile` for the backend (multi-stage: build → runtime). Write `Dockerfile` for the frontend (build with Vite, serve via Nginx or as static from the backend). Write `docker-compose.yml` that mounts a volume for the SQLite file and wires both services. Confirm `docker compose up` starts the app.

**Story 0.7 — Smoke test + README**
Write one integration smoke test (Vitest or Jest) that starts the server and hits `/health`. Document local run steps (native and Docker) in `README.md`.

**Milestone**: `pnpm dev` starts both backend and frontend; the browser shows "App is running"; `docker compose up` does the same; `pnpm test` passes.

---

## Phase 1 — Authentication (SSO)

**Goal**: A user can log in with Google or GitHub, stay logged in across refreshes, and log out. The backend persists user profiles.

**Story 1.1 — Database schema: users table**
Add Drizzle migration for `users` table: `id`, `provider` (`google`|`github`), `provider_user_id`, `email`, `display_name`, `avatar_url`, `created_at`.

**Story 1.2 — Session middleware**
Add `express-session` with `better-sqlite3` session store (or in-memory for now, replaced in 1.5). Configure `SESSION_SECRET`, cookie settings (`httpOnly`, `sameSite`, `secure` in prod).

**Story 1.3 — Passport.js + Google OAuth**
Integrate `passport-google-oidc` (or `passport-google-oauth20`). Add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` env vars. Implement upsert logic: find-or-create user by `provider + provider_user_id`. Implement `GET /auth/google` and `GET /auth/google/callback`.

**Story 1.4 — Passport.js + GitHub OAuth**
Mirror Story 1.3 for GitHub (`passport-github2`). Add `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_CALLBACK_URL`.

**Story 1.5 — Session persistence**
Switch session store to SQLite-backed store (e.g. `better-sqlite3-session-store`). Verify session survives server restart (page refresh keeps user logged in).

**Story 1.6 — Logout + `/me` endpoint**
Add `POST /auth/logout` (destroys session). Add `GET /auth/me` returning the current user or `401`. Add auth middleware helper `requireAuth` used by all future protected routes.

**Story 1.7 — Auth UI**
Build login page: "Continue with Google" and "Continue with GitHub" buttons (links to backend OAuth routes). After login, redirect to home. Show user avatar + display name in a top-right corner. Show logout button. Protect all non-auth routes (redirect to login if unauthenticated).

**Story 1.8 — Auth tests**
Test: mock OAuth provider response → user is created in DB → session cookie is set. Test: `GET /auth/me` with valid session returns user. Test: `GET /auth/me` without session returns 401. Test: logout destroys session.

**Milestone**: Full OAuth round-trip works for both providers; session persists across refresh; user can log out.

---

## Phase 2 — Lists / Projects

**Goal**: A logged-in user can create, rename, and delete their own lists. No other user can touch them.

**Story 2.1 — Database schema: lists table**
Migration: `lists` table with `id`, `user_id` (FK → users), `name`, `created_at`, `updated_at`.

**Story 2.2 — Lists REST API**
`GET /api/lists` — return all lists for current user.
`POST /api/lists` — create list (body: `{ name }`).
`PATCH /api/lists/:id` — rename (body: `{ name }`).
`DELETE /api/lists/:id` — delete.
All endpoints use `requireAuth`. Ownership check on every mutating operation (return 404 if list belongs to another user).

**Story 2.3 — Delete strategy decision**
Implement cascade delete (delete all tasks when a list is deleted — enforced at DB level with `ON DELETE CASCADE`). Document this choice in `README.md`.

**Story 2.4 — Lists UI**
Left sidebar showing user's lists. "New list" button with inline name input. Click a list to select it (highlighted). Rename via double-click or pencil icon. Delete with a confirmation prompt. Empty state: "No lists yet — create one to get started."

**Story 2.5 — Lists tests**
Test: user can create a list. Test: user cannot read/update/delete another user's list (403/404). Test: deleting a list cascades to its tasks (covered further in Phase 3).

**Milestone**: Sidebar is functional; data is isolated per user.

---

## Phase 3 — Tasks

**Goal**: Full CRUD for tasks within a selected list, with all required fields.

**Story 3.1 — Database schema: tasks table**
Migration: `tasks` table with `id`, `list_id` (FK → lists, `ON DELETE CASCADE`), `user_id` (denormalized for fast auth checks), `title`, `description`, `status` (`todo`|`in_progress`|`done`), `due_date` (ISO date string or null), `priority` (`low`|`medium`|`high`), `created_at`, `updated_at`.

**Story 3.2 — Tasks REST API**
`GET /api/lists/:listId/tasks` — all tasks in a list (with filter params: `status`, `priority`, `due_category`, `search`).
`POST /api/lists/:listId/tasks` — create task.
`PATCH /api/tasks/:id` — update any fields.
`DELETE /api/tasks/:id` — delete task.
All endpoints validate ownership of the parent list. Input validation with `zod`.

**Story 3.3 — Task list view**
Main content area shows tasks for the selected list. Each task card shows: title, priority badge, due date, status pill. "Quick status change" — dropdown or cycling button directly on the card (no modal needed for status). Empty state: "No tasks in this list."

**Story 3.4 — Task create/edit modal**
A modal (or drawer) with: title (required), description (textarea), status select, due date picker, priority select. Client-side validation (title required, due date must be valid). Loading state while saving. Error messages inline on fields.

**Story 3.5 — Tasks tests**
Test: user can create a task in their list. Test: user cannot access tasks in another user's list. Test: cascade — deleting a list deletes its tasks.

**Milestone**: Full task CRUD works end to end; modal validates inputs.

---

## Phase 4 — Search and filters

**Goal**: Users can search tasks and filter by status, priority, and due date category.

**Story 4.1 — Backend filter logic**
Extend `GET /api/lists/:listId/tasks` to accept query params: `search` (title + description LIKE), `status`, `priority`, `due_category` (`overdue`, `today`, `next7days`, `all`). Implement date-category logic server-side using SQLite date functions.

**Story 4.2 — Search & filter UI**
Search input above the task list (debounced, 300ms). Filter dropdowns/chips for status, priority, due date category. Clear filters button. No-results empty state: "No tasks match your filters."

**Story 4.3 — Filter persistence (optional)**
Store active filters in URL query params so sharing/refreshing preserves the view.

**Milestone**: Search and filters work; empty states are shown correctly.

---

## Phase 5 — WebSocket notifications

**Goal**: Two-way WebSocket communication — server pushes overdue/due-soon notifications; client sends a subscribe message and ack messages.

**Story 5.1 — WebSocket server setup**
Add `ws` library to the backend. Upgrade the HTTP server to support WS connections. Authenticate WS connections by validating the session cookie on upgrade (reject unauthenticated connections with 401).

**Story 5.2 — Notification scheduler**
On WS connect: immediately query for overdue tasks and due-soon tasks (due within 3 days, status ≠ done) for that user. Send initial batch as a `notifications` message. Start a `setInterval` (configurable, default 60 seconds) to repeat the check. Clear the interval on disconnect. Document the interval in `README.md`.

**Story 5.3 — Client → server messages**
Implement two client-sent message types:

- `subscribe` — sent immediately after connection; payload: `{ types: ["overdue", "due_soon"] }`. Server uses this to filter which notification types to send.
- `ack` — sent when user dismisses a notification; payload: `{ taskId: string }`. Server marks that notification as acknowledged in-memory for the session (suppresses re-sending it until the next connect).

Document both message formats in `README.md`.

**Story 5.4 — Notifications UI**
Notification bell icon in the top bar showing unread count badge. Notification panel (dropdown or drawer) listing: task title, type (`overdue`|`due soon`), due date. Dismiss button per notification (sends `ack`). Toast pop-up for new notifications arriving while panel is closed.

**Story 5.5 — WebSocket tests**
Test: WS connection without valid session is rejected. Test: on connect, server sends overdue task notifications (use an in-process WS client + seeded DB with a past-due task). Test: subscribe message filters notification types. Test: ack suppresses re-delivery.

**Milestone**: Real-time notifications flow in both directions; UI shows and dismisses them.

---

## Phase 6 — Quality, polish, and docs

**Goal**: Responsive UI, loading states, consistent design, full test coverage of acceptance criteria, and complete documentation.

**Story 6.1 — Responsive layout**
Sidebar collapses to a hamburger menu on narrow screens (< 768px). Task modal is full-screen on mobile. Test on 375px viewport.

**Story 6.2 — Loading states**
Show a skeleton or spinner for: initial task list load, auth redirect in progress. At least one main screen must have a visible loading state per the requirements.

**Story 6.3 — Hover/focus states**
Audit all interactive elements (buttons, links, list items, form controls) for visible `:hover` and `:focus-visible` states. Ensure keyboard navigation works throughout.

**Story 6.4 — Seed script**
Add `pnpm db:seed` script that inserts one demo user (via a mock provider token) + two lists + a handful of tasks (including one overdue and one due-soon) so reviewers can explore the app immediately.

**Story 6.5 — Full test pass**
Verify all six acceptance-criteria tests pass: SSO login (mock provider), create list + task, cross-user authorization, WS notifications. Add any missing coverage.

**Story 6.6 — API documentation**
Write a `docs/api.md` (or OpenAPI YAML) covering all endpoints: method, path, auth required, request body schema, response shape, error codes.

**Story 6.7 — README completion**
Final README sections: local run (native + Docker), Google OAuth setup, GitHub OAuth setup, WebSocket message formats + notification rules, test command, seed command, delete-strategy explanation, env var reference.

**Milestone**: Acceptance checklist fully green; README is self-sufficient for a new developer.

---

## Summary table

| Phase | Focus          | Key deliverable                 |
| ----- | -------------- | ------------------------------- |
| 0     | Scaffolding    | Runnable monorepo + Docker      |
| 1     | Auth (SSO)     | Google + GitHub login, sessions |
| 2     | Lists          | CRUD + ownership isolation      |
| 3     | Tasks          | CRUD + modal + quick status     |
| 4     | Search/filters | Query params + debounced UI     |
| 5     | WebSocket      | Two-way notifications           |
| 6     | Polish + docs  | Responsive, tests, README       |

Each phase ends with a working, demo-able checkpoint. Phases 2–4 can be parallelized if you ever split the work, and Phase 6 stories can be sprinkled in throughout rather than saved for the end — particularly the responsive work (6.1) and loading states (6.2), which are easier to build alongside the feature than retrofit.
