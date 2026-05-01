# Ideation Phase Comments
- Super Admins can see all teams of each org. Add and remove Admins/Moderators/Users/SuperAdmin of from the orgs. They can promote Admins to Super Admins
- Admins only see the teams of each org. Cannot manipulate the members of the orgs
- Moderators can see the members of their respective orgs. Add or remove Users (members in the org). They can promote Users to Moderators. They can demote Users to Moderators.
- Users can only see the list of same org. Cannot manipulate the members of the orgs


# After Brain Strom Comments
Teams is the page that looks simple in the spec and gets messy in implementation. It's basically four different pages wearing the same name, because the permission model varies so dramatically by role. Worth being honest about that upfront — pretending it's "one page with permission gates" leads to a UI that serves no role well.

## The biggest tension in your spec

Re-reading carefully, there's an ambiguity worth flagging: you say Super Admins can "add and remove Admins/Moderators/Users/SuperAdmin" — but where do new people come from? Are they invited by email? Pulled from an existing user pool? Created from scratch? The interaction model hinges entirely on this and your spec doesn't say.

The two reasonable answers:

1. **Invite-by-email flow:** the "add" button opens a modal, you type an email, the system sends an invite, they accept and join with the assigned role. This is the Slack/Linear/Notion pattern and it's what most people expect.
2. **Closed pool:** users exist in the system already (created by some other process — SSO, signup, etc.) and Teams is just for assigning them roles within orgs.

I'd assume #1 unless you have a reason for #2. Either way, design for it explicitly — the "add member" affordance is the page's primary action and shouldn't be a vague placeholder.

There's also a subtle inconsistency in your spec worth catching: *"They can promote Users to Moderators. They can demote Users to Moderators."* The second one should be "demote Moderators to Users" — Moderators get demoted *to* Users, not the reverse. Small typo but matters because the Teams page is where this action lives, and the UI copy needs to be right.

## Structure: org-grouped, not flat

For Super Admins and Admins (who see multiple orgs), the page needs to be **organized by org first, role second**. A flat list of every member across every org is unusable past a few orgs.

Pattern that works: collapsible org sections, each showing member count and a small role breakdown (`12 members · 1 Super Admin · 2 Admins · 3 Moderators · 6 Users`). Click to expand into the member table. An "expand all / collapse all" toggle for power users.

For Moderators and Users (single-org view), skip the grouping — just show the member table directly with the org name as a page header.

A search box at the top that searches across all orgs (for Super Admin) or within the org. Filter chips for role.

## The member table

Same density principles as the Tickets table. Columns roughly:

`Avatar · Name · Email · Role · Joined · Last active · Actions`

A few specifics:

**Role as a colored pill, not text.** Super Admin = purple, Admin = blue, Moderator = green, User = gray. Reuse these colors anywhere roles appear (assignee chips on tickets, message participants, etc.) so the visual language stays consistent.

**Last active is high-signal.** Tells you who's actually using the system. "Active 2 days ago" vs "Last seen 4 months ago" matters a lot when you're deciding who to demote or remove. Most teams pages skip this and they shouldn't.

**Actions column is role-gated.** A three-dot menu per row that contains only the actions the viewing user can take on that target user. A Moderator looking at a User sees `Promote to Moderator · Remove from org`. A Moderator looking at another Moderator (or Admin) sees nothing — no menu, no greyed-out items, just absent. Greyed-out actions in permission contexts are noise; they teach users about permissions they don't have.

**Hover-row checkboxes for bulk operations** — same as Tickets. Bulk remove, bulk role change. Especially useful for Super Admins onboarding/offboarding at scale.

## The promotion/demotion ladder

Your spec implies a hierarchy: User → Moderator → Admin → Super Admin. But the *who can promote whom* is partial:

- Moderators promote/demote between User ↔ Moderator (within org)
- Super Admins promote Admins to Super Admins
- Super Admins can change anyone's role across orgs

