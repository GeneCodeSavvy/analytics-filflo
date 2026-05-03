# Magic Link Invite System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an invite-only magic link flow where SUPER_ADMIN/MODERATOR send email invitations, invitees click the link to create a stub DB user, then complete Clerk sign-up which is linked back via webhook.

**Architecture:** Opaque random token (SHA-256 hashed in DB) in email URL → public `GET /invitations/:token` endpoint verifies and creates stub user → Clerk webhook `POST /webhooks/clerk` links clerkUserId after sign-up. Frontend adds `/invitations/:token` and `/sign-up` routes outside the NavSidebar wrapper.

**Tech Stack:** Express, Prisma (PostgreSQL), Resend, svix (Clerk webhook verification), @clerk/react (ClerkProvider + SignUp), React Router v7, node:crypto

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `apps/api/prisma/schema.prisma` | Make `clerkUserId` nullable on User |
| Modify | `apps/api/src/controllers/teams/invitations.ts` | Add token generation + email send to `createInvitation` |
| **Create** | `apps/api/src/controllers/invitations/verify.ts` | Verify token, create stub user, mark invitation accepted |
| **Create** | `apps/api/src/routes/invitations.ts` | Public route: `GET /invitations/:token` |
| **Create** | `apps/api/src/routes/webhooks.ts` | `POST /webhooks/clerk` — svix-verified webhook handler |
| Modify | `apps/api/src/app.ts` | Register public routes before `requireDbUser` |
| Modify | `apps/web/src/main.tsx` | Wrap with ClerkProvider |
| Modify | `apps/web/src/App.tsx` | Split public vs sidebar-wrapped routes |
| **Create** | `apps/web/src/components/InvitationAccept.tsx` | Verify page: calls API, redirects to /sign-up |
| **Create** | `apps/web/src/components/SignUpPage.tsx` | Clerk SignUp with email pre-filled |

---

## Task 1: Install dependencies

**Files:** none (package.json changes only)

- [ ] **Step 1: Install svix in API**

```bash
pnpm --filter api add svix
```

Expected: `svix` appears in `apps/api/package.json` dependencies.

- [ ] **Step 2: Install @clerk/react in web**

```bash
pnpm --filter web add @clerk/react
```

Expected: `@clerk/react` appears in `apps/web/package.json` dependencies.

- [ ] **Step 3: Commit**

```bash
git add apps/api/package.json apps/web/package.json pnpm-lock.yaml
git commit -m "chore: add svix and @clerk/react dependencies"
```

---

## Task 2: Make clerkUserId nullable in Prisma schema

**Files:**
- Modify: `apps/api/prisma/schema.prisma`

- [ ] **Step 1: Edit User model**

In `apps/api/prisma/schema.prisma`, change line:
```prisma
clerkUserId  String    @unique
```
to:
```prisma
clerkUserId  String?   @unique
```

- [ ] **Step 2: Run migration**

```bash
cd apps/api && pnpm exec prisma migrate dev --name make-clerk-user-id-nullable
```

Expected output: `The following migration(s) have been applied: .../make-clerk-user-id-nullable`

- [ ] **Step 3: Regenerate Prisma client**

```bash
pnpm exec prisma generate
```

- [ ] **Step 4: Commit**

```bash
git add apps/api/prisma/schema.prisma apps/api/prisma/migrations
git commit -m "feat(api): make clerkUserId nullable for stub invite users"
```

---

## Task 3: Update createInvitation to generate token and send email

**Files:**
- Modify: `apps/api/src/controllers/teams/invitations.ts`

- [ ] **Step 1: Add imports at top of file**

Add after the existing imports in `apps/api/src/controllers/teams/invitations.ts`:

```typescript
import { randomBytes, createHash } from "node:crypto";
import { sendInviteMail } from "../../lib/mail";
```

- [ ] **Step 2: Replace the createInvitation handler body**

Replace the existing `createInvitation` handler with:

```typescript
export const createInvitation: RequestHandler = async (req, res) => {
  const body = InvitePayloadSchema.safeParse(req.body);

  if (!body.success) {
    return sendInvalidRequest(res, "invite payload", body.error.issues);
  }

  const db = req.app.locals.db as DbClient;
  const actor = req.dbUser;

  const org = await db.org.findUnique({ where: { id: body.data.orgId } });

  if (!org) {
    return sendNotFound(res, "Org");
  }

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");

  const sentAt = new Date();
  const expiresAt = new Date(sentAt.getTime() + inviteExpiryDays * 24 * 60 * 60 * 1000);

  const invitation = await db.invitation.create({
    data: {
      email: body.data.email,
      role: body.data.role,
      orgId: body.data.orgId,
      invitedById: actor.id,
      tokenHash,
      sentAt,
      expiresAt,
      ...(body.data.message ? { message: body.data.message } : {}),
    },
    include: { org: true, invitedBy: true },
  });

  await db.teamAuditLog.create({
    data: {
      actorId: actor.id,
      targetEmail: body.data.email,
      orgId: body.data.orgId,
      action: "INVITED",
      toRole: body.data.role,
    },
  });

  const inviteLink = `${appBaseUrl}/invitations/${rawToken}`;

  await sendInviteMail(
    body.data.email,
    actor.displayName,
    org.displayName,
    inviteLink,
  );

  return sendValidatedData(res, InvitationSchema, {
    id: invitation.id,
    email: invitation.email,
    role: invitation.role,
    orgId: invitation.orgId,
    orgName: invitation.org.displayName,
    invitedBy: { id: invitation.invitedBy.id, name: invitation.invitedBy.displayName },
    sentAt: invitation.sentAt.toISOString(),
    expiresAt: invitation.expiresAt.toISOString(),
    status: invitation.status,
    inviteUrl: inviteLink,
  });
};
```

- [ ] **Step 3: Verify type-check passes**

```bash
pnpm --filter api check-types
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/controllers/teams/invitations.ts
git commit -m "feat(api): generate magic link token and send invite email on createInvitation"
```

---

## Task 4: Create invitation verify endpoint

**Files:**
- Create: `apps/api/src/controllers/invitations/verify.ts`
- Create: `apps/api/src/routes/invitations.ts`

- [ ] **Step 1: Create verify controller**

Create `apps/api/src/controllers/invitations/verify.ts`:

```typescript
import { createHash } from "node:crypto";
import type { RequestHandler } from "express";
import type { DbClient } from "../../lib/db";

export const verifyInvitation: RequestHandler = async (req, res) => {
  const { token } = req.params;

  if (!token || typeof token !== "string") {
    res.status(400).json({ success: false, error: "Missing token" });
    return;
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const db = req.app.locals.db as DbClient;

  const invitation = await db.invitation.findUnique({
    where: { tokenHash },
    include: { org: true },
  });

  if (!invitation) {
    res.status(404).json({ success: false, error: "Invalid invitation" });
    return;
  }

  if (invitation.status !== "PENDING") {
    res.status(400).json({ success: false, error: "Invitation already used or cancelled" });
    return;
  }

  if (invitation.expiresAt < new Date()) {
    await db.invitation.update({
      where: { id: invitation.id },
      data: { status: "EXPIRED" },
    });
    res.status(400).json({ success: false, error: "Invitation expired" });
    return;
  }

  // Idempotency: skip creation if stub user already exists for this email+org
  const existingUser = await db.user.findFirst({
    where: { email: invitation.email, orgId: invitation.orgId },
  });

  if (!existingUser) {
    await db.user.create({
      data: {
        email: invitation.email,
        displayName: invitation.email,
        role: invitation.role,
        orgId: invitation.orgId,
        clerkUserId: null,
      },
    });
  }

  await db.invitation.update({
    where: { id: invitation.id },
    data: { status: "ACCEPTED", acceptedAt: new Date() },
  });

  res.json({
    success: true,
    email: invitation.email,
    orgName: invitation.org.displayName,
  });
};
```

- [ ] **Step 2: Create public invitations router**

Create `apps/api/src/routes/invitations.ts`:

