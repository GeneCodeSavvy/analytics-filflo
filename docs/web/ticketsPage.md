# Ideation Phase Comments
- Super Admins can view all the tickets, by all the orgs. They can assign tickets to Admins. They can create new tickets. They can close tickets.
- Admins can only view the tickets assigned to them. They can ask for review from the Admin.
- Moderators can view the all tickets of the org.
- User can only view the tickets they created / assigned later from the org
- New Tickets can be created, by everyone. The NewTicket component has Subject, Description with Template, Category (optional dropdown), Priority (optional dropdown), and invite user button with a searchable dropdown of users from the same org.
- Tickets are listed in a table view with serial number, name of User/Moderator who created them, Subject, Category, Status, Priority, Created time.
- Clicking on a ticket opens the same NewTicket component with editable fields (only after clicking the edit button). Moderators, and Super Admins can add assignes as other Users and Admins repectively.


# After Brain Strom Comments
The Tickets page is the workhorse of the app — people will spend more time here than anywhere else, so small frictions compound fast. Your spec is solid on permissions but light on the actual interaction model. Here's where I'd push.

## The biggest missing piece: views

A flat table of "all tickets" gets useless past ~50 rows. Every mature ticketing tool (Linear, Jira, Zendesk, Height, GitHub Issues) solves this the same way — **saved views as first-class objects**. Not just filters you reapply, but named, persistent perspectives on the table.

Default views I'd ship per role:

- **Super Admin:** *All open*, *Awaiting review* (status=REVIEW — these need their attention), *High priority open*, *Unassigned to admin*, *Resolved this week*
- **Admin:** *My open tickets*, *My high priority*, *Awaiting my review response*, *Resolved by me*
- **Moderator:** *My org — open*, *My org — high priority*, *Created by me*, *Stale* (no activity 7d+)
- **User:** *My tickets*, *Awaiting my input*, *Resolved*

Let users save their own on top of these. The view selector lives as horizontal tabs above the table — clicking switches the table contents and the URL (so views are shareable/bookmarkable). This single decision makes the page feel 10x more usable than a global filter bar.

## The table itself

Your column list is fine but I'd reorder by scan priority. Eyes go left-to-right and the leftmost column should be the one people look for. Suggested order:

`Priority indicator · ID · Subject · Status · Category · Assignees · Created · Updated`

A few specifics:

**Priority as a colored dot/bar on the far left**, not a text column. HIGH = red, MEDIUM = amber, LOW = gray. This lets you scan a list of 50 tickets and instantly see where to look. The text label can appear on hover or be redundantly shown later in the row.

**ID with a # prefix** (`#ab12cd3f`) and monospace font. nanoid IDs are ugly in a sans-serif. Make them clickable and copyable on hover.

**Subject is the hero column** — give it the most width and truncate with ellipsis. Show the description's first line as muted secondary text on a second row inside the same cell (the Linear / Height pattern). This turns each row into a mini-preview and dramatically reduces "click to find out what it is" overhead.

**Status as a colored pill**, same colors as the dashboard donut. Consistency across pages.

**Assignees as overlapping avatars** with a `+3` chip if it overflows. Hover to see the full list. Showing "all super admins + moderators" as individual avatars would be noisy — consider showing the *primary* assignee (the Admin assigned, or the User who created) and rolling the implicit assignees into the +N.

**Two timestamps, not one.** Created is what you specified, but *Updated* (last activity) is what people actually sort by day-to-day. Show both, default sort by Updated desc.

**Drop the serial number column.** It's noise — the ID is the identifier, and row position changes with sort/filter so a serial number is actively misleading.

## Sorting, filtering, density

Every column header should be sortable. Multi-sort (shift-click) is a nice power-user touch but optional.

A filter bar above the table with chips for Status, Priority, Category, Assignee, Created date range. These compose with the active view — view defines the base, chips refine it. Show an active filter count and a "clear all" affordance.

A **density toggle** (compact / comfortable) tucked in the corner. Power users will want compact; users will want comfortable. Persist the choice.

