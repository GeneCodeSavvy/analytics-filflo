# Repository Guidelines

## Project Structure & Module Organization

This is a pnpm/Turborepo monorepo. Application code lives in `apps/`: `apps/web` is the Vite React client and `apps/api` is the Express/WebSocket API. Shared packages live in `packages/`: `shared` contains schemas and types, `ui` contains React primitives, and the config packages hold ESLint and TypeScript settings. Feature notes and plans are in `docs/`.

In `apps/web`, keep API clients in `src/api`, state in `src/stores`, hooks in `src/hooks`, and UI in `src/components`. In `apps/api`, routes belong in `src/routes`, controller logic in `src/controllers`, helpers in `src/lib`, and WebSocket setup in `src/ws`.

## Build, Test, and Development Commands

- `pnpm dev`: run all package `dev` tasks through Turbo.
- `pnpm build`: build all apps and packages.
- `pnpm lint`: run ESLint across configured workspaces.
- `pnpm check-types`: run TypeScript checks where configured.
- `pnpm format`: format `ts`, `tsx`, and `md` files with Prettier.
- `pnpm --filter web dev`: start only the Vite web app.
- `pnpm --filter api dev`: start only the API with `tsx watch`.

Use filtered commands when working on one app to keep feedback fast.

## Coding Style & Naming Conventions

Write TypeScript throughout the repo. Follow the existing Prettier style: two-space indentation, double quotes, semicolons, and trailing commas where Prettier inserts them. Use PascalCase for React components and component files, such as `Dashboard.tsx`; use camelCase for hooks, stores, utilities, and API modules, such as `useTicketQueries.ts` or `ticketParams.ts`. Keep shared domain schemas in `packages/shared/schema`.

## Testing Guidelines

No dedicated test runner or test files are currently configured. Before opening a PR, run `pnpm lint`, `pnpm check-types`, and `pnpm build`. When adding tests, place them near the code they cover using `*.test.ts` or `*.test.tsx`, and add a workspace `test` script so Turbo can run it.

## Commit & Pull Request Guidelines

Recent commits use short Conventional Commit-style subjects, for example `feat: dashboard page`, `feat(web): add useSettingsMutations TanStack Query mutation hooks`, and `fix(settings): address code review issues`. Use `feat`, `fix`, `chore`, or similar prefixes with an optional scope.

PRs should include a concise summary, verification commands run, linked issues or docs, and screenshots or recordings for visible UI changes. Call out API or shared schema changes because they can affect both apps.

## Configuration & Security Tips

Keep local secrets and environment-specific values out of git. Prefer root workspace scripts and shared config packages over app-specific one-off tooling unless the app has a clear need.
