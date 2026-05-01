# Zustand Store Design

State management blueprint for all pages. Each store owns its slice — no cross-store imports except `useAuthStore` and `useUIStore`.

---

## Global Stores

### `useAuthStore`

Owns current user identity, role, and org memberships. All pages read from this.

```ts
interface AuthState {
  user: {
    id: string;
    displayName: string;
    email: string;
    avatarUrl?: string;
    role: 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR' | 'USER';
    orgId: string;
    timezone: string;
  } | null;
  orgMemberships: { orgId: string; orgName: string; role: string }; // one-to-one mapping
  isAuthenticated: boolean;

  setUser: (user: AuthState['user']) => void;
  logout: () => void;
}
```

---

### `useUIStore`

Global UI chrome state — sidebar, theme, density.

```ts
interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  density: 'comfortable' | 'compact';

  toggleSidebar: () => void;
  setTheme: (theme: UIState['theme']) => void;
  setDensity: (density: UIState['density']) => void;
}
```

---

## Page Stores

---

### `useDashboardStore`

URL state: `/?range=30d&orgId=&priority=&category=`

```ts
interface DashboardFilters {
  range: '7d' | '30d' | '90d' | 'all' | 'custom';
  rangeFrom?: string;   // ISO date
  rangeTo?: string;     // ISO date
  orgIds?: string[];    // Super Admin only
  priority?: ('HIGH' | 'MEDIUM' | 'LOW')[];
  category?: string[];
}

interface KpiCard {
  label: string;
  value: number | string;
  delta?: { percent: number; direction: 'up' | 'down' };
  sparkline: { date: string; value: number }[];
  subline?: string;
}

interface Zone1Data {
  totalTickets: KpiCard;
  pending: KpiCard;
  awaitingReview: KpiCard;
  resolved: KpiCard;
  avgResolutionTime: KpiCard;
  personalVsTeamAvgResolution?: { personal: string; team: string };
}

interface Zone2Data {
  donut: {
    total: number;
    slices: { status: string; count: number; percent: number }[];
  };
  volumeBar: {
    dimensionType: 'org' | 'category' | 'user';
    rows: { dimension: string; dimensionId: string; total: number; segments: unknown[] }[];
  };
  trend: {
    points: { date: string; created: number; resolved: number }[];
  };
}

interface Zone3Data {
  agingTickets?: {
    id: string; subject: string; priority: string;
    createdAt: string; ageMs: number; isStaleHigh: boolean;
  }[];
  recentActivity?: {
    actor: { id: string; name: string; avatarUrl?: string };
    action: string;
    ticket: { id: string; subject: string };
    at: string;
  }[];
  myQueue?: {
    id: string; subject: string; priority: string;
    status: string; requester?: { name: string }; ageMs: number;
  }[];
  topUsers?: { user: { id: string; name: string }; openCount: number; highPriorityCount: number }[];
  orgHealth?: {
    orgId: string; orgName: string;
    openCount: number; staleCount: number; resolvedInRange: number;
  }[];
}

interface DashboardState {
  filters: DashboardFilters;
  zone1: Zone1Data | null;
  zone2: Zone2Data | null;
  zone3: Zone3Data | null;
  loading: Record<'zone1' | 'zone2' | 'zone3', boolean>;
  errors: Record<'zone1' | 'zone2' | 'zone3', string | null>;
  lastFetchedAt: number | null;

  setFilters: (filters: Partial<DashboardFilters>) => void;
  setZone1: (data: Zone1Data) => void;
  setZone2: (data: Zone2Data) => void;
  setZone3: (data: Zone3Data) => void;
  setLoading: (zone: 'zone1' | 'zone2' | 'zone3', loading: boolean) => void;
  setError: (zone: 'zone1' | 'zone2' | 'zone3', error: string | null) => void;
  refetchIfStale: () => void;  // 5-min threshold, called on tab focus
}
```

---

### `useTicketsStore`

URL state: `/tickets?view=&status=&priority=&category=&assignee=&q=&sort=updatedAt:desc&page=1`

