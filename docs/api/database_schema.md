# Database Schema Design

This document defines the target PostgreSQL/Prisma data model for Filflo. The goal is to replace feature-local mock data with one coordinated application schema shared by tickets, messages, teams, notifications, and dashboard queries.

Authentication is owned by Clerk. Filflo stores only app-domain user data needed for authorization, org ownership, ticket relationships, notifications, and audit history.

## Design Principles

- `Org` is the tenant boundary.
- A `User` belongs to exactly one org through `User.orgId`.
- Clerk owns authentication, sessions, passwords, OAuth providers, and account security.
- The local `User` row maps Clerk identity to Filflo authorization data through `clerkUserId`.
- There is no Settings page, so product preferences such as theme, density, quiet hours, notification preferences, muted tickets, and connected accounts are not modeled.
- `Ticket` is the central work object. Messages, notifications, activity, saved views, and dashboard metrics derive from ticket state.
- Ticket requesters and assignees live only in `TicketParticipant`. Do not duplicate requester or assignee foreign keys on `Ticket`.
- Ticket participants are limited to users who are requesters or assigned admins. There is no generic ticket invitee or separate chat participant model.
- Ticket threads are ticket-scoped. There is one thread per ticket in v1.
- Thread access is derived from ticket access and `TicketParticipant`; there is no `ThreadParticipant` table.
- Activity events are append-only. Ticket changes create `TicketActivity` rows only; messages do not duplicate system events.

## Core Enums

These enums should be shared between Prisma and `packages/shared/schema` so API validation and database constraints stay aligned.

```prisma
enum UserRole {
  SUPER_ADMIN
  ADMIN
  MODERATOR
  USER
}

enum TicketStatus {
  OPEN
  IN_PROGRESS
  ON_HOLD
  REVIEW
  RESOLVED
  CLOSED
}

enum TicketPriority {
  HIGH
  MEDIUM
  LOW
}

enum TicketParticipantRole {
  REQUESTER
  ASSIGNEE
}

enum MessageKind {
  USER_MESSAGE
  FILE_ATTACHMENT
}

enum InvitationStatus {
  PENDING
  ACCEPTED
  EXPIRED
  CANCELLED
}

enum ViewScope {
  BUILTIN
  USER
}

enum AuditAction {
  ROLE_CHANGED
  REMOVED
  INVITED
  INVITATION_CANCELLED
}

enum NotificationType {
  TICKET_ASSIGNED
  REVIEW_REQUESTED
  TICKET_INVITATION
  TICKET_RESOLVED
  TICKET_CLOSED
  NEW_TICKET_IN_ORG
  MESSAGE_ACTIVITY
}
```

## Clerk Integration

Clerk authenticates requests and returns a Clerk user ID. The API must map that ID to a local `User` row before running application queries.

Request flow:

1. Middleware verifies Clerk session.
2. API reads `clerkUserId` from Clerk auth context.
3. API loads `User` by `clerkUserId`.
4. API authorizes using local `User.role`, `User.orgId`, and `TicketParticipant`.

Local user data should be synchronized from Clerk on signup/webhook and updated when Clerk profile fields change.

Fields owned by Clerk and intentionally not stored here:

- Password hashes.
- OAuth provider accounts.
- Session tokens.
- MFA/security state.
- Account deletion security workflows.

## Organization And Users

### `Org`

Tenant/business unit. Deleting an org deletes its users, tickets, threads, notifications, and org-scoped records.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `String @id` | Example: `org-acme` or `cuid()` |
| `displayName` | `String` | Public org name |
| `logoUrl` | `String?` | Optional uploaded logo |
| `defaultPriority` | `TicketPriority @default(MEDIUM)` | Used by new ticket forms |
| `defaultCategories` | `String[]` | Initial ticket categories for the org |
| `createdAt` | `DateTime @default(now())` | |
| `updatedAt` | `DateTime @updatedAt` | |

Indexes:

- `@@index([displayName])`

### `User`

