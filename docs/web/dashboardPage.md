Good ticketing dashboards aren't really "analytics pages" — they're status-at-a-glance control rooms. The first 3 seconds matter more than the next 3 minutes. Linear, Jira Service Management, Zendesk, and Intercom all converge on a similar pattern: top strip of KPIs, middle band of distributions, bottom stack of actionables. Here's how I'd adapt that to your spec.

## Global affordances (above the dashboard content itself)

A **time range selector** is non-negotiable — "30 tickets resolved" is meaningless without "this week vs last week." Default to *Last 30 days* with quick chips for 7d / 30d / 90d / All time / Custom. Every metric on the page should respect it.

For Super Admins, add an **Org filter** in the same row (multi-select, default = all). For everyone, a **Priority** and **Category** filter chip. Keep them as compact pills, not a heavy filter sidebar.

## Zone 1 — The KPI strip (top)

Your five numbers (total / pending / review / resolved / avg resolution time) become five cards across the top. Each card needs three things, not just the number:

1. **The big number** in a large weight
2. **A delta** vs the previous period (`↑ 12% vs last 30d`), color-coded — green for "good direction" given the metric's polarity (resolved ↑ green, pending ↑ red)
3. **A 30-day sparkline** at the bottom of the card

Zendesk does this well; the sparkline is what makes the card feel alive instead of static.

One important detail: **Avg Resolution Time** lies if you average everything together. Break it inside the card by priority — `HIGH 4h · MED 1.2d · LOW 3.5d` as a small subline. A 5-day average is fine if it's all LOW priority and terrible if it's HIGH.

## Zone 2 — The distribution band (middle)

Your two charts go here, side by side on desktop, stacked on mobile.

**Status pie → make it a donut.** Put the total ticket count in the center hole. Use stable colors that you reuse everywhere in the app: IN PROGRESS = blue, ON HOLD = amber, REVIEW = purple, RESOLVED = green. Consistency across pages is what makes a product feel like a product.

**Volume bar chart — make it role-aware.** "By Org" only makes sense for Super Admin. Swap the dimension based on role:

- **Super Admin:** by Org (as specified)
- **Admin:** by Category, of tickets assigned to them
- **Moderator:** by User (who in my org is raising the most tickets) or by Category
- **User:** by Status of their own tickets, or skip the chart entirely — they don't have enough data for it to be interesting

Make the bars **stacked by status**, not just total count. A bar showing "Org X has 40 tickets" is fine; one showing "Org X has 40 tickets, 25 of which are still open" is actionable. This is the Jira Service Management pattern and it's strictly better than plain totals.

I'd also add a **third chart** here that the spec is missing: a **trend line** of ticket volume over time, with one line for "created" and one for "resolved." When the gap between them widens, you have a problem. This single chart answers "are we keeping up?" better than any KPI card.

## Zone 3 — Actionable lists (bottom)

This is where most ticketing dashboards under-deliver and where you can stand out. Numbers don't drive action; lists do. Two or three compact tables/lists across the bottom:

- **Aging tickets** — open tickets sorted by age, oldest first, capped at 5–7 rows. Show id, subject, priority, age. One click → ticket detail. This is the Linear / Height pattern: surface what's been ignored.
- **Recent activity** — a feed of "Admin X resolved #ab12cd3f", "Moderator Y assigned #...". Useful for everyone but especially Super Admins managing across orgs.
- **My queue** *(role-specific)* — for Admins, their open assignments sorted by priority then age. For Users, their open tickets and their statuses. This effectively makes the dashboard a useful landing page, not just a vanity page.

## Role variations summary

Same skeleton, different lenses:

- **Super Admin:** all orgs, "by Org" bar, org leaderboard in zone 3 (which org is healthiest/worst)
- **Admin:** scoped to assigned tickets, personal resolution time vs team average shown as a comparison KPI, "my queue" prominent
- **Moderator:** scoped to their org, "top users by ticket volume" replacing the org leaderboard
- **User:** simplified — just their own tickets, big "Create Ticket" CTA, status of recent submissions; honestly consider whether they need a dashboard at all or if the Tickets page is enough

## Things worth borrowing from specific products

