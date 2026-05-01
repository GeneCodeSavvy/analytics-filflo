## Ideation Phase Comments

- Kindof a todo list like GitHub. Only Clicking Buttons will set the status as Read.
- SuperAdmin, assignes a Ticket to Admin? Admin gets a notification.
- Admin asks for a review for the ticket? SuperAdmin gets a notification.
- User / Moderator opens a ticket? Rest of Moderators and All Super Admin get a notification.
- SuperAdmin resolves/closes a ticket? All parties involved get a notification (All SuperAdmins, respective Admin, All Moderators, respective Users).
- User invited another user to a issue? Notification for that user. A TicketInvitation component for accepting or reject request.
- Any message activity? all parties involved get a notification.

# After Brain Strom Comments
Notifications is the page most teams under-invest in and then quietly regret. It's the difference between "I check the app when I remember" and "the app tells me what needs me." Your spec has the trigger logic right but is missing the interaction model that makes a notifications page actually work. Here's where I'd push.

## The core mental model

You compared it to GitHub, which is the right reference — GitHub's notifications inbox is genuinely best-in-class and worth studying directly. The key insight there: **notifications are a triage queue, not a log**. Every notification is a question: *do I need to act on this, and if not, can I get it out of my face?*

This reframes a lot of design decisions. The page isn't "show me what happened" (that's the activity feed on the dashboard). It's "show me what needs me, in the order it needs me, and let me clear it fast."

Your "only clicking buttons sets status to Read" rule is a good instinct — auto-marking as read on hover or scroll is the GitHub mistake that made them eventually add an "unread inbox" mode. Stick with explicit actions.

## Inbox structure: three states, not two

Read/Unread is too coarse. Borrow GitHub's three-state model:

- **Inbox (Unread):** new, demands attention
- **Read:** acknowledged but kept around for reference
- **Done/Archived:** explicitly cleared, out of the way

The user explicitly moves things between states. "Mark as read" and "Mark as done" are different actions with different meanings — read = "I saw it," done = "I handled it." Without the third state, people either let read items pile up forever or lose them entirely.

Tabs across the top: `Inbox · Read · Done · All`. Default to Inbox. Inbox is the only one with an unread count badge.

## Grouping is what makes this scale

A flat list of 200 notifications is unusable. Group by **subject**, not by time. All notifications about ticket `#ab12cd3f` collapse into one row that shows the latest event with a count badge ("4 updates"). Expanding shows the thread.

This solves several specific problems in your spec:

- *"Any message activity → all parties get a notification"* — without grouping, a 20-message conversation generates 20 notification rows per person. With grouping, it's one row that updates.
- *"User/Moderator opens a ticket → rest of moderators + super admins notified"* — these arrive in bursts; grouping keeps them tidy.
- Status changes, assignments, and message activity on the same ticket all collapse together, so the unit of attention is the ticket, not the event.

Secondary grouping by date (Today / Yesterday / This week / Older) inside the list. Time matters but it's a tiebreaker, not the primary axis.

## Notification types and their visual treatment

Your spec lists about seven trigger types. They are not equal in urgency, and the page should reflect that. I'd tier them:

**Action required** (you must do something):
- Ticket assigned to you (Admin)
- Review requested from you (Super Admin)
- Ticket invitation received (the TicketInvitation accept/reject case)

**Status update** (something you care about happened):
- Ticket you're involved with was resolved/closed
- New ticket opened in your org (for Moderators/Super Admins)

**FYI** (peripheral awareness):
- Message activity on threads you're part of

Visually distinguish these. An icon on the left of each row, color-coded: red dot for action-required, blue for status, gray for FYI. A small "Action required" pill on the high-priority ones. Some products go further and put action-required notifications in a separate top section that never gets pushed down by FYI noise — worth considering for Admins who'd otherwise drown in message activity.

## Inline actions are the unlock

The biggest delta between a good and bad notifications page is whether you can act without leaving it. For each notification type, the row should have buttons for the obvious next action:

- *"You've been assigned #ab12cd3f"* → buttons: `Open · Mark done`
- *"Admin Y requested review on #..."* → buttons: `Review · Snooze · Mark done`
- *"You've been invited to #..."* (your TicketInvitation case) → buttons: `Accept · Reject` inline, no separate component navigation
- *"#... was resolved"* → buttons: `Open · Mark done`
- *"3 new messages on #..."* → button: `Open thread`

Your spec says "TicketInvitation component for accepting or rejecting." I'd argue that should be the inline notification row itself, not a separate page. Accept/reject is a one-click decision; pushing it to its own component is friction. The notification row *is* the component.

