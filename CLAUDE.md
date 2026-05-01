# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Dev (all apps)
pnpm dev

# Dev (single app)
pnpm --filter web dev

# Build
pnpm build

# Lint
pnpm lint

# Type check
pnpm check-types

# Format
pnpm format
```

Package manager: **pnpm**. Use `pnpm --filter <package>` to scope commands.

## Architecture

Turborepo monorepo with two workspaces:

- `apps/web` — React 19 + Vite SPA (the main app)
- `packages/ui` — shared component library
- `packages/eslint-config` / `packages/typescript-config` — shared tooling configs

### apps/web

Tech: React 19, React Router v7, Tailwind CSS v4, shadcn/ui, Motion, Base UI, Tabler Icons, HugeIcons.

Layout: `NavSidebar` wraps all routes. `BrowserRouter` → `App` → `NavSidebar` → `<Routes>`.

Routes:
- `/` → Dashboard
- `/tickets` → Tickets
- `/messages` → Messages
- `/notifications` → Notifications
- `/teams` → Teams
- `/settings` → Settings (nested routes: `profile`, `security`, `notifications`, `appearance`, `org`, `danger`)

Settings uses nested `<Route>` children rendered via `<Outlet>` inside `Settings.tsx`.

Utility: `src/lib/utils.ts` (cn helper), `src/lib/logger.ts`.

UI components live in `src/components/ui/`. Feature components live in `src/components/`.

### packages/ui

Shared primitives (`button`, `card`, `code`). Import via `@repo/ui` in `apps/web` if needed.

## Docs

`docs/` contains page-level design specs (`dashboardPage.md`, `ticketsPage.md`, etc.). Read these before implementing new features on those pages.