```ts
interface TicketFilters {
  status?: ('OPEN' | 'IN_PROGRESS' | 'ON_HOLD' | 'REVIEW' | 'RESOLVED' | 'CLOSED')[];
  priority?: ('HIGH' | 'MEDIUM' | 'LOW')[];
  category?: string[];
  assigneeIds?: string[];
  requesterIds?: string[];
  orgIds?: string[];
  createdFrom?: string;
  createdTo?: string;
  q?: string;
  stale?: boolean;
}

interface TicketSort {
  field: 'updatedAt' | 'createdAt' | 'priority' | 'status' | 'subject';
  dir: 'asc' | 'desc';
}

interface View {
  id: string;
  name: string;
  scope: 'builtin' | 'user';
  ownerId?: string;
  role?: string;
  filters: TicketFilters;
  sort: TicketSort[];
  groupBy?: 'org' | 'status' | 'priority' | 'assignee';
  columns?: string[];
}

interface TicketRow {
  id: string;
  subject: string;
  descriptionPreview: string;
  status: string;
  priority: string;
  category?: string;
  org: { id: string; name: string };
  requester: { id: string; name: string; avatarUrl?: string; role: string; orgId: string };
  primaryAssignee?: { id: string; name: string; avatarUrl?: string; role: string; orgId: string };
  assigneeCount: number;
  assigneesPreview: unknown[];
  createdAt: string;
  updatedAt: string;
  isStale: boolean;
  unread?: boolean;
}

interface NewTicketDraft {
  subject: string;
  description: string;
  category?: string;
  priority?: string;
  inviteeIds: string[];
}

interface TicketsState {
  activeViewId: string | null;
  views: View[];
  filters: TicketFilters;
  sort: TicketSort[];
  page: number;
  pageSize: number;
  total: number;
  rows: TicketRow[];
  selectedRowIds: string[];
  drawerTicketId: string | null;
  createModalOpen: boolean;
  draft: NewTicketDraft | null;
  density: 'compact' | 'comfortable';
  loading: boolean;
  error: string | null;
  newTicketsBannerCount: number;

  setActiveView: (viewId: string) => void;
  setFilters: (filters: Partial<TicketFilters>) => void;
  setSort: (sort: TicketSort[]) => void;
  setPage: (page: number) => void;
  setRows: (rows: TicketRow[], total: number) => void;
  setSelectedRows: (ids: string[]) => void;
  openDrawer: (ticketId: string) => void;
  closeDrawer: () => void;
  openCreateModal: () => void;
  closeCreateModal: () => void;
  saveDraft: (draft: NewTicketDraft) => void;
  loadDraft: () => void;
  optimisticUpdate: (ticketId: string, patch: Partial<TicketRow>) => void;
  setDensity: (density: 'compact' | 'comfortable') => void;
  setNewTicketsBanner: (count: number) => void;
}
```

---

### `useMessagesStore`

URL state: `/messages?tab=all&orgId=&q=&thread=<threadId>`

```ts
interface MessageFilters {
  tab: 'all' | 'unread' | 'mine' | 'org';
  orgId?: string;
  q?: string;
}

interface ThreadListRow {
  id: string;
  ticket: {
    id: string; subject: string;
    status: string; priority: string;
    orgId: string; orgName: string;
  };
  lastMessage: {
    snippet: string; senderName: string;
    at: string; isSystemEvent: boolean;
  };
  unreadCount: number;
  participantsPreview: unknown[];
  participantCount: number;
  isUnanswered: boolean;
  isMuted: boolean;
}

type MessageKind = 'user_message' | 'system_event' | 'file_attachment';

interface Message {
  id: string;
  threadId: string;
  kind: MessageKind;
  sender: unknown;
  at: string;
  content?: string;
  mentions?: unknown[];
  ticketRefs?: string[];
  file?: {
    name: string; size: number;
    mimeType: string; url: string; thumbnailUrl?: string;
  };
  eventKind?: string;
  eventDescription?: string;
}

interface Thread {
  id: string;
  ticket: unknown;
  participants: unknown[];
  messages: Message[];
  nextCursor?: string;
  permissions: {
    canSend: boolean;
    canAddParticipants: boolean;
    canJoin: boolean;
    canMute: boolean;
  };
}

interface MessagesState {
  filters: MessageFilters;
  threadList: ThreadListRow[];
  activeThreadId: string | null;
  currentThread: Thread | null;
  loading: { list: boolean; thread: boolean; sending: boolean };
  error: string | null;
  drafts: Record<string, string>;  // threadId → content, persisted to localStorage

  setFilters: (filters: Partial<MessageFilters>) => void;
  setThreadList: (rows: ThreadListRow[]) => void;
  openThread: (threadId: string) => void;
  closeThread: () => void;
  setCurrentThread: (thread: Thread) => void;
  addMessage: (message: Message) => void;       // optimistic + WebSocket
  sendMessage: (content: string, mentions: unknown[], ticketRefs: string[], fileIds: string[]) => void;
  markThreadRead: (threadId: string) => void;
  muteThread: (threadId: string) => void;
  saveDraft: (threadId: string, content: string) => void;
  loadDraft: (threadId: string) => string;
  loadOlderMessages: (cursor: string) => void;
  joinThread: (threadId: string) => void;
}
```