A keyboard story matters here. `e` to mark done, `j/k` to move between rows, `Enter` to open — Gmail/Linear/GitHub all converge on this and power users learn it once and use it forever.

## Bulk operations

`Select all in inbox · Mark all as done` is essential. Without it, a user who's been on vacation will never recover. Also useful: `Mark all as read for ticket #...` — once you've decided you don't care about a ticket, kill all its notifications in one stroke.

Selection via checkboxes on hover, contextual bar appears at the top with `Mark read · Mark done · Snooze`.

## Snoozing — worth adding

Not in your spec but high-leverage: the ability to snooze a notification until later (1h / tomorrow / next week / custom). Especially valuable for Admins who get assigned something they can't tackle right now but don't want to lose. The notification disappears from Inbox and reappears at the snooze time, unread again.

Cheap to implement (just a `snoozed_until` timestamp), disproportionately loved by users.

## Filtering

A filter bar above the list. Not heavy — just chips for:

- **Type:** Assignment, Review, Resolution, Invitation, Message, Mention
- **Ticket:** dropdown of tickets with notifications
- **Org** (Super Admin only): which org's activity

These compose with the Inbox/Read/Done tab. A common pattern: "show me only assignments in Inbox" to triage what needs my action first.

## Per-role considerations

Your trigger logic is role-dependent, so the experience naturally varies, but a few specifics:

**Super Admin** will get the most volume — they're notified on every new ticket across every org. Without good filtering and grouping, this page becomes a firehose. Default their inbox to filtered to *Action required* with a chip showing "+47 status updates" they can expand. Otherwise the noise drowns out the signal of "Admin X is asking for your review."

**Admin** has the cleanest experience — assignments and review responses, mostly. This is the role where notifications actually function as a todo list, as your spec describes. Lean into that — make this role's empty state say "All caught up" prominently.

**Moderator** sits in an awkward middle ground. They get notified about every ticket in their org, which is potentially a lot. Consider letting them mute specific tickets ("I don't need updates on this one") — it's a release valve that makes the page sustainable.

**User** has the lightest load. Notifications are mainly: "your ticket got a response," "your ticket was resolved," "you were invited to a ticket." This role probably doesn't need filtering at all — just a simple list.

## The notification bell (out of page, but related)

The page itself is only half the story. The bell icon in the global nav is what drives people to the page. A few principles:

- **Unread count badge on the bell**, capped at `99+`
- **Click opens a popover preview** of the 5 most recent unread, with the same inline actions as the full page. Most notifications get handled here without ever visiting the page.
- **"See all" link** at the bottom of the popover goes to the full page
- **Action-required notifications** should visually stand out in the popover too — a red dot or pill — so they don't get scrolled past

The popover doing 80% of the work is fine and good. The full page is for triage sessions and history.

## Settings — don't skip

Notification fatigue is the failure mode that kills these systems. A settings panel (linked from the page header) lets users toggle each notification type on/off, choose delivery channels (in-app, email, both), and set quiet hours. Even if you only ship in-app on day one, scaffold the settings — adding email later without per-type toggles will be regretted.

