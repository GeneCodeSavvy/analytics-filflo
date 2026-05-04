# Super Admin Bootstrap Script — Design Spec

**Date:** 2026-05-04  
**Status:** Approved

---

## Overview

Filflo is invite-only, but the first `SUPER_ADMIN` cannot be invited because no trusted actor exists yet. Add a private provisioning script in the API workspace that creates the first Super Admin as a local stub user. Clerk identity is linked later by the existing `user.created` webhook when the person signs up with the same email.

This is not a public setup route and does not change the invite-only product flow.

---

## Command

```bash
pnpm --filter api seed:super-admin
```

The script reads the root `.env`, matching the API server's existing env-loading pattern.

Required environment variables:

```env
DATABASE_URL=
BOOTSTRAP_SUPER_ADMIN_EMAIL=
BOOTSTRAP_SUPER_ADMIN_NAME=
BOOTSTRAP_ORG_NAME=
```

No Clerk user ID is required. The bootstrap user is created with `clerkUserId = null`.

---

## Behavior

1. Validate required env vars.
2. Refuse to run if any `User` already has `role = SUPER_ADMIN`.
3. Find or create an `Org` using `BOOTSTRAP_ORG_NAME`.
4. Find a `User` by `BOOTSTRAP_SUPER_ADMIN_EMAIL` and update it, or create a new user.
5. Set the user fields:
   - `email = BOOTSTRAP_SUPER_ADMIN_EMAIL`
   - `displayName = BOOTSTRAP_SUPER_ADMIN_NAME`
   - `role = SUPER_ADMIN`
   - `orgId = bootstrap org id`
   - `clerkUserId = null`
6. Print a concise success summary.
7. Disconnect Prisma before exit.

The script does not create an invitation, send email, expose an HTTP endpoint, or support force/manual linking behavior.

---

## Clerk Linking

After bootstrap, the Super Admin signs up through Clerk using the same email. The existing Clerk `user.created` webhook finds the local stub user by email where `clerkUserId = null` and writes the Clerk user ID.

This design intentionally does not handle already-existing Clerk users or later sign-in reconciliation.

---

## Files

| File | Change |
|------|--------|
| `apps/api/src/scripts/seedSuperAdmin.ts` | New bootstrap script |
| `apps/api/package.json` | Add `seed:super-admin` script |
| `.env.example` | Document bootstrap env vars if the file exists in the workspace |

---

## Error Handling

- Missing env vars: print the missing variable names and exit `1`.
- Existing Super Admin: print the blocking user email and exit `1`.
- Database errors: print a concise failure message and exit `1`.

No partial rollback is required beyond Prisma's single create/update operations because the script has only one org upsert-like step and one user write.

---

## Verification

Run:

```bash
pnpm --filter api check-types
pnpm --filter api lint
```

For manual verification, run the script against an empty development database with bootstrap env vars set, then confirm one org and one `SUPER_ADMIN` user exist and the user has `clerkUserId = null`.