A **search box** that searches subject, description, and ID. Slash-key shortcut to focus it.

## The detail experience

Your spec says clicking a ticket "opens the same NewTicket component with editable fields." I'd reconsider this. Two issues:

1. **Navigation away from the list is expensive.** People often want to triage — peek at one, go back, peek at the next. Full-page navigation makes this slow.
2. **The detail view needs more than NewTicket has.** Activity log, message thread, status change history, assignee change history. Cramming all that into the create form is awkward.

The pattern that works best is a **right-side drawer/panel** that slides in over the table when you click a row. The table stays visible (or partially visible) on the left. Inside the drawer:

- Top: subject (editable inline), ID, status pill (clickable to change), priority, created/updated meta
- Tabs or sections: *Details* (description, category, assignees), *Activity* (timeline of changes), *Messages* (link to the thread)
- Edit is inline-by-field, not a modal "edit mode" — clicking the description makes it editable in place. Less ceremony than a global edit button.

If someone wants the full-page experience, the drawer should have a "open full page" button (Linear does this well — same URL works for both).

This also solves your "edit button" awkwardness. Permissions gate which fields are editable; non-editable fields just don't respond to clicks for that role. No global edit toggle needed.

## Bulk actions

Once selection is in the table (checkboxes on row hover, or a checkbox column), a contextual bar appears at the bottom or top: *Assign · Change status · Change priority · Close*. Super Admins especially will want this — triaging 20 tickets one-at-a-time is brutal.

Permission-gate the actions: a Moderator selecting 5 tickets sees only the actions they're allowed to take.

## Create flow

"New Ticket" as a primary button top-right of the page. I'd open it as a **modal**, not a navigation, for the same reason as detail — preserves context. Keyboard shortcut `c` (industry standard from GitHub/Linear).

A small thing that pays off hugely: **make Subject the autofocused field**, and let `Cmd/Ctrl+Enter` submit from anywhere in the form. Power users create lots of tickets; every saved click matters.

Consider a **draft autosave** — if someone closes the modal mid-write, restore the draft when they reopen. Cheap to implement, high delight.

## Empty and edge states

Don't skip these — they're where products feel polished or unfinished:

- **No tickets at all** (new user): big illustration, "Create your first ticket" CTA, maybe a one-liner about what tickets are for in your product
- **No tickets matching filter:** "No tickets match these filters" with a "clear filters" link, not the same illustration as the true empty state
- **No tickets in this view:** view-specific message ("No tickets are awaiting your review — nice work")

These three are different situations and conflating them is a common mistake.

## Real-time considerations

Tickets is inherently collaborative — someone else might assign you a ticket while you're looking at the list. Two patterns to consider:

- **Soft refresh indicator:** "3 new tickets · click to refresh" appears at the top rather than yanking the table from under the user
- **Live status changes:** if a ticket's status updates while it's visible, the pill animates briefly. Subtle, but it makes the app feel alive

You don't need full WebSocket infra on day one — polling every 30s when the tab is visible covers 90% of the value.

## Role-specific polish

A few role-specific notes beyond what's in your spec:

- **User view** — they probably shouldn't see the full table at all. A card-based layout ("My tickets") with bigger touch targets and less density is friendlier. Users typically have <10 tickets; the table is overkill.
- **Super Admin view** — add an Org column and let it be groupable. "Group by Org" turns the flat table into collapsible sections, which is how Super Admins actually want to think about cross-org load.
- **Admin view** — surface the *requester* prominently. When you're handling assigned tickets, "who needs this" matters more than "what category is it."

## What I'd cut from typical ticketing UIs

- **Don't build a Kanban view yet.** It's the obvious "let's add another view type" feature but it only works well when status transitions are the primary mental model. For your IN PROGRESS / ON HOLD / REVIEW / RESOLVED flow it's fine, but ship the table well first — Kanban is a 3x build for maybe 1.3x value.
- **Don't build complex SLA tracking.** Your model doesn't have SLAs. A simple "age of ticket" with a warning color past N days covers 80% of the value.
- **Don't build saved searches separate from views.** They're the same concept; one abstraction is cleaner.