---

### `useNotificationsStore`

URL state: `/notifications?tab=inbox&type=&orgId=&ticketId=`

```ts
type NotificationState = 'inbox' | 'read' | 'done';
type NotificationTier = 'action_required' | 'status_update' | 'fyi';
type NotificationType =
  | 'ticket_assigned' | 'review_requested' | 'ticket_invitation'
  | 'ticket_resolved' | 'ticket_closed' | 'new_ticket_in_org' | 'message_activity';

interface NotificationRow {
  id: string;
  type: NotificationType;
  tier: NotificationTier;
  state: NotificationState;
  ticket: { id: string; subject: string; orgId: string; orgName: string };
  latestEvent: { description: string; actor: unknown; at: string };
  eventCount: number;
  snoozedUntil?: string;
  invitationId?: string;
  invitationStatus?: 'pending' | 'accepted' | 'rejected' | 'expired';
}

interface NotificationFilters {
  tab: 'inbox' | 'read' | 'done' | 'all';
  type?: NotificationType[];
  ticketId?: string;
  orgId?: string;
}

interface NotificationsState {
  filters: NotificationFilters;
  notifications: NotificationRow[];
  expandedGroupIds: Set<string>;
  selectedIds: string[];
  bellBadgeCount: number;
  newBannerCount: number;
  loading: boolean;
  error: string | null;

  setFilters: (filters: Partial<NotificationFilters>) => void;
  setNotifications: (rows: NotificationRow[]) => void;
  toggleGroup: (groupId: string) => void;
  selectRows: (ids: string[]) => void;
  markAsRead: (id: string) => void;
  markAsDone: (id: string) => void;
  snooze: (id: string, until: string) => void;
  respondToInvitation: (invitationId: string, response: 'accepted' | 'rejected') => void;
  setBellBadge: (count: number) => void;
  setNewBanner: (count: number) => void;
}
```

---

### `useTeamsStore`

URL state: `/teams?orgId=&role=&q=`

```ts
interface TeamFilters {
  orgId?: string;
  role?: ('SUPER_ADMIN' | 'ADMIN' | 'MODERATOR' | 'USER')[];
  q?: string;
}

interface MemberRow {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: string;
  orgId: string;
  joinedAt: string;
  lastActiveAt?: string;
  isInactive: boolean;
  permissions: { canChangeRole: boolean; canRemove: boolean; canMoveTo: boolean };
}

interface MemberDetail extends MemberRow {
  orgMemberships: { org: { id: string; name: string }; role: string; joinedAt: string }[];
  stats: { ticketsCreated: number; ticketsAssigned: number; avgResolutionMs?: number };
}

interface OrgSection {
  org: { id: string; name: string };
  memberCount: number;
  roleCounts: Record<string, number>;
  members: MemberRow[];
  expanded: boolean;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  orgId: string;
  orgName: string;
  invitedBy: { id: string; name: string };
  sentAt: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  inviteUrl: string;
}

interface AuditEntry {
  id: string;
  at: string;
  actor: { id: string; name: string };
  action: 'role_changed' | 'removed' | 'invited' | 'invitation_cancelled';
  targetUser: { id: string; name: string };
  org: { id: string; name: string };
  fromRole?: string;
  toRole?: string;
  reason?: string;
}

interface TeamsState {
  filters: TeamFilters;
  orgSections: OrgSection[];
  selectedMemberDetail: MemberDetail | null;
  detailOpen: boolean;
  pendingInvitations: Invitation[];
  inviteModalOpen: boolean;
  inviteDraft: { email: string; role: string; orgId: string; message: string } | null;
  auditLog: AuditEntry[];
  auditLogMemberId: string | null;
  selectedRowIds: string[];
  loading: boolean;
  error: string | null;

  setFilters: (filters: Partial<TeamFilters>) => void;
  setOrgSections: (sections: Omit<OrgSection, 'expanded'>[]) => void;
  toggleOrgExpanded: (orgId: string) => void;
  openMemberDetail: (memberId: string) => void;
  closeMemberDetail: () => void;
  setPendingInvitations: (invitations: Invitation[]) => void;
  selectRows: (ids: string[]) => void;
  openInviteModal: () => void;
  closeInviteModal: () => void;
  saveDraft: (draft: TeamsState['inviteDraft']) => void;
  loadDraft: () => void;
  openAuditLog: (memberId: string) => void;
  closeAuditLog: () => void;
  setAuditLog: (entries: AuditEntry[]) => void;
  lazyLoadMembers: (orgId: string) => void;
}
```