A defensible default: action-required types are always on (you can't miss an assignment), FYI types default off for FYI roles. Specifically, I'd default Moderator's "new ticket in org" notifications to a digest mode rather than per-event, otherwise that role gets buried.

## What I'd cut

- **Don't build a real-time toast system** for every notification on day one. Toasts are a separate UX surface with their own design problems (where do they appear, how long do they stay, how do they stack). The bell badge updating live is enough.
- **Don't build an activity feed and a notifications page as separate things** that overlap. The dashboard's recent activity is *what happened*; notifications are *what needs you*. Keep the line clear — if it's in notifications, the user has a reason to act on it personally.
- **Don't notify on your own actions.** Sounds obvious but easy to get wrong — if a Super Admin resolves a ticket, your spec says "all parties involved get a notification." Exclude the actor from "all parties." Otherwise you teach users to ignore notifications because half of them are "you did the thing you just did."

## The shortest summary

Three-state inbox (Inbox/Read/Done), grouped by ticket, inline actions on every row, action-required tier visually separated, snooze support, and ruthless deduplication of noisy events. Get those right and the page goes from "thing users avoid" to "thing users open first thing in the morning."

---

# Final Specification

## 1. Route & Layout

- Route: `/notifications`
- URL state: `/notifications?tab=inbox&type=&orgId=&ticketId=`
- No per-notification deep-link needed — notifications open the relevant ticket drawer.

Layout (top to bottom):

1. **Page header**: title `Notifications`, `Settings` link (top-right, goes to `/settings/notifications`).
2. **Tab row**: `Inbox · Read · Done · All`. Inbox carries the unread count badge. All other tabs are unadorned.
3. **Filter bar** (hidden for User role): chips for Type, Ticket, Org (Super Admin only). Active filter count + `Clear all`.
4. **Notification list**: grouped by ticket, secondary-grouped by date band inside each tab.
5. **Bulk action bar**: appears at top of list when rows are selected.

## 2. Inbox States (three-state model)

| State | Meaning | How to enter | How to leave |
|-------|---------|-------------|-------------|
| **Inbox** | Unread, demands attention | Server delivers | User clicks `Mark read` or `Mark done` |
| **Read** | Acknowledged, kept for reference | User clicks `Mark read` | User clicks `Mark done` or `Move to inbox` |
| **Done** | Handled, out of the way | User clicks `Mark done` | User clicks `Move to inbox` |

- Explicit actions only — no auto-mark-as-read on scroll or hover.
- `Mark done` is heavier than `Mark read`. They are separate buttons; never conflate them.
- Moving a notification back to Inbox re-marks it unread.

## 3. Grouping

Primary grouping: **by ticket**. All events for `#ab12cd3f` collapse into one row.

- Row shows: ticket subject, latest event description, actor avatar, timestamp of latest event, event count badge (`4 updates`) if >1 event.
- Expanding the row reveals the individual event thread in chronological order (oldest first).
- Collapsed-row click = open the ticket drawer; expand chevron click = expand the thread in-place.

Secondary grouping: **date bands** within the list — `Today · Yesterday · This week · Older`. Applied after ticket grouping, based on the latest event's timestamp.

Within each band, sort by latest-event timestamp descending.

## 4. Notification Types & Visual Treatment

Three urgency tiers, visually distinct:

| Tier | Color | Icon | Types |
|------|-------|------|-------|
| **Action required** | Red dot `#EF4444` | Bell with exclamation | Ticket assigned to you · Review requested · Ticket invitation received |
| **Status update** | Blue dot `#3B82F6` | Bell | Ticket resolved/closed · New ticket in your org |
| **FYI** | Gray dot `#9CA3AF` | Bell outline | Message activity on threads you're involved in |

- Action-required rows: small `Action required` pill to the right of the ticket subject.
- Super Admin inbox: action-required notifications pinned to a top section (`Needs your attention`), separated by a divider from the rest. FYI items collapsed by default under `+N status updates / messages` expander.

## 5. Inline Actions

Every collapsed notification row has context-appropriate buttons revealed on hover (and always visible on mobile):

| Notification type | Inline buttons |
|-------------------|---------------|
| Ticket assigned to you | `Open · Mark done` |
| Review requested | `Review · Snooze · Mark done` |
| Ticket invitation | `Accept · Reject` (no navigation — row *is* the TicketInvitation component) |
| Ticket resolved/closed | `Open · Mark done` |
| New ticket in org | `Open · Mark done` |
| Message activity | `Open thread · Mark done` |

- `Mark done` always present on every row.
- `Accept`/`Reject` on invitation rows are final actions: row animates out on confirmation; no modal required unless the invitation has already expired.

## 6. Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `j` | Move focus to next notification row |
| `k` | Move focus to previous notification row |
| `Enter` | Open the ticket/thread for focused row |
| `e` | Mark focused notification as done |
| `r` | Mark focused notification as read |
| `s` | Snooze focused notification |
| `x` | Toggle row selection |
| `Shift+a` | Select all on current page |
| `?` | Show keyboard shortcut reference |

## 7. Bulk Operations

- Row hover reveals selection checkbox at left edge.
- Header checkbox selects all rows in current view (current tab + active filters).
- When ≥1 selected: contextual bar appears at top of list with: `Mark read · Mark done · Snooze · ⋯`.
- `Mark all as done for #ticketId` available via row's `⋯` overflow menu — kills all notifications for that ticket in one stroke.
- "Select all matching filter" link appears after selecting current-page rows when more exist.

## 8. Snooze

- Snooze options: `In 1 hour · Tomorrow morning · Next week · Custom date/time`.
- Snoozed notification disappears from Inbox, reappears at `snoozed_until` as unread.
- Snoozed items visible in `All` tab with a clock icon and snooze expiry label.
- Cancelling a snooze returns the item to Inbox immediately.

## 9. Filtering

Filter bar (hidden for User role):

- **Type**: `Assignment · Review · Resolution · Invitation · Message`
- **Ticket**: searchable dropdown of tickets that have notifications in current tab
- **Org** (Super Admin only): which org's activity to show

Filters compose with the active tab (Inbox/Read/Done/All). Combination example: `Inbox + type=Assignment` = "my unread assignments only."

Filter chips appear in the bar when active; each chip has an `×` to remove it. `Clear all` removes all chips.

## 10. Notification Bell & Popover

Bell icon in global nav (`NavSidebar`):

- **Unread count badge**: live count of Inbox items, capped at `99+`. Zero = no badge.
- **Click**: opens popover (not navigation). Popover width ~380px.
- **Popover contents**:
  - Header: `Notifications` title + `Mark all as read` button + `Settings` icon link.
  - List: 5 most recent Inbox items, same visual treatment as full page (urgency dot, subject, event description, timestamp). Inline actions present.
  - Action-required items visually prioritized (appear first, with pill).
  - Footer: `See all notifications →` navigates to `/notifications`.
- Popover closes on outside click or `Escape`.
- Bell badge updates via polling (see § Real-time).

## 11. Per-Role Specifics

**Super Admin**
- Receives the highest volume. Default Inbox filtered to action-required; FYI grouped under a collapsible `+N updates` expander.
- Org filter chip available.
- `Needs your attention` pinned section at top for action-required items.

**Admin**
- Cleanest experience — assignments + review responses dominate.
- Empty Inbox state: `All caught up` with a checkmark illustration (not the generic empty state).
- No Org filter.

**Moderator**
- Notified on every ticket in their org — volume can be high.
- Per-ticket mute available via row's `⋯` menu (`Mute updates from #ticketId`). Muted ticket's future notifications skip Inbox and go directly to Done.
- Muted tickets manageable in `/settings/notifications`.

**User**
- No filter bar (volume too low to need it).
- No tab row — single flat `Inbox` view with `Mark done` on rows.
- Empty state: `You're all caught up`.

## 12. Notification Settings

Accessible at `/settings/notifications` (already in Settings nested routes).

Contents:

- **Per-type toggles**: for each notification type, `In-app · Email · Off`. Action-required types locked to "always in-app" (cannot disable).
- **Quiet hours**: time range during which no email is sent (in-app still works).
- **Digest mode**: Moderator's "new ticket in org" type defaults to `Daily digest` rather than per-event.
- **Muted tickets**: list of muted tickets with unmute option.

Scaffold delivery-channel column even if only `In-app` ships on day one — adding email later without the per-type structure will be regretted.

## 13. Empty & Edge States

| State | Treatment |
|-------|-----------|
| Inbox empty (no unread) | Illustration + role-specific copy (Admin: "All caught up", others: "Nothing needs your attention right now") |
| Tab empty (Read/Done/All) | Muted copy: "Nothing here yet" — no illustration |
| Filter yields zero | "No notifications match these filters" + `Clear filters` link |
| Load error | Inline retry, preserve tab + active filters |
| Invitation already expired/actioned | Inline row: "This invitation has expired" — no Accept/Reject buttons |

## 14. Real-time

- Poll `/api/notifications/count` every 30s while tab visible (`document.visibilityState === 'visible'`).
- Response: `{ inbox: number }`. Update bell badge and tab count label in place.
- **Do not** auto-refresh the list on poll — new items appear as `"N new · refresh"` banner at top of list (same pattern as tickets page). User decides when to load them.
- Snooze expiry: on poll, if any snoozed items have `snoozed_until` in the past, re-fetch list to surface them.
- WebSockets out of scope for v1.

## 15. Out of Scope (v1)

- Real-time toast system for incoming notifications.
- Email delivery (scaffold the settings toggle, skip the actual sending).
- Push / browser notifications.
- @mention support (notification type scaffolded in types but triggers not wired).
- Activity feed as a separate page (dashboard recent-activity widget serves that role).

---

## 16. Data Shapes

```ts
type ID = string; // nanoid

type Role = 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR' | 'USER';

type NotificationState = 'inbox' | 'read' | 'done';

type NotificationTier = 'action_required' | 'status_update' | 'fyi';

type NotificationType =
  | 'ticket_assigned'       // Admin: ticket assigned to you
  | 'review_requested'      // Super Admin: Admin asked for review
  | 'ticket_invitation'     // any role: invited to a ticket
  | 'ticket_resolved'       // involved parties: ticket resolved
  | 'ticket_closed'         // involved parties: ticket closed
  | 'new_ticket_in_org'     // Moderator / Super Admin: new ticket opened
  | 'message_activity';     // involved parties: new message on thread

interface NotificationRow {
  id: ID;
  type: NotificationType;
  tier: NotificationTier;           // server-computed
  state: NotificationState;
  ticket: {
    id: ID;
    subject: string;
    orgId: ID;
    orgName: string;
  };
  latestEvent: {
    description: string;            // human-readable, e.g. "Assigned to you by Jana"
    actor: UserRef;
    at: string;                     // ISO
  };
  eventCount: number;               // total events collapsed into this group row
  snoozedUntil?: string;            // ISO — present if snoozed
  // Invitation-specific — present only when type === 'ticket_invitation'
  invitationId?: ID;
  invitationStatus?: 'pending' | 'accepted' | 'rejected' | 'expired';
}

interface NotificationThread {     // expanded view of a grouped row
  notificationGroupId: ID;         // matches NotificationRow.id
  events: NotificationEvent[];
}

interface NotificationEvent {
  id: ID;
  type: NotificationType;
  description: string;
  actor: UserRef;
  at: string;                      // ISO
}

interface UserRef {
  id: ID;
  name: string;
  avatarUrl?: string;
  role: Role;
  orgId: ID;
}

interface NotificationFilters {
  tab?: 'inbox' | 'read' | 'done' | 'all';
  type?: NotificationType[];
  ticketId?: ID;
  orgId?: ID;                       // Super Admin only
}

interface NotificationCountResponse {
  inbox: number;                    // for bell badge
}

interface NotificationSettings {
  preferences: NotificationPreference[];
  mutedTicketIds: ID[];
  quietHours?: {
    from: string;                   // "HH:mm"
    to: string;                     // "HH:mm"
    timezone: string;
  };
}

interface NotificationPreference {
  type: NotificationType;
  inApp: boolean;                   // action_required types: always true, immutable
  email: boolean;
  digest: boolean;                  // if true, batches rather than per-event
}
```

## 17. API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/notifications` | List — query params encode `NotificationFilters`, `page`, `pageSize` |
| `GET` | `/api/notifications/count` | Bell badge count — `{ inbox: number }` |
| `PATCH` | `/api/notifications/:id` | Update state — `{ state: NotificationState }` |
| `PATCH` | `/api/notifications/:id/snooze` | Snooze — `{ snoozedUntil: string }` |
| `POST` | `/api/notifications/bulk` | Bulk state update — `{ ids: ID[], op: 'read' \| 'done' \| 'snooze', payload? }` |
| `POST` | `/api/notifications/bulk-by-ticket` | Mark all for ticket — `{ ticketId: ID, op: 'done' }` |
| `GET` | `/api/notifications/:id/thread` | Expanded events for a grouped row |
| `POST` | `/api/tickets/:id/invitation/:invitationId/respond` | Accept/reject invitation — `{ response: 'accepted' \| 'rejected' }` |
| `GET` | `/api/notifications/settings` | User's notification preferences |
| `PUT` | `/api/notifications/settings` | Save preferences + muted tickets |
| `POST` | `/api/notifications/mute` | Mute a ticket — `{ ticketId: ID }` |
| `DELETE` | `/api/notifications/mute/:ticketId` | Unmute |

## 18. Frontend State

- **URL = source of truth** for tab, type filter, orgId filter, ticketId filter.
- React Query keyed by the URL query — free dedupe + background refetch.
- Local-only state: selected row set, expanded group IDs, popover open state.
- Bell badge count fetched on a separate 30s poll query; does not share cache with the list query.
- Optimistic updates for: mark read, mark done, snooze, bulk ops. Rollback on error with toast.
- Draft invitation response: optimistic accept/reject with rollback — do not wait for server before animating row out.

## 19. Trigger Matrix

Who receives what, excluding the actor who performed the action:

| Trigger | Super Admin | Admin | Moderator | User |
|---------|:-----------:|:-----:|:---------:|:----:|
| Ticket assigned to Admin | — | ✓ (assignee) | — | — |
| Admin requests review | ✓ (all) | — | — | — |
| New ticket opened in org | ✓ (all) | — | ✓ (same org) | — |
| Ticket resolved / closed | ✓ (all) | ✓ (assigned) | ✓ (same org) | ✓ (creator + assignees) |
| User invited to ticket | — | — | — | ✓ (invitee) |
| Message activity | ✓ (if involved) | ✓ (if involved) | ✓ (if involved) | ✓ (if involved) |

"Involved" = creator, assignee, or explicit invitee of the ticket. Actor always excluded from recipients.