- **Linear** — restraint. Don't show a metric just because you can compute it. If it doesn't change behavior, cut it.
- **Zendesk** — sparklines on every KPI, and grouping resolution time by priority.
- **Jira Service Management** — SLA breach indicators. You don't have SLAs in your model yet, but a "tickets older than X days at HIGH priority" warning banner is a poor man's version and very valuable.
- **Intercom** — response time as a first-class metric. Worth considering "time to first response" alongside "time to resolution" once Messages is built.
- **GitHub Issues / Height** — the activity feed pattern, which makes the dashboard feel live.

One thing I'd actively push back on from typical ticketing software: avoid the "wall of widgets" trap (ServiceNow is the cautionary tale). Five KPIs, two-to-three charts, two-to-three lists. If you can't fit it in one viewport-and-a-half on a 1440p screen, it's too much.

---

# Final Specification

## 1. Route & Layout

- Route: `/`
- URL state: `/?range=30d&orgId=&priority=&category=` — all controls reflected in URL for shareability.

Layout (top to bottom):

1. **Page header**: title `Dashboard`.
2. **Global controls row**: time range selector + filter chips (Org for Super Admin, Priority, Category).
3. **Zone 1 — KPI strip**: five cards across (two-column on tablet, single-column on mobile).
4. **Zone 2 — Distribution band**: three charts side-by-side on desktop, stacked on mobile.
5. **Zone 3 — Actionable lists**: two or three panels across on desktop, stacked on mobile.

Density constraint: all zones must fit in one viewport-and-a-half on a 1440p screen. No widget sprawl.

## 2. Global Controls

**Time range selector** (default: Last 30 days):

Quick chips: `7d · 30d · 90d · All time · Custom`. Custom opens a date-range picker. Every metric, chart, and list on the page respects the active range.

**Filter chips** (compact pills in the same row as the time range):

- **Org** — multi-select dropdown; Super Admin only; default = all orgs.
- **Priority** — multi-select: `HIGH · MEDIUM · LOW`.
- **Category** — multi-select of existing categories.

Active chips display their value (e.g. `Org: Acme, Beta`) with an `×` to remove. A `Clear all` affordance appears when any filter is active.

## 3. Zone 1 — KPI Strip

Five cards left-to-right:

| Card | Metric | Delta polarity |
|------|--------|---------------|
| Total Tickets | Count in range | Neutral |
| Pending | Open + In Progress + On Hold | ↑ = red (bad) |
| Awaiting Review | Status = REVIEW | ↑ = red |
| Resolved | Status = RESOLVED in range | ↑ = green (good) |
| Avg Resolution Time | Mean time open→resolved | ↑ = red |

Each card contains:

1. **Big number** — large weight, prominent.
2. **Delta vs previous equivalent period** — `↑ 12%` or `↓ 8%` with directional color per polarity column above.
3. **30-day sparkline** at card bottom — thin line chart of the metric's daily value.

**Avg Resolution Time card** additionally shows a priority breakdown as a muted subline:
`HIGH 4h · MED 1.2d · LOW 3.5d` — raw average without this breakdown is misleading.

## 4. Zone 2 — Distribution Band

Three charts, side-by-side on desktop:

### Chart A — Status Donut

Donut chart (not pie). **Total ticket count in the center hole.**

Stable status colors (reused everywhere in the app):

| Status | Color |
|--------|-------|
| OPEN | `#6B7280` |
| IN_PROGRESS | `#3B82F6` |
| ON_HOLD | `#F59E0B` |
| REVIEW | `#8B5CF6` |
| RESOLVED | `#10B981` |
| CLOSED | `#1F2937` |

Hover on a segment shows count + percentage tooltip.

### Chart B — Volume Bar (role-aware dimension)

Stacked horizontal bar chart. **Bars stacked by status** (same palette as donut) — total bar length = ticket count, stack segments show status breakdown.

X-axis dimension varies by role:

| Role | Dimension |
|------|-----------|
| Super Admin | Org |
| Admin | Category (of their assigned tickets) |
| Moderator | User (who in their org created the most tickets) |
| User | Omit this chart; show a second copy of the trend line instead |

### Chart C — Volume Trend Line

Line chart over the active time range. Two lines:

- **Created** (solid, `#3B82F6`)
- **Resolved** (solid, `#10B981`)

When the created line is above the resolved line and the gap is widening, load is accumulating — the chart answers "are we keeping up?" at a glance. X-axis = date, Y-axis = daily count.