---

### `useSettingsStore`

No meaningful URL state beyond the active sub-route (handled by React Router).

```ts
interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  timezone: string;
  role: string;
}

interface ConnectedProvider {
  provider: 'github' | 'google';
  connected: boolean;
  accountIdentifier?: string;
}

interface ActiveSession {
  id: string;
  deviceDescription: string;
  locationCity?: string;
  lastActiveAt: string;
  isCurrent: boolean;
}

interface NotificationPreference {
  type: string;
  inApp: boolean;
  email: boolean;
}

interface QuietHours {
  enabled: boolean;
  from: string;  // "HH:mm"
  to: string;
  timezone: string;
}

interface OrgSettingsData {
  orgId: string;
  orgName: string;
  orgLogoUrl?: string;
  defaultCategories: string[];
  defaultPriority: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface SettingsState {
  // Profile
  profile: UserProfile | null;
  // Security
  connectedProviders: ConnectedProvider[];
  activeSessions: ActiveSession[];
  // Notifications
  notificationPreferences: NotificationPreference[];
  quietHours: QuietHours | null;
  mutedTickets: { id: string; subject: string }[];
  // Org
  orgSettings: OrgSettingsData | null;
  // UI
  saving: Record<string, boolean>;   // keyed by section
  errors: Record<string, string | null>;

  // Profile
  setProfile: (profile: UserProfile) => void;
  updateDisplayName: (name: string) => void;
  updateTimezone: (tz: string) => void;
  uploadAvatar: (file: File) => void;

  // Security
  setConnectedProviders: (providers: ConnectedProvider[]) => void;
  setActiveSessions: (sessions: ActiveSession[]) => void;
  changePassword: (current: string, next: string) => void;
  connectOAuthProvider: (provider: 'github' | 'google') => void;
  disconnectOAuthProvider: (provider: string) => void;
  logoutSession: (sessionId: string) => void;
  logoutAllSessions: () => void;

  // Notifications
  setNotificationPreferences: (prefs: NotificationPreference[]) => void;
  toggleNotificationType: (type: string, channel: 'inApp' | 'email') => void;
  setQuietHours: (qh: QuietHours) => void;
  muteTicket: (id: string, subject: string) => void;
  unmuteTicket: (id: string) => void;

  // Appearance — delegates to useUIStore
  // (theme and density live in useUIStore, settings page reads/writes there)

  // Org
  setOrgSettings: (settings: OrgSettingsData) => void;
  updateOrgName: (name: string) => void;
  uploadOrgLogo: (file: File) => void;
  updateDefaultCategories: (categories: string[]) => void;
  updateDefaultPriority: (priority: string) => void;

  // Danger
  initiateAccountDeletion: () => void;
  confirmAccountDeletion: (emailConfirmation: string) => void;
}
```

---

## Store Boundaries

| Store | Owns | Reads from |
|---|---|---|
| `useAuthStore` | Current user, role, orgs | — |
| `useUIStore` | Theme, density, sidebar | — |
| `useDashboardStore` | KPI data, chart data, filters | `useAuthStore` (role gates) |
| `useTicketsStore` | Ticket list, views, drawer, draft | `useAuthStore` |
| `useMessagesStore` | Thread list, active thread, drafts | `useAuthStore` |
| `useNotificationsStore` | Notification list, bell badge | `useAuthStore` |
| `useTeamsStore` | Org sections, member detail, invites | `useAuthStore` |
| `useSettingsStore` | All settings sections | `useAuthStore`, `useUIStore` |

**Appearance settings** (`theme`, `density`) live in `useUIStore` — `useSettingsStore` just calls into it. This prevents duplication and keeps live-preview working app-wide without prop drilling.