```typescript
import { Router } from "express";
import { verifyInvitation } from "../controllers/invitations/verify";

const invitationsRouter: Router = Router();

invitationsRouter.get("/:token", verifyInvitation);

export default invitationsRouter;
```

- [ ] **Step 3: Verify type-check**

```bash
pnpm --filter api check-types
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/controllers/invitations/verify.ts apps/api/src/routes/invitations.ts
git commit -m "feat(api): add public GET /invitations/:token verify endpoint"
```

---

## Task 5: Create Clerk webhook handler

**Files:**
- Create: `apps/api/src/routes/webhooks.ts`

- [ ] **Step 1: Create webhooks router**

Create `apps/api/src/routes/webhooks.ts`:

```typescript
import { Router, type Request, type Response } from "express";
import { Webhook } from "svix";
import type { DbClient } from "../lib/db";

const webhooksRouter: Router = Router();

webhooksRouter.post("/clerk", async (req: Request, res: Response) => {
  const secret = process.env.CLERK_WEBHOOK_SECRET;

  if (!secret) {
    console.error("CLERK_WEBHOOK_SECRET not set");
    res.status(500).json({ error: "Webhook secret not configured" });
    return;
  }

  const svixId = req.headers["svix-id"] as string;
  const svixTimestamp = req.headers["svix-timestamp"] as string;
  const svixSignature = req.headers["svix-signature"] as string;

  if (!svixId || !svixTimestamp || !svixSignature) {
    res.status(400).json({ error: "Missing svix headers" });
    return;
  }

  const wh = new Webhook(secret);
  let evt: { type: string; data: Record<string, unknown> };

  try {
    evt = wh.verify(JSON.stringify(req.body), {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as typeof evt;
  } catch {
    res.status(400).json({ error: "Invalid webhook signature" });
    return;
  }

  if (evt.type !== "user.created") {
    res.status(200).json({ received: true });
    return;
  }

  const data = evt.data as {
    id: string;
    email_addresses: Array<{ email_address: string }>;
    first_name: string | null;
    last_name: string | null;
  };

  const email = data.email_addresses[0]?.email_address;

  if (!email) {
    res.status(200).json({ received: true });
    return;
  }

  const db = req.app.locals.db as DbClient;

  const stubUser = await db.user.findFirst({
    where: { email, clerkUserId: null },
  });

  if (!stubUser) {
    console.warn(`[webhook] user.created for ${email} — no stub user found (organic sign-up?)`);
    res.status(200).json({ received: true });
    return;
  }

  const firstName = data.first_name ?? "";
  const lastName = data.last_name ?? "";
  const displayName = [firstName, lastName].filter(Boolean).join(" ") || email;

  await db.user.update({
    where: { id: stubUser.id },
    data: { clerkUserId: data.id, displayName },
  });

  res.status(200).json({ received: true });
});

export default webhooksRouter;
```

- [ ] **Step 2: Verify type-check**

```bash
pnpm --filter api check-types
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/routes/webhooks.ts
git commit -m "feat(api): add Clerk webhook handler to link clerkUserId to stub user"
```

---

## Task 6: Register public routes in app.ts before requireDbUser

**Files:**
- Modify: `apps/api/src/app.ts`

- [ ] **Step 1: Add imports and register public routes**

Replace the contents of `apps/api/src/app.ts` with:

```typescript
import express from "express";
import cors, { CorsOptions } from "cors";
import { clerkMiddleware } from "@clerk/express";
import dashboardRouter from "./routes/dashboard";
import messageRouter from "./routes/messages";
import notificationsRouter from "./routes/notifications";
import teamsRouter from "./routes/teams";
import ticketsRouter from "./routes/tickets";
import invitationsRouter from "./routes/invitations";
import webhooksRouter from "./routes/webhooks";
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

  // Public routes — no auth required
  app.use("/invitations", invitationsRouter);
  app.use("/webhooks", webhooksRouter);

  // Authenticated routes
  app.use(requireDbUser);

  app.use("/dashboard", dashboardRouter);
  app.use("/tickets", ticketsRouter);
  app.use("/teams", teamsRouter);
  app.use("/threads", messageRouter);
  app.use("/notifications", notificationsRouter);

  return app;
};
```

