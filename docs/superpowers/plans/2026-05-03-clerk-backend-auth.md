# Clerk Backend Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Clerk JWT verification to the Express API, expose the authenticated DB user on every request via `req.dbUser`, and centralise env vars at the monorepo root.

**Architecture:** `clerkMiddleware()` from `@clerk/express` runs globally and populates `req.auth.userId`. A custom `requireDbUser` middleware reads that ID, looks up the DB user, and attaches it to `req.dbUser`. Both are applied in `createApp()` before any router — no per-route decoration needed. A side quest wires a single root `.env` for all apps.

**Tech Stack:** `@clerk/express`, Express 5, Prisma, Vitest, pnpm monorepo, Turborepo, Vite

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `apps/api/src/lib/auth.ts` | **Create** | `DbUser` type, Express augmentation, `requireDbUser` middleware |
| `apps/api/src/app.ts` | **Modify** | Add `clerkMiddleware()` + `requireDbUser` globally |
| `apps/api/src/index.ts` | **Modify** | Point dotenv at root `.env` |
| `apps/api/src/controllers/teams/invitations.ts` | **Modify** | Replace `actor` workaround with `req.dbUser` |
| `apps/api/src/__tests__/auth.test.ts` | **Create** | Unit tests for `requireDbUser` |
| `apps/api/package.json` | **Modify** | Add `@clerk/express`, `vitest`, `@vitest/coverage-v8` |
| `apps/api/vitest.config.ts` | **Create** | Vitest config for ESM |
| `apps/web/vite.config.ts` | **Modify** | Set `envDir` to monorepo root |
| `turbo.json` | **Modify** | Add Clerk + app env vars to `globalEnv` |
| `/.env.example` | **Create** | All env vars documented |

---

## Task 1: Install dependencies

**Files:**
- Modify: `apps/api/package.json`

- [ ] **Step 1: Install `@clerk/express` and test deps**

```bash
cd apps/api
pnpm add @clerk/express
pnpm add -D vitest @vitest/coverage-v8
```

- [ ] **Step 2: Add test script to `apps/api/package.json`**

Open `apps/api/package.json` and add to `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/package.json pnpm-lock.yaml
git commit -m "chore(api): add @clerk/express and vitest"
```

---

## Task 2: Vitest config

**Files:**
- Create: `apps/api/vitest.config.ts`

- [ ] **Step 1: Create vitest config**

Create `apps/api/vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/__tests__/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
    },
  },
});
```

- [ ] **Step 2: Verify vitest resolves**

```bash
cd apps/api
pnpm test
```

