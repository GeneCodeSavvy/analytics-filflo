# Magic Link Invite System — Design Spec

**Date:** 2026-05-03  
**Status:** Approved

---

## Overview

Invite-only app. SUPER_ADMIN and MODERATOR send email invitations with a magic link. Clicking the link creates a stub DB user (no Clerk ID yet), marks the invitation accepted, and redirects the invitee to Clerk sign-up with email pre-filled. A Clerk webhook later links the Clerk user ID to the stub.

---

## User Flows

**SUPER_ADMIN flow:**
1. Picks existing org + enters invitee email → `POST /invitations`
2. Email sent via Resend with magic link
3. Invitee clicks link → `GET /api/invitations/:token` verifies token
4. Stub `User` created in DB (email, orgId, role, `clerkUserId = null`)
5. Invitation marked `ACCEPTED`
6. Frontend redirects to `/sign-up?email=<email>`
7. Invitee completes Clerk sign-up
8. Clerk fires `user.created` webhook → `POST /webhooks/clerk` links `clerkUserId` to stub

**MODERATOR flow:** identical except org is derived from `req.dbUser.orgId` (not chosen).

---

## Data Layer

### Schema change
```prisma
model User {
  clerkUserId  String?  @unique  // made nullable for stub users
}
```

### Invitation model (no changes needed)
`tokenHash String? @unique` already exists. Token lifecycle:
- `PENDING` — not yet clicked
- `ACCEPTED` — clicked, stub user created
- `EXPIRED` / `CANCELLED` — unusable

---

## API

### `POST /invitations` (existing — additions only)

Two new steps inserted before the DB write:
1. `rawToken = crypto.randomBytes(32).toString('hex')`
2. `tokenHash = createHash('sha256').update(rawToken).digest('hex')`
3. After invitation created: call `sendInviteMail(email, actorName, orgName, inviteLink)` where `inviteLink = ${appBaseUrl}/invitations/${rawToken}`

### `GET /invitations/:token` (new, public)

No auth middleware.

Steps:
1. Hash incoming token → query `Invitation` by `tokenHash`
2. Reject (400) if: not found, `status !== 'PENDING'`, `expiresAt < now`
3. Idempotency: if stub user already exists (`email + orgId` match), skip creation
4. Create stub `User`: `{ email, orgId, role, displayName: email, clerkUserId: null }`
5. Update invitation: `status = ACCEPTED`, `acceptedAt = now`
6. Return `{ email, orgName }`

### `POST /webhooks/clerk` (new, public)

Verified via svix (`CLERK_WEBHOOK_SECRET` env var). Requires `svix` package.

On `user.created` event:
1. Extract `email = evt.data.email_addresses[0].email_address`
2. Find stub user: `{ email, clerkUserId: null }`
3. If found: `update({ clerkUserId: evt.data.id, displayName: [firstName, lastName].filter(Boolean).join(' ') || email })`
4. If not found: log warning, return 200 (organic sign-up — shouldn't occur in invite-only app)

---

## Frontend

### `main.tsx`
Wrap with `ClerkProvider` using `VITE_CLERK_PUBLISHABLE_KEY`.

### `App.tsx` restructure
Split routes into two groups:

```
<Routes>
  {/* Public — no sidebar */}
  <Route path="/invitations/:token" Component={InvitationAccept} />
  <Route path="/sign-up" Component={SignUpPage} />

  {/* Protected — inside NavSidebar */}
  <Route path="/*" element={<NavSidebar>...</NavSidebar>} />
</Routes>
```

### `InvitationAccept` page (`/invitations/:token`)
- On mount: `GET /api/invitations/:token`
- Loading state: spinner
- Success: `navigate('/sign-up?email=' + encodeURIComponent(email))`
- Error: "This invitation is invalid or has expired." message

### `SignUpPage` (`/sign-up`)
- Read `email` from `useSearchParams()`
- Render Clerk `<SignUp initialValues={{ emailAddress: email }} />`
- After sign-up complete → Clerk redirects to `/`

---

## Environment Variables

| Var | Where | Purpose |
|-----|-------|---------|
| `RESEND_API_KEY` | API | already exists |
| `APP_BASE_URL` | API | already exists |
| `CLERK_WEBHOOK_SECRET` | API | new — svix verification |
| `VITE_CLERK_PUBLISHABLE_KEY` | Web | new — ClerkProvider |

---

## New Dependencies

| Package | App | Purpose |
|---------|-----|---------|
| `svix` | API | Clerk webhook signature verification |
| `@clerk/react` | Web | ClerkProvider + SignUp component |

---

## Security Notes

- Raw token never stored — only SHA-256 hash in DB
- Token single-use: invitation marked `ACCEPTED` on first verification
- Webhook verified via svix HMAC — unauthenticated POST rejected
- `requireDbUser` middleware unaffected: stub users have no `clerkUserId` so they can't authenticate until Clerk sign-up completes
