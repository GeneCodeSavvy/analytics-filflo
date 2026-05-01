type NotificationState = "inbox" | "read" | "done";
type NotificationTier = "action_required" | "status_update" | "fyi";
type NotificationType =
  | "ticket_assigned"
  | "review_requested"
  | "ticket_invitation"
  | "ticket_resolved"
  | "ticket_closed"
  | "new_ticket_in_org"
  | "message_activity";

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
  invitationStatus?: "pending" | "accepted" | "rejected" | "expired";
}

interface NotificationFilters {
  tab: "inbox" | "read" | "done" | "all";
  type?: NotificationType[];
  ticketId?: string;
  orgId?: string;
}

export interface NotificationsState {
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
  respondToInvitation: (
    invitationId: string,
    response: "accepted" | "rejected",
  ) => void;
  setBellBadge: (count: number) => void;
  setNewBanner: (count: number) => void;
}