Expected: `No test files found` (no tests yet, exits 0 with vitest's `--passWithNoTests` default — if it errors, add `--passWithNoTests` to the test script).

- [ ] **Step 3: Commit**

```bash
git add apps/api/vitest.config.ts
git commit -m "chore(api): add vitest config"
```

---

## Task 3: `requireDbUser` middleware — failing tests first

**Files:**
- Create: `apps/api/src/__tests__/auth.test.ts`

- [ ] **Step 1: Write failing tests**

Create `apps/api/src/__tests__/auth.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { requireDbUser } from "../lib/auth";

const mockNext = vi.fn() as unknown as NextFunction;

const makeRes = () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
};

const makeReq = (overrides: Partial<Request> = {}): Request =>
  ({
    auth: { userId: null },
    app: { locals: { db: {} } },
    ...overrides,
  }) as unknown as Request;

describe("requireDbUser", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when no clerk userId", async () => {
    const req = makeReq({ auth: { userId: null } } as any);
    const res = makeRes();

    await requireDbUser(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Unauthenticated",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("returns 401 when clerk userId has no matching DB user", async () => {
    const db = { user: { findUnique: vi.fn().mockResolvedValue(null) } };
    const req = makeReq({
      auth: { userId: "user_clerk123" },
      app: { locals: { db } },
    } as any);
    const res = makeRes();

    await requireDbUser(req, res, mockNext);

    expect(db.user.findUnique).toHaveBeenCalledWith({
      where: { clerkUserId: "user_clerk123" },
      select: {
        id: true,
        clerkUserId: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        role: true,
        orgId: true,
      },
    });
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "User not found",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("attaches dbUser to req and calls next when user exists", async () => {
    const dbUser = {
      id: "db_1",
      clerkUserId: "user_clerk123",
      email: "a@b.com",
      displayName: "Alice",
      avatarUrl: null,
      role: "ADMIN",
      orgId: "org_1",
    };
    const db = { user: { findUnique: vi.fn().mockResolvedValue(dbUser) } };
    const req = makeReq({
      auth: { userId: "user_clerk123" },
      app: { locals: { db } },
    } as any);
    const res = makeRes();

    await requireDbUser(req, res, mockNext);

    expect((req as any).dbUser).toEqual(dbUser);
    expect(mockNext).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd apps/api
pnpm test
```

Expected: FAIL — `Cannot find module '../lib/auth'`

---

## Task 4: Implement `requireDbUser`

**Files:**
- Create: `apps/api/src/lib/auth.ts`

- [ ] **Step 1: Create `src/lib/auth.ts`**

```ts
import type { RequestHandler } from "express";
import type { DbClient } from "./db";

export type DbUser = {
  id: string;
  clerkUserId: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: "SUPER_ADMIN" | "ADMIN" | "MODERATOR" | "USER";
  orgId: string;
};

declare global {
  namespace Express {
    interface Request {
      dbUser: DbUser;
    }
  }
}

export const requireDbUser: RequestHandler = async (req, res, next) => {
  const clerkUserId = (req as any).auth?.userId as string | null | undefined;

  if (!clerkUserId) {
    res.status(401).json({ success: false, error: "Unauthenticated" });
    return;
  }

  const db = req.app.locals.db as DbClient;
  const user = await db.user.findUnique({
    where: { clerkUserId },
    select: {
      id: true,
      clerkUserId: true,
      email: true,
      displayName: true,
      avatarUrl: true,
      role: true,
      orgId: true,
    },
  });

  if (!user) {
    res.status(401).json({ success: false, error: "User not found" });
    return;
  }

  req.dbUser = user;
  next();
};
```

- [ ] **Step 2: Run tests — expect PASS**

```bash
cd apps/api
pnpm test
```

Expected:
```
✓ src/__tests__/auth.test.ts (3 tests) 
Test Files  1 passed
Tests       3 passed
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/lib/auth.ts apps/api/src/__tests__/auth.test.ts apps/api/vitest.config.ts
git commit -m "feat(api): add requireDbUser middleware with tests"
```

---

## Task 5: Wire middleware into `app.ts`

**Files:**
- Modify: `apps/api/src/app.ts`

- [ ] **Step 1: Update `app.ts`**

Replace the entire file content:
```ts
import express from "express";
import cors, { CorsOptions } from "cors";
import { clerkMiddleware } from "@clerk/express";
import dashboardRouter from "./routes/dashboard";
import messageRouter from "./routes/messages";
import notificationsRouter from "./routes/notifications";
import teamsRouter from "./routes/teams";
import ticketsRouter from "./routes/tickets";
import type { DbClient } from "./lib/db";
import { requireDbUser } from "./lib/auth";

const corsOptions: CorsOptions = {
  origin: process.env.CORS_URLS || "http://localhost:5173",
  credentials: true,
};

export const createApp = (db: DbClient): express.Application => {
  const app = express();
  app.use(express.json());
  app.use(cors(corsOptions));
  app.locals.db = db;

  app.use(clerkMiddleware());
  app.use(requireDbUser);

  app.use("/dashboard", dashboardRouter);
  app.use("/tickets", ticketsRouter);
  app.use("/teams", teamsRouter);
  app.use("/threads", messageRouter);
  app.use("/notifications", notificationsRouter);

  return app;
};
```

- [ ] **Step 2: Type-check**

```bash
cd apps/api
pnpm check-types
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/app.ts
git commit -m "feat(api): wire clerkMiddleware and requireDbUser globally"
```

---

## Task 6: Replace `actor` workaround in invitations controller

**Files:**
- Modify: `apps/api/src/controllers/teams/invitations.ts`

- [ ] **Step 1: Update `createInvitation`**

In `apps/api/src/controllers/teams/invitations.ts`, replace the `createInvitation` function body. Find:

```ts
  const db = req.app.locals.db as DbClient;
  const org = await db.org.findUnique({ where: { id: body.data.orgId } });

  if (!org) {
    return sendNotFound(res, "Org");
  }

  // TODO: replace with actual authenticated actor id from session
  const actor = await db.user.findFirst({ where: { role: "ADMIN" } });

  if (!actor) {
    return sendNotFound(res, "Actor");
  }
```

Replace with:

```ts
  const db = req.app.locals.db as DbClient;
  const actor = req.dbUser;

  const org = await db.org.findUnique({ where: { id: body.data.orgId } });

  if (!org) {
    return sendNotFound(res, "Org");
  }
```

Also update the `db.teamAuditLog.create` call — `orgId` now comes from `actor.orgId` when not supplied. The body already has `body.data.orgId` so no change needed there — just ensure `actorId: actor.id` is still correct (it is).

- [ ] **Step 2: Type-check**

```bash
cd apps/api
pnpm check-types
```

Expected: no errors.

- [ ] **Step 3: Run tests**

```bash
cd apps/api
pnpm test
```

Expected: 3 tests pass.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/controllers/teams/invitations.ts
git commit -m "feat(api): replace actor workaround with req.dbUser in invitations"
```

---

## Task 7: Side quest — root `.env` setup

**Files:**
- Create: `/.env.example`
- Modify: `apps/api/src/index.ts`
- Modify: `apps/web/vite.config.ts`
- Modify: `turbo.json`

- [ ] **Step 1: Create `/.env.example` at monorepo root**

Create `/Users/harshsharma/Desktop/100xdevs/work/filflo/.env.example`:
```bash
# ── Database ──────────────────────────────────────────
DATABASE_URL=postgresql://user:password@localhost:5432/filflo

# ── Clerk ─────────────────────────────────────────────
# Backend only
CLERK_SECRET_KEY=sk_test_...
# Frontend only (VITE_ prefix required for Vite to expose to browser)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

# ── API ───────────────────────────────────────────────
PORT=3000
CORS_URLS=http://localhost:5173
APP_BASE_URL=http://localhost:5173

# ── Resend ────────────────────────────────────────────
RESEND_API_KEY=re_...
```

Copy to `.env` and fill in real values (`.env` is gitignored):
```bash
cp .env.example .env
```

- [ ] **Step 2: Update `apps/api/src/index.ts` to load root `.env`**

Replace `import "dotenv/config";` at the top of `apps/api/src/index.ts` with:

```ts
import { config } from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "../../../.env") });
```

This resolves from `apps/api/src/` (dev) or `apps/api/dist/` (build) — both go up three levels to the monorepo root.

- [ ] **Step 3: Update `apps/web/vite.config.ts` to load root `.env`**

Replace the file content:
```ts
import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  envDir: path.resolve(__dirname, "../.."),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 4: Update `turbo.json` `globalEnv`**

