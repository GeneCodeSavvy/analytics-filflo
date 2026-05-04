# Super Admin Bootstrap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a private API script that creates the first local `SUPER_ADMIN` stub user without using invitations.

**Architecture:** The API workspace gets one focused `tsx` script under `apps/api/src/scripts`. It loads root `.env`, validates bootstrap variables, creates/reuses an org, refuses to run if any Super Admin exists, and creates/updates the bootstrap user with `clerkUserId = null`.

**Tech Stack:** TypeScript, pnpm workspace scripts, tsx, Prisma 7 with `@prisma/adapter-pg`, dotenv.

---

## File Structure

- Create `apps/api/src/scripts/seedSuperAdmin.ts`: private bootstrap script and all script-local validation.
- Modify `apps/api/package.json`: add `seed:super-admin`.
- Modify `.env.example`: document bootstrap env vars.

---

### Task 1: Add Bootstrap Script

**Files:**
- Create: `apps/api/src/scripts/seedSuperAdmin.ts`

- [ ] **Step 1: Create the script**

Create `apps/api/src/scripts/seedSuperAdmin.ts` with:

```ts
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "../../../../.env") });

const requiredEnvVars = [
  "DATABASE_URL",
  "BOOTSTRAP_SUPER_ADMIN_EMAIL",
  "BOOTSTRAP_SUPER_ADMIN_NAME",
  "BOOTSTRAP_ORG_NAME",
] as const;

const getRequiredEnv = (name: (typeof requiredEnvVars)[number]) => {
  const value = process.env[name]?.trim();

  if (!value) {
    return null;
  }

  return value;
};

const missing = requiredEnvVars.filter((name) => !getRequiredEnv(name));

if (missing.length) {
  console.error(`Missing required env vars: ${missing.join(", ")}`);
  process.exit(1);
}

const databaseUrl = getRequiredEnv("DATABASE_URL")!;
const email = getRequiredEnv("BOOTSTRAP_SUPER_ADMIN_EMAIL")!;
const displayName = getRequiredEnv("BOOTSTRAP_SUPER_ADMIN_NAME")!;
const orgName = getRequiredEnv("BOOTSTRAP_ORG_NAME")!;

const adapter = new PrismaPg({ connectionString: databaseUrl });
const db = new PrismaClient({ adapter, log: ["error"] });

const main = async () => {
  const existingSuperAdmin = await db.user.findFirst({
    where: { role: "SUPER_ADMIN" },
    select: { email: true },
  });

  if (existingSuperAdmin) {
    console.error(
      `Refusing to bootstrap: SUPER_ADMIN already exists (${existingSuperAdmin.email}).`,
    );
    process.exitCode = 1;
    return;
  }

  const org =
    (await db.org.findFirst({ where: { displayName: orgName } })) ??
    (await db.org.create({ data: { displayName: orgName } }));

  const existingUser = await db.user.findFirst({
    where: { email, orgId: org.id },
    select: { id: true },
  });

  const user = existingUser
    ? await db.user.update({
        where: { id: existingUser.id },
        data: {
          displayName,
          role: "SUPER_ADMIN",
          orgId: org.id,
          clerkUserId: null,
        },
      })
    : await db.user.create({
        data: {
          email,
          displayName,
          role: "SUPER_ADMIN",
          orgId: org.id,
          clerkUserId: null,
        },
      });

  console.log("Bootstrapped Super Admin");
  console.log(`User: ${user.email}`);
  console.log(`Org: ${org.displayName}`);
  console.log("Clerk link: pending user.created webhook");
};

main()
  .catch((error: unknown) => {
    console.error("Failed to bootstrap Super Admin");
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
```

- [ ] **Step 2: Confirm the script avoids non-existent unique constraints**

Run:

```bash
rg -n "email_orgId|upsert" apps/api/src/scripts/seedSuperAdmin.ts
```

Expected: no matches. The current Prisma schema indexes `User.email` but does not define a unique `email_orgId` selector.

---

### Task 2: Wire Package Script and Env Docs

**Files:**
- Modify: `apps/api/package.json`
- Modify: `.env.example`

- [ ] **Step 1: Add package script**

In `apps/api/package.json`, add:

```json
"seed:super-admin": "tsx src/scripts/seedSuperAdmin.ts"
```

inside the existing `scripts` object.

- [ ] **Step 2: Document bootstrap env vars**

In `.env.example`, add:

```env
# ── Bootstrap ─────────────────────────────────────────
BOOTSTRAP_SUPER_ADMIN_EMAIL=admin@example.com
BOOTSTRAP_SUPER_ADMIN_NAME=Filflo Admin
BOOTSTRAP_ORG_NAME=Filflo
```

---

### Task 3: Verify

**Files:**
- Verify only

- [ ] **Step 1: Run type checks**

Run:

```bash
pnpm --filter api check-types
```

Expected: TypeScript completes with no errors.

- [ ] **Step 2: Run lint**

Run:

```bash
pnpm --filter api lint
```

Expected: ESLint completes with no warnings or errors.

- [ ] **Step 3: Commit implementation**

Run:

```bash
git add apps/api/src/scripts/seedSuperAdmin.ts apps/api/package.json .env.example docs/superpowers/plans/2026-05-04-super-admin-bootstrap.md
git commit -m "feat(api): add super admin bootstrap script"
```

Expected: commit succeeds without staging unrelated workspace changes.
