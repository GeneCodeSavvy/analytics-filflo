export {
  NotificationStateSchema,
  NotificationTierSchema,
  NotificationRowSchema,
  NotificationListResponseSchema,
  NotificationCountResponseSchema,
  NotificationThreadSchema,
  NotificationEventSchema,
  NotificationFiltersSchema,
  NotificationListParamsSchema,
  BulkNotificationPayloadSchema,
  InvitationResponsePayloadSchema,
} from "@shared/schema/notifications";
export { NotificationTypeSchema } from "@shared/schema/domain";

import type {
  InvitationResponsePayload,
  NotificationRow,
} from "@shared/schema/notifications";

export type { NotificationType } from "@shared/schema/domain";

export type {
  NotificationState,
  NotificationTier,
  NotificationRow,
  NotificationListResponse,
  NotificationCountResponse,
  NotificationThread,
  NotificationEvent,
  NotificationFilters,
  NotificationListParams,
  BulkNotificationPayload,
  InvitationResponsePayload,
} from "@shared/schema/notifications";

export type SnoozePayload = {
  snoozedUntil: string;
};

export type TabKey = "inbox" | "read" | "done" | "all";
export type DateBand = "Today" | "Yesterday" | "This Week" | "Older";
export type InvitationResponse = InvitationResponsePayload["response"];

export type NotificationEmptyStateCopy = {
  heading: string;
  text: string;
};

export type NotificationShortcut = {
  key: string;
  label: string;
};

export type NotificationGroupedRows = Record<DateBand, NotificationRow[]>;

export type EmptyStateProps = {
  activeTab: TabKey;
  hasFilters: boolean;
  onClear: () => void;
};

export type SnoozeMenuProps = {
  onSelect: (date: Date, label: string) => void;
};

export type ThreadEventsProps = {
  row: NotificationRow;
};

export type NotificationActionsProps = {
  row: NotificationRow;
  visible: boolean;
  onOpen: () => void;
  onDone: () => void;
  onSnooze: (date: Date, label: string) => void;
  onInvite: (response: InvitationResponse) => void;
};

export type NotificationRowViewProps = {
  row: NotificationRow;
  focused: boolean;
  selected: boolean;
  expanded: boolean;
  dismissing: boolean;
  onFocus: () => void;
  onToggleSelect: () => void;
  onToggleExpand: () => void;
  onOpen: () => void;
  onDone: () => void;
  onSnooze: (date: Date, label: string) => void;
  onInvite: (response: InvitationResponse) => void;
};