Replace `turbo.json` content:
```json
{
  "$schema": "https://turborepo.dev/schema.json",
  "ui": "tui",
  "globalEnv": [
    "PORT",
    "CORS_URLS",
    "DATABASE_URL",
    "CLERK_SECRET_KEY",
    "VITE_CLERK_PUBLISHABLE_KEY",
    "APP_BASE_URL",
    "RESEND_API_KEY"
  ],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", ".env*"],
      "outputs": ["dist/**"]
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "check-types": {
      "dependsOn": ["^check-types"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

- [ ] **Step 5: Verify types still pass**

```bash
cd /Users/harshsharma/Desktop/100xdevs/work/filflo
pnpm check-types
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add .env.example apps/api/src/index.ts apps/web/vite.config.ts turbo.json
git commit -m "chore: centralise env vars at monorepo root"
```

---

## Task 8: Add `CLERK_SECRET_KEY` guard in `index.ts`

**Files:**
- Modify: `apps/api/src/index.ts`

- [ ] **Step 1: Add guard after dotenv load**

In `apps/api/src/index.ts`, after the dotenv config block, add:

```ts
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

if (!CLERK_SECRET_KEY) {
  console.error("CLERK_SECRET_KEY not provided in .env");
  process.exit(1);
}
```

- [ ] **Step 2: Type-check**

```bash
cd apps/api
pnpm check-types
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/index.ts
git commit -m "chore(api): guard CLERK_SECRET_KEY at startup"
```