Worth nailing down explicitly: can Super Admins promote a User directly to Admin? Can they demote a Super Admin back to Admin? Can a Moderator be promoted to Admin, or only to Super Admin via the Admin path? These are policy questions, not UI questions, but the UI exposes them and you'll get bug reports if they're inconsistent.

My recommendation: any role transition the policy allows should be **a single action**, not a multi-step dance. If a Super Admin wants to promote a User directly to Admin, that's one click in the menu, not "first promote to Moderator, then to Admin." Explicit ladder steps are tedious and the system already knows what's permitted.

When promoting/demoting, **always require a confirmation modal** that names what's changing: *"Promote Sarah Chen from User to Moderator in Acme Corp? They'll be able to add and remove Users in this org."* The "what new powers does this give them" line is what makes the action feel safe instead of scary. Same pattern for demotions, with what they'll *lose*.

## Removing members — the dangerous action

Removal is destructive and easy to do by accident. Conventions worth following:

- Confirmation modal that requires typing the user's name (or just typing "REMOVE" — less harsh) for actions that affect someone's access
- Make clear what happens to the user's tickets — do they stay, get reassigned, get deleted? Your data model needs an answer here, and the modal needs to surface it: *"Sarah's 12 open tickets will be reassigned to you"* or *"will remain assigned to Sarah but she won't be able to access them"*
- Distinguish "remove from org" from "delete user account." A user might be in multiple orgs (or might be later, even if not now in your model). Removing them from one shouldn't nuke the account.

For Super Admins demoting *another Super Admin*, this is the most dangerous action on the page — you're effectively reducing someone's peer-level power. Worth a stronger confirmation, maybe even requiring a reason for the audit log.

## Cross-org movement (Super Admin power)

Your spec says Super Admins can manage members across orgs. Worth thinking about whether they can **move** a user from one org to another, not just remove and re-add. If so, that's a distinct action: "Move to org..." with a dropdown of other orgs. Probably more useful than people realize until you ship it.

If you don't support cross-org membership at all (each user belongs to exactly one org), say so in the data model and the UI is simpler. If you do, the Teams page needs to show all of a user's org memberships somewhere — probably in their detail panel.

## Member detail panel

Same drawer pattern as Tickets — clicking a row opens a right-side panel with:

- Profile basics (name, email, avatar, role)
- Activity stats: tickets created, tickets assigned, avg resolution time, last active
- All orgs they belong to (if multi-org), with their role in each
- Action buttons appropriate to viewer's permissions: change role, remove, message

The activity stats are the underrated part. When you're deciding whether to promote someone to Moderator, "they've resolved 45 tickets with a 4-hour average response time" is the kind of context that makes the decision easy. Without it, role decisions are vibes-based.

## Per-role page summaries

**Super Admin** — the page is essentially an org management console. Expanded org sections, ability to switch context easily, bulk operations across orgs. They'll spend the most time here. Add an "Orgs" view as a sub-tab where they can see org-level stats (member count, ticket volume, health) without drilling into individual people.

**Admin** — read-only. Your spec says they can see all orgs but not manipulate. This role's Teams page is informational, basically a directory. Make sure the UI clearly signals "view only" — no menus on rows, no add button, maybe a small banner explaining they can request changes from a Super Admin. Otherwise they'll click around looking for actions that don't exist.

**Moderator** — single org, focused on User management within it. The "Add User" button should be prominent (this is their main activation moment when onboarding new team members). Role change actions limited to User ↔ Moderator. They can't see or manage Admins/Super Admins, which raises a question: do Admins and Super Admins appear in a Moderator's member list at all, or are they hidden? My recommendation: show them with their role pill but no actions. Hiding them creates a confusing "where's my Admin?" problem.

**User** — read-only directory of their org. This is essentially a "who's on my team" page. Worth keeping but minimal. No table density needed — a card grid with avatar, name, role works better and feels more human. Maybe useful for users to see "who do I message about issues" — which connects nicely to the Messages page if you ever let users start chats with specific Moderators.

## Invitations — the missing first-class object

If you go with invite-by-email, **pending invitations** are their own thing and deserve UI surface. A "Pending invitations" section/tab on the Teams page showing:

- Email invited, role assigned, who invited them, when, expiry
- Actions: resend invite, cancel invite, copy invite link

Without this, "I invited Sarah a week ago and she never showed up" becomes a support ticket. The page should answer it.

Same for **invitation acceptance** — when an invited user accepts, where do they land? What does the inviter see? A notification ("Sarah accepted your invitation") closes the loop nicely and connects this page to the Notifications system you've already designed.

## Audit trail

Role changes and removals are exactly the actions you'll want a log of when something goes wrong six months from now ("who removed this user?"). You don't necessarily need to expose a full audit log in the UI on day one, but the data should be captured. A small "View change history" link in the member detail panel is a low-effort win that adds a lot of trust.

## What I'd cut

- **Don't build org creation/deletion on the Teams page.** That's an Org settings concern, separate concept. Teams is about people within orgs.
- **Don't build permissions customization** ("custom roles," "this Moderator can also do X"). Your role model is fixed and that's a feature. Custom permissions are a tar pit — once you ship them you can never simplify.
- **Don't build a separate "invite a user" page.** Modal from the Teams page is right. Full pages for one-field forms is over-engineering.

## The shortest summary

Org-grouped sections with collapsible member tables, role-gated action menus (no greyed-out items), confirmation modals that explain consequences, last-active as a first-class column, pending invitations as their own surface, and a member detail drawer with activity stats. The role differences are real enough that you should design four variants intentionally rather than one variant with hidden buttons.

---

# Final Specification

## 1. Route & Layout

- Route: `/teams`
- URL state: `/teams?orgId=&role=&q=`

Layout varies by role:

**Super Admin / Admin** — org-grouped layout:

1. **Page header**: title `Teams`, `+ Invite Member` button top-right (Super Admin only).
2. **Controls row**: search input (searches name and email across all orgs) + role filter chip (`All · Super Admin · Admin · Moderator · User`) + `Expand all / Collapse all` toggle.
3. **Org sections**: collapsible sections, one per org, sorted by org name. Each section header: org name, member count summary pill (`12 members · 1 SA · 2 A · 3 M · 6 U`). Clicking header toggles expanded/collapsed. Default: all collapsed.
4. Inside each org section: **member table**.

**Moderator** — single-org layout:

1. **Page header**: org name as title, `+ Add User` button top-right.
2. **Controls row**: search input (within org) + role filter chip.
3. **Member table** directly (no collapsible wrapper).

**User** — single-org directory:

1. **Page header**: org name as title. No action buttons.
2. **Search input** (within org). No role filter.
3. **Card grid** (not table). See § Role Variations.

## 2. Member Table

Columns left-to-right: `Avatar · Name · Email · Role pill · Joined · Last active · Actions`

- **Avatar**: 32px circle. Initials fallback if no `avatarUrl`.
- **Name**: full name, bold.
- **Email**: muted, smaller weight.
- **Role pill**: colored badge, consistent app-wide:

| Role | Color |
|------|-------|
| SUPER_ADMIN | `#8B5CF6` (purple) |
| ADMIN | `#3B82F6` (blue) |
| MODERATOR | `#10B981` (green) |
| USER | `#6B7280` (gray) |

- **Joined**: relative time ("3 months ago"), tooltip = absolute date.
- **Last active**: relative time. Amber if > 30 days inactive and not resolved. This column surfaces who's actually using the system — high signal for promotion/removal decisions.
- **Actions**: three-dot menu, visible on row hover. Contains **only** the actions the viewer can perform on that target user. If no actions available, no menu, no disabled items — column is empty. Never show greyed-out actions.

Row hover reveals selection checkbox at far left.

All columns sortable by header click.

## 3. Actions Menu (Role-Gated)

Actions in the three-dot menu per row:

| Viewer | Target | Available actions |
|--------|--------|------------------|
| Super Admin | Any | `Change role… · Move to org… · Remove from org` |
| Super Admin | Super Admin peer | `Demote to Admin · Remove from org` (with stronger confirmation) |
| Moderator | User | `Promote to Moderator · Remove from org` |
| Moderator | Moderator | *(no menu)* |
| Moderator | Admin / Super Admin | *(no menu)* |
| Admin | Anyone | *(no menu — read-only)* |
| User | Anyone | *(no menu — read-only)* |