- [ ] **Step 2: Verify type-check**

```bash
pnpm --filter api check-types
```

Expected: no errors.

- [ ] **Step 3: Manual smoke test — verify token flow**

Start the API: `pnpm --filter api dev`

Call createInvitation (requires an authenticated user — use an existing session token or skip to frontend integration test).

Then call the verify endpoint with a fake token to confirm 404:

```bash
curl http://localhost:3000/invitations/faketoken123
```

Expected: `{"success":false,"error":"Invalid invitation"}`

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/app.ts
git commit -m "feat(api): register public /invitations and /webhooks routes before auth middleware"
```

---

## Task 7: Add ClerkProvider to web main.tsx

**Files:**
- Modify: `apps/web/src/main.tsx`

- [ ] **Step 1: Add VITE_CLERK_PUBLISHABLE_KEY to .env**

In the root `.env` (or `apps/web/.env`), add:

```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
```

Get the key from the Clerk dashboard → API Keys → Publishable key.

- [ ] **Step 2: Update main.tsx**

Replace `apps/web/src/main.tsx` with:

```typescript
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider } from "@clerk/react";
import "./index.css";
import App from "./App.tsx";
import { StrictMode } from "react";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </ClerkProvider>
  </StrictMode>,
);
```

- [ ] **Step 3: Verify type-check**

```bash
pnpm --filter web check-types
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/main.tsx
git commit -m "feat(web): wrap app with ClerkProvider"
```

---

## Task 8: Create InvitationAccept page

**Files:**
- Create: `apps/web/src/components/InvitationAccept.tsx`

- [ ] **Step 1: Create component**

Create `apps/web/src/components/InvitationAccept.tsx`:

```typescript
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";