Local app-domain user profile and authorization record. Clerk remains the source of truth for login identity.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `String @id` | Example: `usr-201` or `cuid()` |
| `clerkUserId` | `String @unique` | Clerk user ID |
| `email` | `String` | Synced from Clerk for display/search |
| `displayName` | `String` | Synced from Clerk or edited through team/admin flows |
| `avatarUrl` | `String?` | Synced from Clerk or uploaded asset URL |
| `role` | `UserRole` | `SUPER_ADMIN`, `ADMIN`, `MODERATOR`, or `USER` |
| `orgId` | `String` | FK to `Org`, `onDelete: Cascade` |
| `lastActiveAt` | `DateTime?` | Team inactive state |
| `createdAt` | `DateTime @default(now())` | |
| `updatedAt` | `DateTime @updatedAt` | |

Indexes:

- `@@index([orgId])`
- `@@index([role])`
- `@@index([displayName])`
- `@@index([email])`

Business rules:

- A user can belong to only one org.
- Org moves are not supported in v1.
- A user should only be added to a ticket if they are in the same org as the ticket and their role fits the participant role.
- `ASSIGNEE` participants should be admins assigned to work the ticket.
- `REQUESTER` participants should be users who requested or created the ticket.

## Tickets

### `Ticket`

Central work item. Requesters and assignees are intentionally not stored here to avoid duplicate write paths.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `String @id` | Existing UI uses IDs like `TCK-1001`; future can use generated public IDs |
| `subject` | `String` | |
| `description` | `String` | Full description |
| `status` | `TicketStatus @default(OPEN)` | |
| `priority` | `TicketPriority @default(MEDIUM)` | |
| `category` | `String?` | Free text in v1; can become `TicketCategory` later |
| `orgId` | `String` | FK to owning org, `onDelete: Cascade` |
| `closedAt` | `DateTime?` | Set when status becomes `CLOSED` |
| `resolvedAt` | `DateTime?` | Set when status becomes `RESOLVED` |
| `createdAt` | `DateTime @default(now())` | |
| `updatedAt` | `DateTime @updatedAt` | Drives default list sorting |

Indexes:

- `@@index([orgId, status, priority])`
- `@@index([updatedAt])`
- `@@index([createdAt])`

Notes:

- The primary requester is the `TicketParticipant` row with `role = REQUESTER` and `isPrimary = true`.
- The primary assignee is the `TicketParticipant` row with `role = ASSIGNEE` and `isPrimary = true`.
- The creator/requester identity is represented by the primary requester participant, not a separate `Ticket.createdById` field.
- Ticket list/detail queries should join participants for requester and assignee data.

### `TicketParticipant`

Join table for all users directly involved in a ticket.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `String @id @default(cuid())` | |
| `ticketId` | `String` | FK to `Ticket`, `onDelete: Cascade` |
| `userId` | `String` | FK to `User`, `onDelete: Cascade` |
| `role` | `TicketParticipantRole` | `REQUESTER` or `ASSIGNEE` |
| `isPrimary` | `Boolean @default(false)` | Identifies primary requester or primary assignee |
| `addedById` | `String?` | FK to `User`, `onDelete: SetNull` |
| `createdAt` | `DateTime @default(now())` | |

Constraints:

- `@@unique([ticketId, userId, role])`
- `@@index([ticketId, role, isPrimary])`
- `@@index([userId, role])`

Business rules:

- A ticket must have exactly one primary requester.
- A ticket may have zero or one primary assignee.
- Requesters are users who created or requested the ticket.
- Assignees are admins assigned to work the ticket.
- Do not add moderators, super admins, or unrelated users as participants unless they are also a requester or assigned admin.
- PostgreSQL partial unique indexes should enforce one primary requester and one primary assignee per ticket:

```sql
CREATE UNIQUE INDEX ticket_one_primary_requester
  ON "TicketParticipant" ("ticketId")
  WHERE "role" = 'REQUESTER' AND "isPrimary" = true;

CREATE UNIQUE INDEX ticket_one_primary_assignee
  ON "TicketParticipant" ("ticketId")
  WHERE "role" = 'ASSIGNEE' AND "isPrimary" = true;
```

