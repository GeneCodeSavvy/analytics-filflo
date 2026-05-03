# Clerk Backend Auth — Design Spec
_Date: 2026-05-03_

## Overview

Add Clerk JWT verification to the Express API and expose the authenticated DB user on every request. All routes are protected. User creation is out of scope here — it belongs in the invitation acceptance flow (spec 2).

---

## 1. Middleware Architecture

Two layers applied globally in `app.ts`, in order:

### Layer 1 — `clerkMiddleware()` (`@clerk/express`)

Verifies the JWT from `Authorization: Bearer <token>`. Populates `req.auth.userId` with the Clerk user ID. Does **not** reject on missing/invalid token — leaves `userId` as null. Handles JWKS caching and key rotation automatically.

### Layer 2 — `requireDbUser` (custom, `src/lib/auth.ts`)

Reads `req.auth.userId`, queries `db.user.findUnique({ where: { clerkUserId } })`, attaches full DB user to `req.dbUser`.

Rejection rules:
| Case | Status | Body |
|------|--------|------|
| `req.auth.userId` is null | `401` | `{ success: false, error: "Unauthenticated" }` |
| No DB user for that clerkUserId | `401` | `{ success: false, error: "User not found" }` |

No `403` here — authorization (role checks) stays in individual controllers.

Both layers are registered globally in `createApp()`. No per-route decoration.

---

## 2. TypeScript Integration

`src/lib/auth.ts` augments the Express `Request` type so `req.dbUser` is fully typed everywhere with no casting:

```ts
declare global {
  namespace Express {
    interface Request {
      dbUser: DbUser
    }
  }
}

type DbUser = Pick<
  User,
  "id" | "clerkUserId" | "email" | "displayName" | "avatarUrl" | "role" | "orgId"
>
```

Controllers replace the existing workaround:
```ts
// before
const actor = await db.user.findFirst({ where: { role: "ADMIN" } });

// after
const actor = req.dbUser;
```

---

## 3. Error Responses

Uses existing `sendError` helper from `src/lib/controllers.ts`. Consistent with all other error shapes in the API.

---

## 4. Environment Variables

Only `CLERK_SECRET_KEY` is required on the backend. `CLERK_PUBLISHABLE_KEY` is frontend-only but documented for completeness.

```
CLERK_SECRET_KEY=sk_...
CLERK_PUBLISHABLE_KEY=pk_...
```

---

## 5. Side Quest — Root `.env` Setup

Add `.env.example` at the monorepo root. Configure both `apps/api` and `apps/web` to read env from the root so variables don't need to be duplicated across app-level `.env` files.

Approach: turborepo supports `dotenv` at the root via `turbo.json` `env` fields or a root `.env` picked up by each app's dev tooling. Vite reads `.env` files by walking up the directory tree when `envDir` is configured; Express reads from `dotenv/config` which can be pointed at a root path.

Deliverables:
- `/.env.example` with all variables for both apps documented
- `apps/api` dotenv load pointed at root `.env`
- `apps/web` Vite `envDir` pointed at root
- `turbo.json` `env` entries updated so build cache is correctly busted on env changes

---

## 6. Files Touched

| File | Change |
|------|--------|
| `apps/api/src/lib/auth.ts` | New — `requireDbUser` middleware + `DbUser` type + Express augmentation |
| `apps/api/src/app.ts` | Add `clerkMiddleware()` + `requireDbUser` globally |
| `apps/api/src/controllers/teams/invitations.ts` | Replace `actor` workaround with `req.dbUser` |
| `apps/api/package.json` | Add `@clerk/express` |
| `/.env.example` | New — all env vars documented |
| `turbo.json` | Add env var entries |
| `apps/web/vite.config.ts` | Set `envDir` to root |
| `apps/api/src/index.ts` | Point dotenv at root `.env` |

---

## 7. Out of Scope

- User creation (handled in invitation acceptance spec)
- Role-based authorization (already in controllers, no changes needed)
- Clerk webhooks
- Session management (stateless JWT — no sessions)
