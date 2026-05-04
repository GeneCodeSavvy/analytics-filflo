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

import type { InvitationResponsePayload } from "@shared/schema/notifications";

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