Prisma does not currently model partial unique indexes directly, so these should be added in a SQL migration.

### `TicketActivity`

Append-only ticket timeline. This is the only source of truth for ticket lifecycle events such as creation, status changes, priority changes, and assignee changes.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `String @id @default(cuid())` | |
| `ticketId` | `String` | FK to `Ticket`, `onDelete: Cascade` |
| `actorId` | `String` | FK to `User`, `onDelete: Restrict` |
| `type` | `String` | Matches current shared activity enum: `created`, `status_change`, etc. |
| `changes` | `Json?` | Shape: `{ field: { from, to } }` |
| `comment` | `String?` | Optional human-readable note |
| `createdAt` | `DateTime @default(now())` | |

Indexes:

- `@@index([ticketId, createdAt])`
- `@@index([actorId, createdAt])`

## Views

### `TicketView`

Saved/built-in ticket list views.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `String @id @default(cuid())` | |
| `name` | `String` | |
| `scope` | `ViewScope` | `BUILTIN` or `USER` |
| `ownerId` | `String?` | Required for user views, FK to `User`, `onDelete: Cascade` |
| `role` | `UserRole?` | Optional role target for built-in views |
| `filters` | `Json` | Current `TicketFiltersSchema` |
| `sort` | `Json` | Current `TicketSortSchema[]` |
| `groupBy` | `String?` | `org`, `status`, `priority`, `assignee` |
| `columns` | `String[]` | User-selected table columns |
| `createdAt` | `DateTime @default(now())` | |
| `updatedAt` | `DateTime @updatedAt` | |

Constraints:

- `@@index([scope, role])`
- `@@index([ownerId])`

## Threads And Messages

### `Thread`

One ticket-scoped conversation. v1 should enforce one thread per ticket.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `String @id @default(cuid())` | |
| `ticketId` | `String @unique` | FK to `Ticket`, `onDelete: Cascade` |
| `lastMessageId` | `String?` | FK to `Message`, `onDelete: SetNull` |
| `lastMessageAt` | `DateTime?` | Cached for thread list sorting |
| `createdAt` | `DateTime @default(now())` | |
| `updatedAt` | `DateTime @updatedAt` | |

Indexes:

- `@@index([lastMessageAt])`

Notes:

- Thread access is derived from the parent ticket and `TicketParticipant`.
- There is no `ThreadParticipant` table.
- There is no thread-level mute state in v1.

### `Message`

Flat messages inside a ticket thread.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `String @id @default(cuid())` | |
| `threadId` | `String` | FK to `Thread`, `onDelete: Cascade` |
| `senderId` | `String` | FK to `User`, `onDelete: Restrict` |
| `kind` | `MessageKind` | User or attachment message |
| `content` | `String?` | Text body |
| `createdAt` | `DateTime @default(now())` | Current API calls this `at` |
| `editedAt` | `DateTime?` | Optional future support |
| `deletedAt` | `DateTime?` | Soft delete for auditability |

Indexes:

- `@@index([threadId, createdAt])`
- `@@index([senderId, createdAt])`

### `MessageReadState`

Per-user read position for a thread. This stores unread state without creating a separate thread participant/access model.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `String @id @default(cuid())` | |
| `threadId` | `String` | FK to `Thread`, `onDelete: Cascade` |
| `userId` | `String` | FK to `User`, `onDelete: Cascade` |
| `lastReadAt` | `DateTime?` | Used for unread counts |
| `createdAt` | `DateTime @default(now())` | |
| `updatedAt` | `DateTime @updatedAt` | |

Constraints:

- `@@unique([threadId, userId])`
- `@@index([userId, lastReadAt])`

Notes:

- A row here does not grant access. It only records read state for users who already have ticket access.

### `MessageTicketRef`