## 5. Zone 3 — Actionable Lists

Two or three panels across on desktop (exact count varies by role — see § Role Variations).

### Panel A — Aging Tickets (all roles except User)

Open tickets (status not RESOLVED/CLOSED) sorted by `createdAt` ascending — oldest first. Cap at 7 rows.

Columns: `Priority dot · #ID · Subject (truncated) · Age`

- Age shown as relative duration ("14d", "3h").
- Amber highlight on rows older than 7 days at HIGH priority (stale + urgent).
- Row click → opens ticket detail drawer on `/tickets/:id`.

### Panel B — Recent Activity

Chronological feed of ticket lifecycle events. ~8–10 entries. Each entry:

`[Actor avatar] [Actor name] [action] [#ticket subject] · [relative time]`

Example: `Jana resolved #ab12cd3f · 2h ago`

Scope of events filtered to same ticket scope as active filters (e.g. Super Admin sees all orgs; Admin sees their assigned tickets).

### Panel C — My Queue *(role-specific, see § Role Variations)*

Compact table of actionable tickets for the viewer. Content varies per role (see below). Row click → ticket detail drawer.

## 6. Role Variations

### Super Admin

- All metrics span all orgs (filtered by Org chip).
- Zone 2 Chart B: by Org dimension.
- Zone 3: Aging · Recent Activity · **Org Health** — a mini leaderboard of orgs ranked by open-ticket count descending. Columns: `Org · Open · Stale · Resolved (range)`. Surfaces which org needs attention.

### Admin

- All metrics scoped to tickets assigned to them.
- Zone 2 Chart B: by Category.
- KPI strip: Avg Resolution Time card has a second subline showing their personal avg vs team avg: `You: 1.1d · Team: 1.8d`.
- Zone 3 Panel C — My Queue: their open assigned tickets sorted by priority then age. Columns: `Priority · Subject · Requester · Age`.

### Moderator

- All metrics scoped to their org.
- Zone 2 Chart B: by User (who in their org raised the most tickets).
- Zone 3 Panel C — My Queue: replaced by **Top Users** — users in their org ranked by open-ticket count. Columns: `User · Open · High priority`. Surfaces who needs the most help.

### User

- Metrics scoped to their own tickets only.
- Zone 1: show only three KPI cards — `My Open · My Resolved · Avg Wait Time` (time to first Admin response, not resolution time).
- Zone 2: Status donut (their tickets) + Trend line (their tickets). Chart B omitted.
- Zone 3: only Panel C — **My Tickets** — their open tickets sorted by status priority (REVIEW first, then IN_PROGRESS, ON_HOLD, OPEN). Prominent `+ New Ticket` CTA above the panel. No aging panel (not actionable for users). No recent activity (too much noise from others).

## 7. Empty & Edge States

| State | Treatment |
|-------|-----------|
| No tickets in range | KPI cards show `0` with no delta (no delta arrow when prior period is also zero). Charts show empty state message inline. |
| No tickets matching filters | Inline message in each zone: "No data for these filters" + `Clear filters` link. |
| Single org / single user (charts too sparse) | Hide Chart B if fewer than 2 dimension values; show a one-liner instead ("All tickets are from one category"). |
| Load error | Inline retry per zone — a failed KPI strip doesn't block charts. Each zone fetches independently. |
| User with zero tickets | Full-page empty state: illustration + "You haven't created any tickets yet" + `+ Create your first ticket` CTA. |

## 8. Real-time

- **No live polling on the dashboard.** Metrics are aggregates; sub-minute freshness has no action value.
- On tab focus (`visibilitychange`), refetch all dashboard queries if data is older than 5 minutes.
- Recent Activity panel: refetch on tab focus with the same 5-minute stale threshold — not a streaming feed.

## 9. Out of Scope (v1)

- SLA breach tracking (stale-age coloring in Aging panel is the v1 substitute).
- Response time as a KPI (build after Messages is live).
- Scheduled / emailed reports.
- Custom widget arrangement or saved dashboard configs.
- Kanban-style status board (belongs on Tickets page).

---

## 10. Data Shapes