export function InvitationAccept() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    fetch(`/api/invitations/${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || !data.success) {
          setError(data.error ?? "This invitation is invalid or has expired.");
          return;
        }
        navigate(`/sign-up?email=${encodeURIComponent(data.email)}`);
      })
      .catch(() => setError("Something went wrong. Please try again."));
  }, [token, navigate]);

  if (error) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "sans-serif" }}>
        <p style={{ color: "#c0392b", fontSize: "16px" }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <p style={{ color: "#6b6375", fontSize: "14px" }}>Verifying your invitation…</p>
    </div>
  );
}
```

- [ ] **Step 2: Verify type-check**

```bash
pnpm --filter web check-types
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/InvitationAccept.tsx
git commit -m "feat(web): add InvitationAccept page"
```

---

## Task 9: Create SignUpPage

**Files:**
- Create: `apps/web/src/components/SignUpPage.tsx`

- [ ] **Step 1: Create component**

Create `apps/web/src/components/SignUpPage.tsx`:

```typescript
import { SignUp } from "@clerk/react";
import { useSearchParams } from "react-router";

export function SignUpPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") ?? "";

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <SignUp
        initialValues={{ emailAddress: email }}
        afterSignUpUrl="/"
        routing="hash"
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify type-check**

```bash
pnpm --filter web check-types
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/SignUpPage.tsx
git commit -m "feat(web): add SignUpPage with Clerk SignUp and pre-filled email"
```

---

## Task 10: Restructure App.tsx — add public routes outside NavSidebar

**Files:**
- Modify: `apps/web/src/App.tsx`

- [ ] **Step 1: Update App.tsx**

Replace `apps/web/src/App.tsx` with:

```typescript
import "./App.css";
import Dashboard from "./components/Dashboard";
import NavSidebar from "./components/NavSidebar";
import { Routes, Route, Link } from "react-router";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import { Tickets } from "./components/Tickets";
import { Messages } from "./components/Messages";
import { Notifications } from "./components/Notifications";
import { Teams } from "./components/Team";
import { InvitationAccept } from "./components/InvitationAccept";
import { SignUpPage } from "./components/SignUpPage";

const NotFound = () => (
  <>
    <h1>404: Page Not Found</h1>
    <Link to="/">
      <h2>Return to Home.</h2>
    </Link>
  </>
);

const App = () => (
  <ErrorBoundary>
    <Routes>
      {/* Public routes — no sidebar */}
      <Route path="/invitations/:token" Component={InvitationAccept} />
      <Route path="/sign-up" Component={SignUpPage} />

      {/* Authenticated app routes — inside sidebar */}
      <Route
        path="/*"
        element={
          <NavSidebar>
            <Routes>
              <Route path="/" Component={Dashboard} />
              <Route path="/tickets" Component={Tickets}>
                <Route path=":ticketId" Component={Tickets} />
              </Route>
              <Route path="/messages" Component={Messages} />
              <Route path="/notifications" Component={Notifications} />
              <Route path="/teams" Component={Teams} />
              <Route path="*" Component={NotFound} />
            </Routes>
          </NavSidebar>
        }
      />
    </Routes>
  </ErrorBoundary>
);

export default App;
```

- [ ] **Step 2: Verify type-check**

```bash
pnpm --filter web check-types
```

Expected: no errors.

- [ ] **Step 3: Start dev server and test full flow manually**

```bash
pnpm dev
```

1. In the running app, navigate to `http://localhost:5173/invitations/faketoken` — should show "This invitation is invalid or has expired."
2. Navigate to `http://localhost:5173/sign-up?email=test@example.com` — should show Clerk sign-up form with email pre-filled.
3. Navigate to `http://localhost:5173/` — should show Dashboard inside NavSidebar (unchanged).

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/App.tsx
git commit -m "feat(web): split public and sidebar routes, add invitation and sign-up pages"
```

---

## Task 11: Configure CLERK_WEBHOOK_SECRET and register Clerk webhook

**Files:** none (env config + Clerk dashboard)

- [ ] **Step 1: Add CLERK_WEBHOOK_SECRET to .env**

```
CLERK_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
```

Get this from: Clerk dashboard → Webhooks → Add endpoint → URL: `https://your-api-domain.com/webhooks/clerk` → Subscribe to `user.created` event → copy Signing Secret.

- [ ] **Step 2: Verify webhook locally with ngrok (optional but recommended)**

```bash
npx ngrok http 3000
```

Use the ngrok URL as the webhook endpoint in Clerk dashboard for local testing.

- [ ] **Step 3: Commit env example update**

Add `CLERK_WEBHOOK_SECRET=` (blank value) to any `.env.example` file if one exists, then commit:

```bash
git add .env.example 2>/dev/null; git commit -m "chore: document CLERK_WEBHOOK_SECRET env var" 2>/dev/null || true
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| SUPER_ADMIN sends invite with org + email | Task 3 (createInvitation token + email) |
| MODERATOR sends invite (org from dbUser) | Existing `createInvitation` uses `body.data.orgId` — MODERATOR passes their own orgId; no new code needed |
| Magic link token: SHA-256 hash in DB, raw in URL | Task 3 |
| `GET /invitations/:token` verify endpoint | Task 4 |
| Stub user created (clerkUserId nullable) | Task 2 + Task 4 |
| Invitation marked ACCEPTED | Task 4 |
| Public routes before requireDbUser | Task 6 |
| ClerkProvider in frontend | Task 7 |
| `/invitations/:token` page | Task 8 |
| `/sign-up` page with email pre-filled | Task 9 |
| NavSidebar restructure | Task 10 |
| Clerk webhook links clerkUserId + displayName | Task 5 |
| CLERK_WEBHOOK_SECRET env var | Task 11 |

**No placeholders found.** All code blocks are complete.

**Type consistency:** `verifyInvitation` defined in Task 4 controller, imported in Task 4 router. `invitationsRouter`/`webhooksRouter` defined in Tasks 4/5, imported in Task 6. `InvitationAccept`/`SignUpPage` defined in Tasks 8/9, imported in Task 10. Consistent throughout.