Explicit `#ticket` references in message content.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `String @id @default(cuid())` | |
| `messageId` | `String` | FK to `Message`, `onDelete: Cascade` |
| `ticketId` | `String` | FK to `Ticket`, `onDelete: Cascade` |

Constraints:

- `@@unique([messageId, ticketId])`
- `@@index([ticketId])`

### `FileAsset`

Uploaded files used by messages, avatars, and org logos.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `String @id @default(cuid())` | |
| `orgId` | `String` | FK to `Org`, `onDelete: Cascade` |
| `uploadedById` | `String` | FK to `User`, `onDelete: Restrict` |
| `name` | `String` | Original filename |
| `size` | `Int` | Bytes |
| `mimeType` | `String` | |
| `url` | `String` | Storage URL |
| `thumbnailUrl` | `String?` | For images/previews |
| `createdAt` | `DateTime @default(now())` | |

Indexes:

- `@@index([orgId, createdAt])`
- `@@index([uploadedById, createdAt])`

### `MessageFile`

Attach uploaded files to messages.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `String @id @default(cuid())` | |
| `messageId` | `String` | FK to `Message`, `onDelete: Cascade` |
| `fileId` | `String` | FK to `FileAsset`, `onDelete: Cascade` |

Constraints:

- `@@unique([messageId, fileId])`

## Teams, Invitations, And Audit

### `Invitation`

Invitations to join an org. The invitation controls app role/org assignment; Clerk controls the authenticated account.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `String @id @default(cuid())` | |
| `email` | `String` | Invitee email |
| `role` | `UserRole` | Role to grant on acceptance |
| `orgId` | `String` | FK to `Org`, `onDelete: Cascade` |
| `invitedById` | `String` | FK to `User`, `onDelete: Restrict` |
| `status` | `InvitationStatus @default(PENDING)` | |
| `tokenHash` | `String @unique` | Optional app invite token hash if Clerk invite links are not enough |
| `message` | `String?` | Optional invitation message |
| `sentAt` | `DateTime @default(now())` | |
| `expiresAt` | `DateTime` | |
| `acceptedAt` | `DateTime?` | |
| `createdAt` | `DateTime @default(now())` | |
| `updatedAt` | `DateTime @updatedAt` | |

Indexes:

- `@@index([orgId, status])`
- `@@index([email, status])`

Acceptance behavior:

- Accepting an invitation creates or links a Clerk user.
- Filflo creates one local `User` row with `clerkUserId`, invitation `orgId`, and invitation `role`.
- Org moves are not supported. Changing a user's org requires removing the old local user relationship and creating a new invitation/user flow.

### `TeamAuditLog`

Append-only team administration audit.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `String @id @default(cuid())` | |
| `actorId` | `String` | FK to `User`, `onDelete: Restrict` |
| `targetUserId` | `String?` | FK to `User`, `onDelete: SetNull` |
| `targetEmail` | `String?` | For invitees not yet local users |
| `orgId` | `String` | FK to `Org`, `onDelete: Cascade` |
| `action` | `AuditAction` | |
| `fromRole` | `UserRole?` | |
| `toRole` | `UserRole?` | |
| `reason` | `String?` | |
| `createdAt` | `DateTime @default(now())` | Current API calls this `at` |

Indexes:

- `@@index([orgId, createdAt])`
- `@@index([actorId, createdAt])`
- `@@index([targetUserId, createdAt])`

## Notifications

### `Notification`

Stored in-app notification feed. Notification channel preferences are not stored because there is no Settings page in v1.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `String @id @default(cuid())` | |
| `recipientId` | `String` | FK to `User`, `onDelete: Cascade` |
| `actorId` | `String?` | FK to `User`, `onDelete: SetNull` |
| `type` | `NotificationType` | |
| `ticketId` | `String?` | FK to `Ticket`, `onDelete: Cascade` |
| `threadId` | `String?` | FK to `Thread`, `onDelete: Cascade` |
| `messageId` | `String?` | FK to `Message`, `onDelete: Cascade` |
| `title` | `String` | Snapshot for display |
| `body` | `String?` | Snapshot for display |
| `readAt` | `DateTime?` | Null means unread |
| `createdAt` | `DateTime @default(now())` | |

