# Ideation Phase Comments
- Delete Account, Log Out, Reset Password, Add auth github, or google

## After Brain Strom Comments
Settings is the page that reveals whether a product trusts its users. A settings page that's just "delete account and log out" is a failure of imagination — it tells users the product doesn't think they have preferences worth respecting. Your spec is minimal, which means there's a lot of room to be deliberate here. The goal isn't more settings; it's the *right* settings, organized in a way that users can find them without a tutorial.

## The mental model: sections, not a flat list

Settings pages fail when they become a dump of every toggle the team ever wanted to expose. The antidote is **section-based layout** with a persistent left nav and a content area on the right. Each section is a discrete concern. Users come to settings with a specific intent — "I want to change my password," "I want to turn off email notifications" — the nav makes that intent-matching fast.

Sections I'd ship:

- **Profile** — name, avatar, display preferences
- **Account & Security** — password, connected auth providers, active sessions
- **Notifications** — per-type toggles, delivery channels, quiet hours
- **Appearance** — theme (light/dark/system), density
- **Org Settings** *(role-gated — Super Admin only)* — org-wide configuration
- **Danger Zone** — delete account

This is the GitHub / Linear / Vercel pattern. It scales as you add features without turning into a wall of options.

## Profile section

Name and avatar are table stakes. Beyond that:

- **Display name** — what shows in ticket assignee lists, message threads, notification rows. Important to get right because it appears everywhere.
- **Avatar** — upload or auto-generated initials avatar. Don't skip the generated avatar; a blank profile picture is visually jarring in a product that shows avatars in many places (ticket assignees, message participants, notification rows).
- **Timezone** — this matters more than most teams realize. "Ticket created 3 hours ago" displayed in UTC to a user in IST creates silent confusion. Store timezone per user and use it to render all relative timestamps. Default to browser-detected timezone, but let the user override.
- **Role display** — read-only. Show the user their role in the system so they understand why they can or can't do certain things. Confusion about permissions is often confusion about role.

No bio, no social links, no "what team are you on" — scope creep with no payoff for a support tool.

## Account & Security section

This is where your spec's three features live, plus two additions worth having from day one.

**Password change** — standard: current password, new password, confirm. Require minimum strength (8+ chars, one non-letter). No password complexity theater (no "must contain exactly one uppercase, one symbol, one rune from an ancient script"). Show a strength meter, not a checklist. On success, send a confirmation email — a password change email is a security signal, not a spam vector.

**Connected auth providers (GitHub, Google)** — your spec mentions this. The UI pattern is a list of "Connected accounts" with a connect/disconnect button per provider. A few important rules:
- If the account was *created* via OAuth (no password set), don't let them disconnect the OAuth provider without first setting a password — otherwise they get locked out.
- Show *which* GitHub/Google account is connected (email/username), not just "GitHub: connected." Users sometimes have multiple Google accounts and need to verify they connected the right one.
- Connecting a second provider is additive — one account can have both GitHub and Google connected and use either to log in.

**Active sessions** — not in your spec but cheap to build and valuable for security-conscious users. A list of "where you're logged in" with device/browser, rough location (city-level from IP), last active time, and a "Log out this session" button. GitHub does this well. The payoff: users who think their account is compromised can see if there's an unfamiliar session and revoke it without panicking and deleting everything.

**Log out** — a button at the bottom of this section, not buried in a dropdown. Log out all sessions (not just current) should also be available here.

**Two-factor authentication** — not in your spec, and I wouldn't build it on day one. But the settings section should leave space for it — a grayed-out "Two-factor authentication: coming soon" placeholder tells users you're thinking about it.

## Notifications section

Your notifications brainstorm already calls out the need for per-type toggles and delivery channel controls. Settings is where those live. The structure:

**Delivery channels** (top of section):
- In-app: always on, not toggleable (it's the core surface)
- Email: on/off toggle with a "verify your email" nudge if unverified

**Per-type toggles** (middle):

| Notification type | In-app | Email |
|---|---|---|
| Ticket assigned to me | ✓ (locked) | toggle |
| Review requested from me | ✓ (locked) | toggle |
| Ticket invitation received | ✓ (locked) | toggle |
| Ticket resolved/closed | ✓ | toggle |
| New ticket in my org | ✓ | toggle |
| Message activity | ✓ | toggle |
| @mentions | ✓ (locked) | toggle |

"Locked" = action-required types that can't be disabled in-app. Users can always opt out of email for these, but the in-app notification can't be turned off — you can't miss an assignment. This is the same tiering from the notifications brainstorm.

**Quiet hours** (bottom):
- Time range (e.g., 10 PM – 8 AM) during which no email notifications are sent. In-app notifications still accumulate, just no email delivery. Respects the user's timezone setting from Profile.

Don't build digest mode on day one, but sketch the setting slot — "Email frequency: Immediately / Daily digest / Weekly digest" — as a future-facing placeholder. Adding digest later without the settings slot means a migration.

## Appearance section

**Theme:** Light / Dark / System (follows OS preference). System should be the default — it's what most users want without knowing they want it. Persist the choice in the user's profile (not localStorage only) so it follows them across devices.

**Density:** Comfortable / Compact for the tickets table. Referenced in the tickets brainstorm — this is where it lives as a setting. "Comfortable" is the default; power users who manage large ticket volumes will switch to compact.

That's it for appearance. Don't add font size controls, color accent pickers, or layout customizations on day one. The settings page itself should demonstrate restraint.

## Org Settings section (Super Admin only)

Only visible to Super Admins. The nav item is hidden for all other roles — don't show a locked/disabled item, just don't show it. A locked item implies they're missing something; a hidden item implies it doesn't apply to them.

What belongs here:
- **Org name and logo** — what shows in the dashboard's org filter and in tickets' org column
- **Default ticket category list** — the categories that appear in the NewTicket category dropdown, editable here rather than hardcoded
- **Default priority** — what priority a new ticket gets if the creator doesn't specify
- **Member management** — a table of org members with their roles. Super Admins can change roles (promote a User to Moderator, demote a Moderator). This is the admin panel for org composition. Invite new members by email with a role pre-selected.

What doesn't belong here:
- Billing (out of scope for now)
- Webhook or API key management (out of scope)
- Audit logs (valuable, but a separate page when you get there)

## Danger Zone section

The standard pattern: a visually separated section at the bottom with a red border, a clear warning, and a confirmation dialog before any destructive action.

**Delete Account** — the action should:
1. Show a modal explaining exactly what will be deleted (profile, auth credentials) and what won't (tickets they created remain, with author shown as "Deleted user")
2. Require them to type their email address to confirm — not just "yes" or "delete," but the actual email. This is the GitHub pattern and it works because it's specific to the account being deleted.
3. After deletion, redirect to the marketing site or a "your account has been deleted" confirmation page. Don't redirect to login — there's nothing to log into.

**What happens to their data:** Tickets they created should persist (the ticket is the org's record, not the user's). Their name in those tickets becomes "Deleted user." Their messages in threads remain but are attributed to "Deleted user." This is the standard pattern and avoids cascading data loss when an org member leaves.

Super Admins should not be able to delete their own account if they're the only Super Admin in any org — surface this as a blocking error: "You are the only Super Admin in [Org Name]. Transfer ownership or promote another member before deleting your account." This prevents orgs from becoming unmanageable.

## Navigation and URL structure

Settings pages should be deep-linkable. `/settings/profile`, `/settings/security`, `/settings/notifications`, `/settings/appearance`, `/settings/org`, `/settings/danger`. This matters for onboarding flows (send them directly to `/settings/security` to connect GitHub), support ("go to /settings/notifications and disable X"), and browser history (back button should not kick you out of settings entirely).

The active section in the left nav is highlighted. On mobile, the left nav collapses into a section title with a back button — the "section list → section content" drill-down is the right mobile pattern.

## What I'd cut

- **Export data button.** Tempting GDPR-adjacent feature, but "export my data" for a support tool user is low-value — they don't own the tickets they filed in the same way a social user owns their posts. Build when legally required, not proactively.
- **Account merge / transfer.** Edge case that creates more support tickets than it prevents. If a user has two accounts, have them contact a Super Admin to sort it out.
- **Separate "profile page" vs "settings."** Some products have a public profile page and a private settings page. Your product has no social graph — there's nothing to publicize. Profile and settings can be the same surface.
- **Language / locale selector.** Ship in English first. Adding i18n before you have users who need it is waste.

## The shortest summary

Section nav on the left, content on the right. Profile, Security (password + OAuth + sessions), Notifications (per-type toggles + email delivery), Appearance (theme + density), Org Settings (Super Admin only), Danger Zone. The OAuth connect/disconnect flow needs the "you'll be locked out" guard. Notification settings should match exactly the types defined in the notifications spec. Danger Zone needs email-confirmation deletion and the single-Super-Admin guard. Everything else is table stakes.

---

# Final Specification

## 1. Route & Layout

- Root route: `/settings` — redirects to `/settings/profile`.
- Nested routes (rendered via `<Outlet>` inside `Settings.tsx`):
  - `/settings/profile`
  - `/settings/security`
  - `/settings/notifications`
  - `/settings/appearance`
  - `/settings/org` — Super Admin only; hidden from nav for all other roles
  - `/settings/danger`

Layout: **two-column** — persistent left nav (220px) + content area (flex fill).

```
┌──────────────────┬─────────────────────────────────┐
│  Settings Nav    │  Section Content                 │
│  (220px)         │                                  │
│                  │  [section heading]               │
│  Profile         │  [form / list]                   │
│  Security        │  [save / action buttons]         │
│  Notifications   │                                  │
│  Appearance      │                                  │
│  Org Settings ✦  │                                  │
│  Danger Zone     │                                  │
└──────────────────┴─────────────────────────────────┘
```

✦ Org Settings nav item rendered only for `SUPER_ADMIN`. Do not show a disabled/locked item for other roles — omit entirely.

Mobile: left nav collapses into a section-list screen. Tapping a section navigates to the content screen with a back button (drill-down pattern). Active section highlighted in nav.

## 2. Profile Section (`/settings/profile`)

Fields:

| Field | Type | Notes |
|-------|------|-------|
| Display name | Text input | Shown in ticket assignee lists, thread participants, notification rows |
| Avatar | File upload | 200×200px max display. Auto-generated initials avatar if none uploaded |
| Timezone | Searchable dropdown | Default: browser-detected (`Intl.DateTimeFormat().resolvedOptions().timeZone`). Used to render all relative timestamps app-wide |
| Role | Read-only badge | Colored role pill — helps users understand why they can/can't do things |

- Avatar upload: accepts JPG/PNG/WebP ≤ 2 MB. Preview before confirm. Persisted via `POST /api/files/upload` then referenced in profile.
- Timezone change is applied immediately to all timestamp rendering across the app (no page reload needed).
- `Save changes` button at section bottom. Disabled until any field changes. Inline success/error feedback — no toast.

## 3. Account & Security Section (`/settings/security`)

Three subsections, separated by dividers:

### 3a. Password

- Fields: `Current password` · `New password` · `Confirm new password`.
- Strength meter (not a checklist): weak / fair / strong / very strong. Minimum: 8 chars, at least one non-letter.
- On success: confirmation email sent; in-page success message shown.
- If account was created via OAuth with no password set: show `Set a password` variant (no "current password" field). Required before they can disconnect their OAuth provider.

### 3b. Connected Accounts

List of OAuth providers: `GitHub` and `Google`.

Each row:

- Provider logo + name
- Connected account identifier (email/username of the linked account, not just "connected")
- `Connect` or `Disconnect` button

Rules:
- If only one auth method exists (OAuth, no password), `Disconnect` is disabled with tooltip: "Set a password before disconnecting."
- Connecting a second provider is additive — both GitHub and Google can be connected simultaneously.
- On `Connect`: OAuth redirect flow; on return, provider row updates.
- On `Disconnect`: single-click confirmation inline (no modal — low stakes once the guard passes).

### 3c. Active Sessions

Table of sessions where the user is currently logged in:

Columns: `Device / Browser · Location (city-level) · Last active · Action`

- `Log out` button per row revokes that session's token.
- Current session row labeled "This device" — its log-out button reads "Log out of current session."
- `Log out of all sessions` button at bottom of subsection — revokes all tokens including current, redirects to login.

Two-factor authentication: out of scope for v1. A grayed-out placeholder row in this subsection: "Two-factor authentication — coming soon." Signals future intent without shipping it.

## 4. Notifications Section (`/settings/notifications`)

Mirrors the notification types defined in the Notifications spec (`notificationsPage.md § 16`).

### 4a. Delivery Channels

| Channel | Toggle |
|---------|--------|
| In-app | Always on — not toggleable |
| Email | On/off. If email not verified, shows "Verify your email" nudge instead of toggle |

### 4b. Per-Type Toggles

| Notification Type | In-app | Email toggle |
|-------------------|--------|--------------|
| Ticket assigned to me | ✓ locked | ○ |
| Review requested from me | ✓ locked | ○ |
| Ticket invitation received | ✓ locked | ○ |
| @mention | ✓ locked | ○ |
| Ticket resolved / closed | ✓ | ○ |
| New ticket in my org | ✓ | ○ |
| Message activity | ✓ | ○ |

"Locked" = action-required tier; in-app cannot be disabled. Email can always be opted out. Lock icon on the in-app cell; tooltip explains why.

Role-aware: `New ticket in my org` row hidden for `ADMIN` and `USER` (not a trigger for those roles per the notifications trigger matrix).

### 4c. Quiet Hours

- Time range: `From` and `To` time pickers (e.g., 22:00 – 08:00).
- Applied to email delivery only — in-app notifications still accumulate.
- Respects the timezone set in Profile.
- Toggle to enable/disable quiet hours entirely.

### 4d. Muted Tickets

- List of tickets the user has muted (via the notifications or messages page `⋯` menu).
- Each row: `#id · subject · Unmute` button.
- Empty state: "No muted tickets" — section header still shown so users know the feature exists.

Email frequency placeholder (future-facing): grayed-out row — "Email frequency: Immediately / Daily digest / Weekly digest — coming soon."

## 5. Appearance Section (`/settings/appearance`)

| Setting | Options | Default |
|---------|---------|---------|
| Theme | Light / Dark / System | System |
| Density | Comfortable / Compact | Comfortable |

- **Theme:** System follows OS `prefers-color-scheme`. Persisted to user profile (not localStorage only) so it follows across devices.
- **Density:** Controls ticket table row height — Comfortable = 56px (description preview shown), Compact = 32px. Same setting as the per-page density toggle on `/tickets`; they stay in sync.
- Changes apply immediately (no save button needed — live preview as they switch).

## 6. Org Settings Section (`/settings/org`)

Visible and accessible only to `SUPER_ADMIN`. Nav item absent for all other roles.

Sub-sections:

### 6a. Org Identity

| Field | Type |
|-------|------|
| Org name | Text input |
| Org logo | File upload (same constraints as avatar) |

Org name appears in: dashboard Org filter, tickets Org column, teams org headers.

### 6b. Ticket Defaults

| Field | Type | Notes |
|-------|------|-------|
| Default ticket categories | Tag input (add/remove) | Populates the Category dropdown in NewTicket modal |
| Default priority | Radio: HIGH / MEDIUM / LOW | Applied when creator doesn't specify; default = MEDIUM |

Category list: ordered list with drag-to-reorder. "Add category" text input at bottom.

### 6c. Member Management

Compact member table scoped to the Super Admin's primary org:

Columns: `Avatar · Name · Role pill · Actions`

- Actions: `Change role… · Remove from org` (same confirmation modals as Teams page).
- `+ Invite Member` button at top-right — opens the same invite modal as Teams page.
- This is a convenience surface; the full Teams page (`/teams`) is authoritative. No duplicate functionality — both share the same API.

## 7. Danger Zone Section (`/settings/danger`)

Visually separated: red left border, red section heading, warning copy.

### Delete Account

Three-step destruction flow:

1. **Explain consequences** in the modal:
   - Profile and auth credentials deleted.
   - Tickets created by the user persist; author shown as "Deleted user."
   - Messages persist; attributed to "Deleted user."
   - Cannot be undone.

2. **Blocking guard for lone Super Admin:** if the user is the only `SUPER_ADMIN` in any org, deletion is blocked. The button opens a modal that reads: *"You are the only Super Admin in [Org Name]. Promote another member or transfer ownership before deleting your account."* No confirmation field shown — just the block message and a `Go to Teams` link.

3. **Email confirmation field** (shown only after the guard passes): user must type their email address exactly. Submit button enabled only when the typed value matches. On submit: account deleted, redirect to `/` (marketing landing page or a "your account has been deleted" static page — not login).

No other actions in this section for v1.

## 8. Empty & Edge States

| State | Treatment |
|-------|-----------|
| Timezone not detected | Default to UTC; show an info nudge: "We couldn't detect your timezone. Set it here." |
| Email unverified (notifications section) | Yellow nudge banner in notifications section: "Verify your email to enable email notifications" with a resend link |
| No active sessions besides current | Active sessions list shows only "This device"; `Log out of all sessions` still present |
| No muted tickets | "No muted tickets" copy in muted-tickets subsection |
| Org Settings: no categories defined | "No categories yet. Add one below." inline empty state |
| Load error per section | Inline retry in the content area — left nav remains functional |
| Save error | Inline error message below the form; form state preserved |

## 9. Real-time

- No polling required. Settings changes are infrequent; background refetch on tab focus with 5-minute stale threshold is sufficient (same pattern as dashboard and teams).
- Theme change is local-first (applies immediately via CSS class toggle); persisted to server on change.
- Density change: same — local-first, server-persisted.
- Active sessions table: no live updates needed. User can manually refresh.

## 10. Out of Scope (v1)

- Export / download my data (build when legally required)
- Account merge / transfer
- Language / locale selector
- SSO / SCIM provisioning
- Webhook / API key management
- Billing
- Two-factor authentication (placeholder shown; no implementation)
- Audit log as standalone page (exposed only via Teams member detail drawer)
- Email digest mode (placeholder shown; no implementation)
- Per-org notification settings (all notification preferences are per-user)

---

## 11. Data Shapes

```ts
type ID = string; // nanoid
type Role = 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR' | 'USER';
type Theme = 'light' | 'dark' | 'system';
type Density = 'comfortable' | 'compact';

interface UserProfile {
  id: ID;
  displayName: string;
  email: string;
  avatarUrl?: string;           // null = show initials avatar
  timezone: string;             // IANA tz string e.g. "Asia/Kolkata"
  role: Role;
  theme: Theme;
  density: Density;
}

interface ConnectedProvider {
  provider: 'github' | 'google';
  connected: boolean;
  accountIdentifier?: string;   // email or username of linked account
}

interface ActiveSession {
  id: ID;
  deviceDescription: string;   // e.g. "Chrome on macOS"
  locationCity?: string;        // city-level from IP geolocation
  lastActiveAt: string;         // ISO
  isCurrent: boolean;
}

type NotificationType =
  | 'ticket_assigned'
  | 'review_requested'
  | 'ticket_invitation'
  | 'mention'
  | 'ticket_resolved'
  | 'ticket_closed'
  | 'new_ticket_in_org'
  | 'message_activity';

interface NotificationPreference {
  type: NotificationType;
  inApp: boolean;               // action_required types: always true, immutable
  email: boolean;
}

interface QuietHours {
  enabled: boolean;
  from: string;                 // "HH:mm"
  to: string;                   // "HH:mm"
  timezone: string;             // mirrors UserProfile.timezone
}

interface NotificationSettings {
  preferences: NotificationPreference[];
  quietHours: QuietHours;
  mutedTickets: { id: ID; subject: string }[];
}

interface OrgSettings {
  orgId: ID;
  orgName: string;
  orgLogoUrl?: string;
  defaultCategories: string[];  // ordered; drag-to-reorder
  defaultPriority: 'HIGH' | 'MEDIUM' | 'LOW';
}

// Profile update — PATCH /api/settings/profile
interface ProfileUpdatePayload {
  displayName?: string;
  avatarFileId?: ID;            // pre-uploaded via /api/files/upload
  timezone?: string;
}

// Appearance update — PATCH /api/settings/appearance
interface AppearanceUpdatePayload {
  theme?: Theme;
  density?: Density;
}

// Password change — POST /api/settings/security/password
interface PasswordChangePayload {
  currentPassword?: string;     // omitted when setting password for first time
  newPassword: string;
}

// Notification settings update — PUT /api/settings/notifications
interface NotificationSettingsUpdatePayload {
  preferences?: NotificationPreference[];
  quietHours?: QuietHours;
  mutedTicketIds?: ID[];
}

// Org settings update — PATCH /api/settings/org
interface OrgSettingsUpdatePayload {
  orgName?: string;
  orgLogoFileId?: ID;
  defaultCategories?: string[];
  defaultPriority?: 'HIGH' | 'MEDIUM' | 'LOW';
}

// Account deletion — DELETE /api/settings/account
interface DeleteAccountPayload {
  emailConfirmation: string;    // must match the user's email exactly
}
```

## 12. API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/settings/profile` | Fetch `UserProfile` |
| `PATCH` | `/api/settings/profile` | Update display name, avatar, timezone |
| `GET` | `/api/settings/security` | Fetch `ConnectedProvider[]` + `ActiveSession[]` |
| `POST` | `/api/settings/security/password` | Change or set password |
| `POST` | `/api/settings/security/oauth/:provider/connect` | Initiate OAuth connect redirect |
| `DELETE` | `/api/settings/security/oauth/:provider` | Disconnect OAuth provider |
| `DELETE` | `/api/settings/security/sessions/:sessionId` | Log out a specific session |
| `DELETE` | `/api/settings/security/sessions` | Log out all sessions |
| `GET` | `/api/settings/notifications` | Fetch `NotificationSettings` |
| `PUT` | `/api/settings/notifications` | Save preferences + quiet hours + muted tickets |
| `GET` | `/api/settings/appearance` | Fetch `{ theme, density }` |
| `PATCH` | `/api/settings/appearance` | Update theme / density |
| `GET` | `/api/settings/org` | Fetch `OrgSettings` — Super Admin only |
| `PATCH` | `/api/settings/org` | Update org settings — Super Admin only |
| `DELETE` | `/api/settings/account` | Delete account — body `DeleteAccountPayload` |

## 13. Frontend State

- **URL = source of truth** for active section (the nested route path).
- Each section fetches independently via React Query keyed by section — a failed Profile fetch doesn't block Security.
- Local-only state: unsaved form field changes (dirtied state for `Save changes` button enablement).
- Theme and density applied immediately via a root-level context; server persistence happens concurrently (fire-and-forget with rollback on error).
- Active sessions: no optimistic update for revoke — wait for server confirm, then remove row. (Revoking a session is a security action; optimistic removal before confirm would be misleading.)
- Password form: cleared on success; error message preserved inline.
- OAuth connect: OAuth redirect flow — returns to `/settings/security` with a `?connected=github` query param; page reads param on mount, shows success banner, then removes param from URL.

## 14. Permissions Matrix

| Action | SUPER_ADMIN | ADMIN | MODERATOR | USER |
|--------|:-----------:|:-----:|:---------:|:----:|
| View / edit Profile | ✓ | ✓ | ✓ | ✓ |
| View / edit Security | ✓ | ✓ | ✓ | ✓ |
| View / edit Notifications | ✓ | ✓ | ✓ | ✓ |
| View / edit Appearance | ✓ | ✓ | ✓ | ✓ |
| View / edit Org Settings | ✓ | — | — | — |
| Delete own account | ✓ (with guard) | ✓ | ✓ | ✓ |

All settings endpoints are scoped to the authenticated session — clients never pass a `userId`. Server enforces role-gating on Org Settings endpoints.