The shortest summary: **views + drawer detail + bulk actions** are the three things that separate a usable tickets page from a tedious one. Your spec has the data model right; these are the interaction primitives that make it pleasant to live in.

# Final Specification

## 1. Route & Layout

- Route: `/tickets`
- View state in URL: `/tickets?view=<viewId>&status=&priority=&category=&assignee=&q=&sort=updatedAt:desc&page=1`
- Opening a ticket: `/tickets/:ticketId` — renders the same list page with the **right-side drawer** open over it. Direct-link to a ticket loads list in background.
- Full-page fallback: `/tickets/:ticketId/full` — for users who want the non-drawer experience (linked from the drawer's "open full page" button).

Layout (top to bottom):

1. Page header: title `Tickets`, primary `+ New Ticket` button (top-right, keyboard `c`).
2. **View tabs row** (horizontal, scrollable on overflow). Built-in views per role + user-saved views + a `+` to save current filters as a view.
3. **Filter bar**: chips for Status, Priority, Category, Assignee, Created range. Search input (slash-key focuses). Active filter count + `Clear all`. Density toggle (compact/comfortable) on the right.
4. **Table** (or card grid for User role).
5. Bulk action bar: appears at bottom when rows selected.

## 2. Views (first-class objects)

Views are the dominant navigation primitive. Each view = `{ filters, sort, columns, groupBy }`.

Built-in views (cannot edit/delete, can clone):

| Role | Built-in views |
|------|----------------|
| Super Admin | All open · Awaiting review · High priority open · Unassigned to admin · Resolved this week · (group-by Org available) |
| Admin | My open tickets · My high priority · Awaiting my review response · Resolved by me |
| Moderator | My org — open · My org — high priority · Created by me · Stale (no activity 7d+) |
| User | (no view tabs — card layout instead) |

User-saved views: name + filters + sort persisted server-side, scoped to user.

## 3. Table

Columns left-to-right: `Priority dot · ID · Subject (+description preview) · Status pill · Category · Assignees · Created · Updated`.

- **Priority indicator**: 4px colored bar at row left edge — HIGH `#EF4444`, MEDIUM `#F59E0B`, LOW `#9CA3AF`. No text column for priority.
- **ID**: `#<nanoid8>` monospace, copy-on-hover.
- **Subject**: hero column, ~40% width. Two-line cell: subject + muted first line of description (truncated).
- **Status pill**: matches dashboard donut palette. Click pill in drawer to change.
- **Assignees**: overlapping avatar stack, primary first, `+N` chip if >3.
- **Created/Updated**: relative time ("2h ago"), tooltip = absolute. Default sort: `updatedAt desc`.
- **Drop**: serial number column.
- All headers sortable; shift-click for multi-sort.
- Row hover reveals selection checkbox at left.
- Stale indicator: subtle amber dot next to `Updated` if `now - updatedAt > 7d` and status not in `RESOLVED/CLOSED`.

Density: compact = 32px row, comfortable = 56px row (description preview only shown in comfortable). Persisted per user.

## 4. Detail drawer

Trigger: row click. Width: 560px desktop, full-width mobile. List remains visible behind it.

Contents:

- **Header**: subject (inline-editable), `#id` (copy), status pill (click → menu), priority chip (click → menu), `Open full page`, `Close drawer`.
- **Meta row**: created by · created at · updated at · category.
- **Tabs**: `Details` · `Activity` · `Messages`.
  - *Details*: description (inline-editable, template-aware), category (inline), assignees (chip + add user search).
  - *Activity*: timeline of status changes, assignee changes, priority changes, edits.
  - *Messages*: link out to the existing thread view (or embed if cheap).
- **Inline-by-field edits**, no global edit toggle. Permission gating disables click for fields the role cannot edit.
- Keyboard: `j/k` to move to prev/next ticket within the current list without closing the drawer.

## 5. Bulk actions

- Hover/select checkboxes; "select all on page" in header; "select all matching filter" link appears when page-select used.
- Bottom action bar shows: `Assign… · Status… · Priority… · Close · ⋯` — actions filtered by role permission for the *intersection* of selected tickets.
- Confirmation required for `Close` and any cross-org action.

## 6. Create flow

- Modal (not navigation). Opens on `c` or `+ New Ticket`.
- Fields: Subject (autofocus), Description (with template), Category (optional), Priority (optional, default MEDIUM), Invite users (searchable, scoped to same org).
- `Cmd/Ctrl+Enter` submits from anywhere.
- Draft autosave to `localStorage` keyed by user; restore on reopen; cleared on submit.

## 7. Empty / edge states

| State | Treatment |
|-------|-----------|
| No tickets at all (org/user-scoped) | Illustration + "Create your first ticket" CTA + one-liner |
| Filters yield zero | "No tickets match these filters" + `Clear filters` link |
| View yields zero | View-specific copy, e.g. "No tickets are awaiting your review — nice work" |
| Load error | Inline retry, preserve filters/view |

## 8. Real-time

- Poll list every 30s while tab visible (`document.visibilityState === 'visible'`).
- New tickets appear as **"N new tickets · refresh"** banner at top of table — never yank rows.
- If a visible ticket's status/assignee changes server-side, animate the pill/avatar in place.
- WebSockets out of scope for v1.

## 9. Role specifics

- **User**: card layout, no view tabs, no table density toggle. Cards show subject, status pill, priority, updated. Tap → drawer same as table.
- **Super Admin**: extra `Org` column; `Group by Org` toggle (collapsible sections per org with counts).
- **Admin**: surface `Requester` column prominently (replaces Category by default in their views).
- **Moderator**: same table as Admin minus assign-to-admin actions.

## 10. Out of scope (v1)

- Kanban view
- SLA tracking (just stale-age coloring)
- Saved searches as a separate concept (use views)

---

## 11. Data shapes

TypeScript types for the page. Backend is authoritative; this is the frontend contract.

```ts
type ID = string; // nanoid

type Role = 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR' | 'USER';
type Status = 'OPEN' | 'IN_PROGRESS' | 'ON_HOLD' | 'REVIEW' | 'RESOLVED' | 'CLOSED';
type Priority = 'HIGH' | 'MEDIUM' | 'LOW';

interface OrgRef   { id: ID; name: string; }
interface UserRef  { id: ID; name: string; avatarUrl?: string; role: Role; orgId: ID; }

interface TicketRow {                 // row payload — list endpoint
  id: ID;                             // nanoid
  subject: string;
  descriptionPreview: string;         // first ~120 chars, server-trimmed
  status: Status;
  priority: Priority;
  category?: string;
  org: OrgRef;                        // needed for Super Admin grouping
  requester: UserRef;                 // creator
  primaryAssignee?: UserRef;          // for the avatar column
  assigneeCount: number;              // for the +N chip
  assigneesPreview: UserRef[];        // up to 3
  createdAt: string;                  // ISO
  updatedAt: string;                  // ISO
  isStale: boolean;                   // server-computed: !resolved && updatedAt > 7d
  unread?: boolean;                   // optional: new activity since last viewed
}

interface TicketDetail extends TicketRow {
  description: string;                // full
  assignees: UserRef[];               // full list
  activity: ActivityEntry[];
  messageThreadId?: ID;
  permissions: {                      // server-computed per viewer
    canEditSubject: boolean;
    canEditDescription: boolean;
    canChangeStatus: boolean;
    canChangePriority: boolean;
    canChangeCategory: boolean;
    canAssign: boolean;
    canClose: boolean;
    canDelete: boolean;
  };
}

type ActivityEntry =
  | { id: ID; at: string; actor: UserRef; kind: 'created' }
  | { id: ID; at: string; actor: UserRef; kind: 'status'; from: Status; to: Status }
  | { id: ID; at: string; actor: UserRef; kind: 'priority'; from: Priority; to: Priority }
  | { id: ID; at: string; actor: UserRef; kind: 'assignee_added' | 'assignee_removed'; user: UserRef }
  | { id: ID; at: string; actor: UserRef; kind: 'edited'; field: 'subject' | 'description' | 'category' };

interface TicketFilters {
  status?: Status[];
  priority?: Priority[];
  category?: string[];
  assigneeIds?: ID[];
  requesterIds?: ID[];
  orgIds?: ID[];                      // Super Admin only
  createdFrom?: string;               // ISO
  createdTo?: string;                 // ISO
  q?: string;                         // searches subject, description, id
  stale?: boolean;
}

interface TicketSort {
  field: 'updatedAt' | 'createdAt' | 'priority' | 'status' | 'subject';
  dir: 'asc' | 'desc';
}

interface View {
  id: ID;
  name: string;
  scope: 'builtin' | 'user';
  ownerId?: ID;                       // for user-scoped
  role?: Role;                        // for builtin
  filters: TicketFilters;
  sort: TicketSort[];                 // multi-sort capable
  groupBy?: 'org' | 'status' | 'priority' | 'assignee';
  columns?: ColumnId[];               // null = role default
}

type ColumnId =
  | 'priority' | 'id' | 'subject' | 'status' | 'category'
  | 'assignees' | 'requester' | 'org' | 'createdAt' | 'updatedAt';

interface ListResponse {
  rows: TicketRow[];
  total: number;
  page: number;
  pageSize: number;
  serverTime: string;                 // for "N new since" banner
}

interface NewTicketDraft {
  subject: string;
  description: string;
  category?: string;
  priority?: Priority;
  inviteeIds: ID[];
}
```

## 12. API endpoints (frontend expectations)

| Method | Path | Purpose |
|--------|------|---------|
| `GET`  | `/api/tickets` | list — query params encode `TicketFilters`, `TicketSort[]`, `page`, `pageSize`, `groupBy` |
| `GET`  | `/api/tickets/:id` | `TicketDetail` |
| `POST` | `/api/tickets` | create — body `NewTicketDraft` |
| `PATCH`| `/api/tickets/:id` | partial update — server enforces field-level permissions |
| `POST` | `/api/tickets/bulk` | `{ ids: ID[], op: 'assign'|'status'|'priority'|'close', payload }` |
| `GET`  | `/api/tickets/views` | built-in (by role) + user-saved |
| `POST` | `/api/tickets/views` | save view |
| `PATCH`/`DELETE` | `/api/tickets/views/:id` | rename/delete user view |
| `GET`  | `/api/users/search?q=&orgId=` | assignee/invitee search |
| `GET`  | `/api/tickets/since?ts=` | poll — returns count of new/updated since `ts` for the active filter |

## 13. Frontend state

- **URL = source of truth** for view, filters, sort, page, selected ticket.
- React Query (or equivalent) keyed by the URL query — gives free dedupe + background refetch.
- Local-only state: row selection set, drawer scroll position, density preference (localStorage), draft (localStorage).
- Optimistic updates for: status change, priority change, assignee add/remove, bulk ops. Rollback on error with toast.

## 14. Permissions matrix (frontend gates; server is authoritative)

| Action | SUPER_ADMIN | ADMIN | MODERATOR | USER |
|--------|:-:|:-:|:-:|:-:|
| View all tickets | ✓ | own assigned | own org | own created/assigned |
| Create ticket | ✓ | ✓ | ✓ | ✓ |
| Assign to Admin | ✓ | — | — | — |
| Assign to User | ✓ | — | ✓ | — |
| Request review | — | ✓ | — | — |
| Change status | ✓ | ✓ | ✓ | — |
| Close ticket | ✓ | — | — | — |
| Bulk actions | ✓ | limited | limited | — |
| Group by Org | ✓ | — | — | — |

Frontend uses `TicketDetail.permissions` for per-ticket gating; uses role for page-level gating.