Indexes:

- `@@index([recipientId, readAt, createdAt])`
- `@@index([ticketId])`
- `@@index([threadId])`

Notification creation rules:

- Ticket assignment creates `TICKET_ASSIGNED` for newly assigned admins.
- Review status transitions create `REVIEW_REQUESTED` for users who need to act.
- Message activity creates `MESSAGE_ACTIVITY` for ticket participants except the sender.
- Ticket resolution/closure creates `TICKET_RESOLVED` or `TICKET_CLOSED` for requesters and active participants.

## Relationship Map

```text
ClerkUser
  +-- User

Org
  +-- User
  +-- Ticket
  |   +-- TicketParticipant
  |   +-- TicketActivity
  |   +-- Thread
  |       +-- Message
  |           +-- MessageReadState
  |           +-- MessageTicketRef
  |           +-- MessageFile -- FileAsset
  +-- Invitation
  +-- TeamAuditLog

User
  +-- TicketView
  +-- Notification
```

## Authorization Queries

The API should derive access from Clerk authentication plus local app records.

### Current user lookup

- Read Clerk user ID from the authenticated request.
- Load local `User` by `clerkUserId`.
- Use local `User.role` and `User.orgId` for app authorization.

### Ticket visibility

- `SUPER_ADMIN`: all tickets.
- `ADMIN`: tickets where the user has a `TicketParticipant` row with `role = ASSIGNEE`.
- `MODERATOR`: tickets where `Ticket.orgId = currentUser.orgId`.
- `USER`: tickets where the user has a `TicketParticipant` row with `role = REQUESTER`.

### Thread visibility

Thread access inherits ticket visibility. There is no separate participant list for messages:

- Super admins can read all ticket threads.
- Moderators can read all ticket threads in their org.
- Admins can read ticket threads for tickets assigned to them.
- Users can read ticket threads for tickets they requested.

### Team and org operations

- Team user listing filters by `User.orgId`.
- Role changes update `User.role` and write `TeamAuditLog`.
- Org moves are not supported.
- Clerk account creation/deletion should be coordinated through Clerk webhooks or server-side Clerk APIs.

## Migration Plan

1. Add Prisma and Postgres configuration to `apps/api` or a dedicated shared database package.
2. Create `schema.prisma` from this document.
3. Add SQL migrations for partial unique indexes on primary ticket participants.
4. Add Clerk middleware to authenticate requests before controller logic.
5. Add Clerk webhook handling to create/update local `User` rows.
6. Add a seed script that creates the current mock orgs, users, tickets, views, threads, messages, invitations, and notifications.
7. Replace feature-local data files under `apps/api/src/controllers/**/data.ts` with Prisma queries.
8. Keep API response shapes aligned with `packages/shared/schema` by mapping database rows to existing DTOs.
9. Add integration tests or controller-level tests once a test runner is configured.

## Removed From Scope

- Settings page persistence.
- Theme and density preferences.
- Quiet hours.
- Notification channel preferences.
- Muted tickets or muted threads.
- Password hashes.
- OAuth provider account tables.
- App-managed sessions.
- Thread participant/access tables.
- Multi-org memberships.
- Org moves.
- Message mentions.
- System events in messages.

## Open Implementation Decisions

- ID strategy: preserve human-readable IDs like `TCK-1001` as primary keys, or add internal `id` plus public `ticketNumber`.
- Category model: keep `Ticket.category` as text for v1, or normalize into `TicketCategory` per org.
- Clerk sync behavior: create local `User` only after invitation acceptance, or allow self-signup into a default org.
- File storage: store all uploaded files in `FileAsset`, or let Clerk-hosted avatars stay as external URLs only.
- Full-text search: use Prisma filters for v1, then add PostgreSQL GIN indexes for ticket subject/description and message content when search volume grows.