```ts
type ID = string; // nanoid
type Role = 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR' | 'USER';
type Status = 'OPEN' | 'IN_PROGRESS' | 'ON_HOLD' | 'REVIEW' | 'RESOLVED' | 'CLOSED';
type Priority = 'HIGH' | 'MEDIUM' | 'LOW';

interface DashboardFilters {
  range: '7d' | '30d' | '90d' | 'all' | 'custom';
  rangeFrom?: string;   // ISO — custom range start
  rangeTo?: string;     // ISO — custom range end
  orgIds?: ID[];        // Super Admin only
  priority?: Priority[];
  category?: string[];
}

// Zone 1
interface KpiCard {
  label: string;
  value: number | string;       // number for counts; "1.2d" for duration
  delta?: {
    percent: number;            // e.g. 12 = +12%
    direction: 'up' | 'down';
  };
  sparkline: SparklinePoint[];  // daily values, length = range in days
  subline?: string;             // e.g. "HIGH 4h · MED 1.2d · LOW 3.5d"
}

interface SparklinePoint {
  date: string;   // ISO date
  value: number;
}

interface KpiStripResponse {
  totalTickets: KpiCard;
  pending: KpiCard;
  awaitingReview: KpiCard;
  resolved: KpiCard;
  avgResolutionTime: KpiCard;
  // Admin-only
  personalVsTeamAvgResolution?: { personal: string; team: string };
}

// Zone 2
interface StatusDonutSlice {
  status: Status;
  count: number;
  percent: number;
}

interface StatusDonutResponse {
  total: number;
  slices: StatusDonutSlice[];
}

interface VolumeBarSegment {
  status: Status;
  count: number;
}

interface VolumeBarRow {
  dimension: string;        // org name, category, or user name
  dimensionId: ID;
  total: number;
  segments: VolumeBarSegment[];
}

interface VolumeBarResponse {
  dimensionType: 'org' | 'category' | 'user';
  rows: VolumeBarRow[];
}

interface TrendPoint {
  date: string;   // ISO date
  created: number;
  resolved: number;
}

interface VolumeTrendResponse {
  points: TrendPoint[];
}

// Zone 3
interface AgingTicket {
  id: ID;
  subject: string;
  priority: Priority;
  createdAt: string;   // ISO
  ageMs: number;       // server-computed
  isStaleHigh: boolean; // HIGH priority + age > 7d
}

interface ActivityEntry {
  actor: { id: ID; name: string; avatarUrl?: string };
  action: string;        // e.g. "resolved"
  ticket: { id: ID; subject: string };
  at: string;            // ISO
}

interface MyQueueTicket {
  id: ID;
  subject: string;
  priority: Priority;
  status: Status;
  requester?: { name: string };   // Admin view
  ageMs: number;
}

interface OrgHealthRow {
  orgId: ID;
  orgName: string;
  openCount: number;
  staleCount: number;
  resolvedInRange: number;
}

interface DashboardZone3Response {
  agingTickets?: AgingTicket[];        // all roles except User
  recentActivity?: ActivityEntry[];    // all roles except User
  myQueue?: MyQueueTicket[];           // Admin + User
  topUsers?: { user: { id: ID; name: string }; openCount: number; highPriorityCount: number }[];  // Moderator
  orgHealth?: OrgHealthRow[];          // Super Admin
}
```

## 11. API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/dashboard/kpis` | KPI strip — query params encode `DashboardFilters` |
| `GET` | `/api/dashboard/status-distribution` | Status donut data |
| `GET` | `/api/dashboard/volume-by-dimension` | Volume bar chart — dimension inferred server-side from role |
| `GET` | `/api/dashboard/volume-trend` | Trend line (created vs resolved over time) |
| `GET` | `/api/dashboard/zone3` | Aging tickets + recent activity + role-specific panel — single request for zone 3 |

All endpoints accept `DashboardFilters` as query params. The server enforces role-scoping — clients never need to send `userId`; the session provides it.

## 12. Frontend State

- **URL = source of truth** for `range`, `orgId[]`, `priority[]`, `category[]`.
- Each zone fetches independently via React Query — keyed by `[zone, filters]`. A failed KPI fetch doesn't block charts.
- Charts use the stable status color map from `src/lib/constants.ts` — same palette as Tickets page status pills and donut slices.
- Local-only state: chart hover tooltips, expanded/collapsed state of Org Health rows.
- No optimistic updates needed — dashboard is read-only.
- On `visibilitychange` to visible: mark all dashboard queries stale if `staleTime > 5 min`, triggering a background refetch.
