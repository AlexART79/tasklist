# API Reference

All API endpoints are served by the Express backend (default: `http://localhost:3001`).

Authentication is session-based (cookie `connect.sid`). Endpoints marked **Auth required** return `401` when no valid session is present.

## Data Shapes

### User
```json
{
  "id": "uuid",
  "provider": "google" | "github",
  "email": "user@example.com",
  "displayName": "Jane Doe",
  "avatarUrl": "https://...",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### List
```json
{
  "id": "uuid",
  "userId": "uuid",
  "name": "My List",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Task
```json
{
  "id": "uuid",
  "listId": "uuid",
  "userId": "uuid",
  "title": "Fix the bug",
  "description": "Optional description",
  "status": "todo" | "in_progress" | "done",
  "dueDate": "2024-12-31",
  "priority": "low" | "medium" | "high",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Error
```json
{ "error": "Unauthorized" }
```
Validation errors return a Zod error object: `{ "error": { "issues": [...] } }`

---

## Authentication

### `GET /auth/google`
Redirects the browser to Google's OAuth consent screen.

### `GET /auth/google/callback`
Google OAuth callback. On success, redirects to `FRONTEND_URL` (env var). Sets the session cookie.

### `GET /auth/github`
Redirects the browser to GitHub's OAuth authorization page.

### `GET /auth/github/callback`
GitHub OAuth callback. On success, redirects to `FRONTEND_URL`. Sets the session cookie.

### `GET /auth/me`
Returns the currently authenticated user.

**Auth required:** yes

**Response `200`:**
```json
{ "id": "...", "displayName": "Jane", "avatarUrl": "...", "email": "...", "provider": "google" }
```

**Response `401`:**
```json
{ "error": "Unauthorized" }
```

### `POST /auth/logout`
Destroys the current session.

**Response `204`:** No content.

---

## Lists

All list endpoints require authentication. Operations on lists owned by other users return `404` (not `403`) to avoid leaking existence.

### `GET /api/lists`
Returns all lists belonging to the authenticated user, ordered by `createdAt` ascending.

**Response `200`:** `List[]`

### `POST /api/lists`
Creates a new list.

**Request body:**
```json
{ "name": "My List" }
```
`name` — required, 1–255 characters.

**Response `201`:** `List`

**Response `400`:** Validation error.

### `PATCH /api/lists/:id`
Renames a list.

**Request body:**
```json
{ "name": "New Name" }
```
`name` — required, 1–255 characters.

**Response `200`:** Updated `List`

**Response `404`:** List not found or belongs to another user.

### `DELETE /api/lists/:id`
Deletes a list and all its tasks (cascade).

**Response `204`:** No content.

**Response `404`:** List not found or belongs to another user.

---

## Tasks

All task endpoints require authentication. Operations on tasks owned by other users return `404`.

### `GET /api/lists/:listId/tasks`
Returns tasks in the specified list. Supports filtering via query parameters.

**Query parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Full-text search on `title` and `description` |
| `status` | string (repeatable) | Filter by status: `todo`, `in_progress`, `done` |
| `priority` | string (repeatable) | Filter by priority: `low`, `medium`, `high` |
| `due_category` | string | `overdue`, `today`, `next7days`, or omit for all |

Multiple values for `status` and `priority` are OR-combined:
```
GET /api/lists/123/tasks?status=todo&status=in_progress&priority=high
```

**Response `200`:** `Task[]`

**Response `404`:** List not found or belongs to another user.

### `POST /api/lists/:listId/tasks`
Creates a task in the specified list.

**Request body:**
```json
{
  "title": "Fix the bug",
  "description": "Optional",
  "status": "todo",
  "dueDate": "2024-12-31",
  "priority": "medium"
}
```

| Field | Required | Constraints |
|-------|----------|-------------|
| `title` | yes | 1–500 characters |
| `description` | no | string or null |
| `status` | no | `todo` \| `in_progress` \| `done` (default: `todo`) |
| `dueDate` | no | `YYYY-MM-DD` format or null |
| `priority` | no | `low` \| `medium` \| `high` (default: `medium`) |

**Response `201`:** `Task`

**Response `400`:** Validation error.

**Response `404`:** List not found or belongs to another user.

### `PATCH /api/tasks/:id`
Updates a task. All fields are optional (partial update).

**Request body:** Same fields as `POST`, all optional.

**Response `200`:** Updated `Task`

**Response `404`:** Task not found or belongs to another user.

### `DELETE /api/tasks/:id`
Deletes a task.

**Response `204`:** No content.

**Response `404`:** Task not found or belongs to another user.

---

## Health

### `GET /health`
Liveness check. No authentication required.

**Response `200`:**
```json
{ "status": "ok" }
```

---

## WebSocket

### `GET /ws` (HTTP Upgrade)
Establishes a WebSocket connection. Authentication is performed via the session cookie (`connect.sid`) on the HTTP upgrade handshake.

**Response `401`:** Upgrade rejected if no valid session.

See [WebSocket message formats](../README.md#websocket-notifications) in the README for the full subscribe / notifications / ack protocol.