**Role change actions are single-step.** Super Admin can promote a User directly to Admin in one click — no ladder dance. The system knows what's permitted; the menu exposes only valid transitions.

## 4. Confirmation Modals

All role changes and removals require a confirmation modal.

**Role change modal** — must name:
- Who is affected (name + current role)
- What they're changing to
- What new powers/restrictions this grants or removes
- Which org the change applies to

Example: *"Promote Sarah Chen from User to Moderator in Acme Corp? She'll be able to add and remove Users and view all tickets in this org."*

**Removal modal** — must name:
- Who is being removed and from which org
- What happens to their open tickets: *"Sarah's 12 open tickets will remain assigned to her but she won't be able to access them. Reassign before removing?"*
- Requires typing the user's name or `REMOVE` to confirm (not just a single button click)
- Clarify: removal is from org only, not deletion of account

**Super Admin demotion modal** (demoting another Super Admin) — heavier confirmation:
- Requires typing `DEMOTE` to confirm
- Optionally prompt for a reason (stored in audit log)

## 5. Invite Flow

Opens as a modal from `+ Invite Member` / `+ Add User`. Not a separate page.

**Modal fields:**
- **Email** (autofocus, required)
- **Role** (dropdown — scoped to what the inviter can assign: Super Admin sees all roles; Moderator sees only User)
- **Org** (dropdown — Super Admin only; pre-filled for Moderator)
- **Message** (optional, short personal note included in the invite email)

`Cmd/Ctrl+Enter` submits. Submitting sends an invite email and creates a pending invitation record.

Draft autosave to `localStorage` — restored on reopen, cleared on submit.

## 6. Pending Invitations

Displayed as a distinct collapsible section above the org member sections (or above the table for Moderator). Label: `Pending Invitations (N)`.

Each invitation row:

- **Email** invited
- **Role** assigned
- **Invited by** (name)
- **Sent** (relative time)
- **Expires** (absolute date) — invitations expire after 7 days
- **Actions**: `Resend · Copy link · Cancel`

`Cancel` requires a single-click confirmation inline (no modal needed — low stakes).

When an invitee accepts, the inviter receives a notification ("Sarah Chen accepted your invitation to Acme Corp") and the row transitions from Pending Invitations to the member table.

Expired invitations: row shows `Expired` pill, actions collapse to `Resend · Remove`.

## 7. Bulk Operations

Select rows via hover checkboxes. Header checkbox selects all visible in the current org section (or the whole table for single-org views). A "select all matching filter" link appears after page-select when more exist.

**Contextual bar** at bottom when ≥1 selected:

- `Change role… · Remove · ⋯`
- Actions are intersection of what the viewer can do across all selected rows — if any selected user is outside the viewer's permission scope, the relevant action is removed from the bar entirely.

Confirmation required for bulk remove (list of names + same ticket-handling question).

## 8. Member Detail Drawer

Trigger: row click. Width: 480px desktop, full-width mobile.

Contents:

- **Header**: avatar, name, email, role pill. Action buttons (change role, remove) appropriate to viewer's permissions. `Close drawer`.
- **Activity stats**: tickets created · tickets assigned · avg resolution time · last active. These make promotion/removal decisions data-driven, not vibes-based.
- **Org memberships**: all orgs the user belongs to with their role in each (relevant if cross-org membership is supported).
- **Pending invitation** status (if user was invited and hasn't accepted yet).
- **View change history** link — opens an audit log modal showing role changes and removals with actor, timestamp, and reason (if provided).

## 9. Orgs Sub-Tab (Super Admin only)

A secondary tab in the page header: `Members · Orgs`.

**Orgs tab** — mini leaderboard of all orgs:

Columns: `Org name · Members · Admins · Open tickets · Stale tickets · Last activity`

Row click → expands to that org's member section on the Members tab (switches tab and scrolls).

This lets Super Admins triage org health without drilling into individual people first.

## 10. Role Variations

### Super Admin

- Org-grouped layout with `Members` and `Orgs` tabs.
- `+ Invite Member` button. Can assign any role.
- Full action menu on all rows. Can promote/demote across the full ladder including Super Admin ↔ Admin.
- `Move to org…` action in three-dot menu for cross-org reassignment.
- Bulk operations across orgs.
- All org sections default collapsed; expand individually or via `Expand all`.

### Admin

- Org-grouped layout, read-only. No `+ Invite` button.
- No action menus on rows.
- Small informational banner below controls: *"Contact a Super Admin to make changes to team membership."*
- Search and filter still work — the page functions as a directory.
- Org sections collapsed by default.

### Moderator

- Single-org, flat table. `+ Add User` button (invites at User role only).
- Action menu visible on User rows: `Promote to Moderator · Remove from org`.
- Admins and Super Admins appear in the table with their role pill but no action menu — showing them prevents "where's my Admin?" confusion.
- Pending invitations section visible (their own invitations only).
- Bulk remove and bulk promote available for selected User rows.

### User

- Single-org, **card grid** (not table). Cards: avatar, name, role pill. No email shown (privacy).
- No action buttons anywhere. No invite button. Pure directory.
- Search input filters cards in place.
- Card click: no drawer — users don't need detailed stats on peers. If messaging is available, a `Message` link on the card pointing to the relevant ticket thread.

## 11. Empty & Edge States

| State | Treatment |
|-------|-----------|
| No members in org (new org) | Illustration + "Invite your first team member" CTA (Super Admin / Moderator) or "No members yet" (others) |
| Search / filter yields zero | "No members match" + `Clear filters` link |
| Pending invitations section empty | Section hidden entirely |
| Org section with zero members after filter | Section header still shown, collapsed, with `0 members` count |
| Load error | Inline retry per org section — one failed section doesn't block others |
| Member detail load error | Inline retry inside the drawer |

## 12. Audit Trail

Every role change, removal, and invitation action is logged server-side: actor, target user, action, org, timestamp, optional reason.

Surfaced in the UI via:
- `View change history` link in member detail drawer → modal with chronological log for that user.
- Reason field captured only for Super Admin demotions; optional for other changes.

Audit data is not exposed to Admins, Moderators, or Users.

## 13. Real-time

- No live polling needed. Team membership changes infrequently; 5-minute stale threshold on tab focus (same pattern as dashboard) is sufficient.
- Invitation acceptance fires a notification to the inviter via the notifications system.
- No WebSocket requirement for this page.

## 14. Out of Scope (v1)

- Org creation / deletion (separate Org settings concern)
- Custom roles or permission customization
- SSO / SCIM provisioning
- Separate "invite" page (modal is right)
- Per-user notification preferences on this page (lives in `/settings/notifications`)
- Audit log as a standalone page (drawer link is enough for v1)

---

## 15. Data Shapes

```ts
type ID = string; // nanoid
type Role = 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR' | 'USER';

interface OrgRef { id: ID; name: string; }

interface MemberRow {
  id: ID;
  name: string;
  email: string;
  avatarUrl?: string;
  role: Role;
  orgId: ID;
  joinedAt: string;       // ISO
  lastActiveAt?: string;  // ISO — null if never active
  isInactive: boolean;    // server-computed: lastActiveAt > 30d
  permissions: {          // server-computed per viewer
    canChangeRole: boolean;
    canRemove: boolean;
    canMoveTo: boolean;   // cross-org; Super Admin only
  };
}

interface MemberDetail extends MemberRow {
  orgMemberships: { org: OrgRef; role: Role; joinedAt: string }[];
  stats: {
    ticketsCreated: number;
    ticketsAssigned: number;
    avgResolutionMs?: number;  // null if no resolved tickets
  };
}

interface OrgSection {
  org: OrgRef;
  memberCount: number;
  roleCounts: Record<Role, number>;
  members: MemberRow[];          // populated when expanded
}

interface OrgOverviewRow {       // for Super Admin Orgs tab
  org: OrgRef;
  memberCount: number;
  adminCount: number;
  openTickets: number;
  staleTickets: number;
  lastActivityAt?: string;       // ISO
}

type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled';

interface Invitation {
  id: ID;
  email: string;
  role: Role;
  orgId: ID;
  orgName: string;
  invitedBy: { id: ID; name: string };
  sentAt: string;        // ISO
  expiresAt: string;     // ISO — 7 days after sentAt
  status: InvitationStatus;
  inviteUrl: string;     // for "Copy link"
}

interface AuditEntry {
  id: ID;
  at: string;            // ISO
  actor: { id: ID; name: string };
  action: 'role_changed' | 'removed' | 'invited' | 'invitation_cancelled';
  targetUser: { id: ID; name: string };
  org: OrgRef;
  fromRole?: Role;
  toRole?: Role;
  reason?: string;       // Super Admin demotions only
}

interface TeamFilters {
  orgId?: ID;
  role?: Role[];
  q?: string;            // searches name + email
}

interface InvitePayload {
  email: string;
  role: Role;
  orgId: ID;
  message?: string;
}

interface RoleChangePayload {
  role: Role;
  reason?: string;
}

interface BulkMemberOp {
  ids: ID[];
  op: 'change_role' | 'remove';
  payload?: RoleChangePayload;
}
```

## 16. API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/teams/members` | Member list — query params encode `TeamFilters`, `page`, `pageSize` |
| `GET` | `/api/teams/members/:userId` | `MemberDetail` |
| `PATCH` | `/api/teams/members/:userId/role` | Change role — body `RoleChangePayload`; server enforces permission ladder |
| `DELETE` | `/api/teams/members/:userId` | Remove from org — query `orgId` for Super Admin cross-org |
| `POST` | `/api/teams/members/bulk` | Bulk ops — body `BulkMemberOp` |
| `GET` | `/api/teams/members/:userId/history` | Audit log for that user |
| `POST` | `/api/teams/members/:userId/move` | Move to different org — `{ toOrgId: ID }`; Super Admin only |
| `GET` | `/api/teams/invitations` | Pending + recent invitations scoped to viewer's orgs |
| `POST` | `/api/teams/invitations` | Send invite — body `InvitePayload` |
| `POST` | `/api/teams/invitations/:id/resend` | Resend invite email |
| `DELETE` | `/api/teams/invitations/:id` | Cancel invitation |
| `GET` | `/api/teams/orgs` | Org overview rows — Super Admin only |

## 17. Frontend State

- **URL = source of truth** for `orgId`, `role[]`, `q`, active tab (Members/Orgs).
- React Query keyed by `[filters]` — free dedupe + background refetch.
- Local-only state: expanded org sections set (stored in `sessionStorage` so expand state survives tab focus but resets on navigation), selected row set, drawer open state, invite modal draft (`localStorage`).
- Optimistic updates for: role change, remove. Rollback on error with toast.
- Org sections fetch members lazily on first expand — not all at once on page load.

## 18. Permissions Matrix (frontend gates; server is authoritative)

| Action | SUPER_ADMIN | ADMIN | MODERATOR | USER |
|--------|:-----------:|:-----:|:---------:|:----:|
| View all orgs (grouped) | ✓ | ✓ (read-only) | — | — |
| View own org members | ✓ | ✓ | ✓ | ✓ |
| Invite member | ✓ | — | ✓ (User only) | — |
| Change role (any) | ✓ | — | — | — |
| Promote User ↔ Moderator | ✓ | — | ✓ | — |
| Promote Admin → Super Admin | ✓ | — | — | — |
| Remove from org | ✓ | — | ✓ (User only) | — |
| Move member across orgs | ✓ | — | — | — |
| View pending invitations | ✓ | — | ✓ (own) | — |
| Cancel / resend invitation | ✓ | — | ✓ (own) | — |
| View Orgs tab | ✓ | — | — | — |
| View audit history | ✓ | — | — | — |
