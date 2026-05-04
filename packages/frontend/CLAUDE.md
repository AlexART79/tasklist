# Frontend CLAUDE.md

Guidance for the React + Vite + TypeScript SPA in `packages/frontend/`.

## Commands

```bash
pnpm --filter frontend dev    # Vite dev server
pnpm --filter frontend build  # production build
pnpm --filter frontend test   # Vitest unit tests
```

Vite dev proxy forwards `/api/*` and `/auth/*` to the backend (configured in `vite.config.ts`).

## Architecture

- React Router for client-side routing; all non-auth routes redirect to `/login` if unauthenticated
- `src/pages/LoginPage.tsx` — OAuth login buttons (Google + GitHub)
- `src/pages/HomePage.tsx` — sidebar (lists) + main content (tasks)
- `src/components/TaskModal.tsx` — create/edit modal with client-side validation
- `src/hooks/useWebSocket.ts` — manages WS connection, dispatches notifications
- `src/components/NotificationBell.tsx` — badge, panel, toast for WS notifications

## Key conventions

- Active task filters (`search`, `status`, `priority`, `due_category`) are persisted in URL query params so the view survives refresh and can be bookmarked/shared.

## Testing

Vitest + React Testing Library. Unit tests cover components in isolation; no network mocking required for pure UI tests.

## Styling

### CSS approach

**Tailwind CSS v4** via `@tailwindcss/vite` plugin (Lightning CSS). No CSS Modules, no CSS-in-JS, no component-scoped stylesheets. All styling is applied as Tailwind utility classes directly in JSX `className` attributes. Global CSS (`src/index.css`) only contains `@import "tailwindcss"` plus a single `@apply` for the body baseline. There is no custom `tailwind.config.*` — all design tokens are Tailwind defaults.

### Color palette

| Role | Token |
|------|-------|
| Primary / brand accent | `indigo-600` |
| Accent light background | `indigo-100`, `indigo-50` |
| Page background | `slate-50` |
| Surface (cards, header) | `white` |
| Border | `slate-200` |
| Primary text | `slate-900` |
| Secondary text | `slate-500` / `slate-700` |

### Typography

- Font family: **Inter** (Google Fonts import), system-ui fallback, sans-serif — applied globally via `@apply` on `body`.
- Weights in use: 400 (body), `font-medium` (500), `font-semibold` (600).
- Sizes: standard Tailwind scale (`text-xs`, `text-sm`, `text-xl`, etc.) — no custom sizes.
- Text rendering: `antialiased` applied globally.

### Border-radius scale

| Use | Class |
|-----|-------|
| Large cards / modals | `rounded-2xl` |
| Icon badges | `rounded-xl` |
| Buttons / inputs | `rounded-lg` |
| Avatars / spinners | `rounded-full` |

### Layout patterns

All layouts use **flexbox only** (no CSS Grid in use). Common patterns:

- **Centered card** (login): `min-h-screen flex items-center justify-center` → inner card `max-w-sm w-full flex flex-col gap-6`
- **App shell** (home): `flex flex-col h-screen` → fixed header `h-14 flex items-center justify-between` + scrollable body `flex-1 overflow-auto`
- **Horizontal toolbar row**: `flex items-center gap-3` with `shrink-0` on icons to prevent flex compression

### Icon pattern

Inline SVG with `w-{n} h-{n}` sizing and `currentColor` fill/stroke — color set by a parent `text-{color}` class. Badge wrapper pattern: `w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center`.

### Avatar pattern

- Image present: `<img class="w-8 h-8 rounded-full object-cover ring-2 ring-slate-200" />`
- Fallback (initials): `<div class="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">` + `text-indigo-600 text-sm font-medium` initials

### Interactive states

- Hover: `hover:bg-slate-50` (light surfaces), `hover:bg-slate-800` (dark surfaces), `hover:text-slate-900` (text buttons)
- Transitions: `transition-colors` (150 ms default) on all interactive elements
- Loading spinner: `w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin`
- No dark-mode (`dark:`) or `focus-visible` patterns implemented yet

### Responsive design

Mobile-first. Only the `sm:` (640 px) breakpoint is used in current components — e.g. `hidden sm:block` to show display names. `max-w-sm` constrains the login card on wide viewports. No `md:` / `lg:` / `xl:` breakpoints yet.

### Shadows and elevation

- `shadow-lg` on floating cards (login card)
- `ring-2 ring-slate-200` for subtle depth on avatar images
- No other shadow utilities in use
