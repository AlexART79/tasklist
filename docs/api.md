# API Reference

All protected HTTP endpoints require the session cookie created by OAuth login. Protected endpoints return `401` when no valid session is present. Ownership failures return `404` so resources from other users are not revealed.

## Health

### `GET /health`
- Auth: not required
- Response `200`: `{ "status": "ok" }`

## Auth

### `GET /auth/google`
- Auth: not required
- Starts Google OAuth. Redirects to Google.

### `GET /auth/google/callback`
- Auth: not required
- OAuth callback. On success, creates/updates the user session and redirects to `FRONTEND_URL` or `http://localhost:5173/`.
- Failure: redirects to `/login`.

### `GET /auth/github`
- Auth: not required
- Starts GitHub OAuth. Redirects to GitHub.

### `GET /auth/github/callback`
- Auth: not required
- OAuth callback. On success, creates/updates the user session and redirects to `FRONTEND_URL` or `http://localhost:5173/`.
- Failure: redirects to `/login`.

### `GET /auth/me`
- Auth: required
- Response `200`:
```json
{
  "id": "user-id",
  "provider": "google",
  "providerUserId": "provider-id",
  "email": "user@example.com",
  "displayName": "User Name",
  "avatarUrl": "https://example.com/avatar.png",
  "createdAt": "2026-05-05T12:00:00.000Z"
}
```
- Errors: `401`

### `POST /auth/logout`
- Auth: optional
- Destroys the current session.
- Response `204`

### `GET /auth/test-login`
- Auth: not required
- Available only when `NODE_ENV=test`.
- Query: optional `seed` string.
- Creates a mock Google user, logs the request into a test session, and returns `200`.

## Lists

List shape:
```json
{
  "id": "list-id",
  "userId": "user-id",
  "name": "Work",
  "createdAt": "2026-05-05T12:00:00.000Z",
  "updatedAt": "2026-05-05T12:00:00.000Z"
}
```

### `GET /api/lists`
- Auth: required
- Response `200`: array of lists belonging to the current user.
- Errors: `401`

### `POST /api/lists`
- Auth: required
- Body:
```json
{ "name": "Work" }
```
- Validation: `name` is required, 1-255 characters.
- Response `201`: created list.
- Errors: `400`, `401`

### `PATCH /api/lists/:id`
- Auth: required
- Body:
```json
{ "name": "Renamed list" }
```
- Validation: `name` is required, 1-255 characters.
- Response `200`: updated list.
- Errors: `400`, `401`, `404`

### `DELETE /api/lists/:id`
- Auth: required
- Response `204`
- Errors: `401`, `404`
- Notes: deleting a list cascades to its tasks.

## Tasks

Task shape:
```json
{
  "id": "task-id",
  "listId": "list-id",
  "userId": "user-id",
  "title": "Ship release",
  "description": "Optional details",
  "status": "todo",
  "dueDate": "2026-05-12",
  "priority": "medium",
  "createdAt": "2026-05-05T12:00:00.000Z",
  "updatedAt": "2026-05-05T12:00:00.000Z"
}
```

Allowed values:
- `status`: `todo`, `in_progress`, `done`
- `priority`: `low`, `medium`, `high`
- `due_category`: `overdue`, `today`, `next7days`, `all`

### `GET /api/lists/:listId/tasks`
- Auth: required
- Query:
  - `search`: matches task title or description
  - `status`: repeatable
  - `priority`: repeatable
  - `due_category`: one of the allowed values
- Response `200`: array of matching tasks in the list.
- Errors: `401`, `404`

Example:
```text
GET /api/lists/list-id/tasks?search=deploy&status=todo&priority=high&due_category=next7days
```

### `POST /api/lists/:listId/tasks`
- Auth: required
- Body:
```json
{
  "title": "Ship release",
  "description": "Optional details",
  "status": "todo",
  "dueDate": "2026-05-12",
  "priority": "medium"
}
```
- Validation:
  - `title` is required, 1-500 characters.
  - `description` is optional or `null`.
  - `status` defaults to `todo`.
  - `dueDate` is optional or `null`, format `YYYY-MM-DD`.
  - `priority` defaults to `medium`.
- Response `201`: created task.
- Errors: `400`, `401`, `404`

### `PATCH /api/tasks/:id`
- Auth: required
- Body: any subset of task fields accepted by create.
- Response `200`: updated task.
- Errors: `400`, `401`, `404`

### `DELETE /api/tasks/:id`
- Auth: required
- Response `204`
- Errors: `401`, `404`

## WebSocket

### `GET /ws`
- Auth: required via session cookie during WebSocket upgrade.
- Unauthenticated upgrades are rejected with `401`.

Server sends `notifications` immediately after connect and then every `WS_INTERVAL_MS` milliseconds.

```json
{
  "type": "notifications",
  "payload": [
    {
      "taskId": "task-id",
      "title": "Ship release",
      "type": "due_soon",
      "dueDate": "2026-05-06"
    }
  ]
}
```

Client subscription message:
```json
{
  "type": "subscribe",
  "payload": { "types": ["overdue", "due_soon"] }
}
```

Client acknowledgement message:
```json
{
  "type": "ack",
  "payload": { "taskId": "task-id" }
}
```

Notification rules:
- `overdue`: due date before today and status is not `done`.
- `due_soon`: due date from today through the next 3 days and status is not `done`.
- Acked task IDs are suppressed for the current WebSocket session.
