export {
  NotificationStateSchema,
  NotificationTierSchema,
  NotificationTypeSchema,
  NotificationRowSchema,
  NotificationListResponseSchema,
  NotificationCountResponseSchema,
  NotificationThreadSchema,
  NotificationEventSchema,
  NotificationFiltersSchema,
  NotificationListParamsSchema,
  SnoozePayloadSchema,
  BulkNotificationPayloadSchema,
  InvitationResponsePayloadSchema,
} from "@shared/schema";

export type {
  NotificationState,
  NotificationType,
  NotificationTier,
  NotificationRow,
  NotificationListResponse,
  NotificationCountResponse,
  NotificationThread,
  NotificationEvent,
  NotificationFilters,
  NotificationListParams,
  SnoozePayload,
  BulkNotificationPayload,
  InvitationResponsePayload,
} from "@shared/schema";

import type { NotificationFilters, NotificationType } from "@shared/schema";

export function parseFilters(params: URLSearchParams): NotificationFilters {
  const tab = (params.get("tab") ?? "inbox") as NotificationFilters["tab"];
  const typeStr = params.get("type");
  const ticketId = params.get("ticketId") ?? undefined;
  const orgId = params.get("orgId") ?? undefined;

  return {
    tab,
    type: typeStr ? (typeStr.split(",") as NotificationType[]) : undefined,
    ticketId,
    orgId,
  };
}

export function mergeFilters(
  params: URLSearchParams,
  patch: Partial<NotificationFilters>
): URLSearchParams {
  const next = new URLSearchParams(params);

  if (patch.tab !== undefined) {
    next.set("tab", patch.tab);
  }
  if (patch.type !== undefined) {
    if (patch.type.length === 0) {
      next.delete("type");
    } else {
      next.set("type", patch.type.join(","));
    }
  }
  if (patch.ticketId !== undefined) {
    if (!patch.ticketId) {
      next.delete("ticketId");
    } else {
      next.set("ticketId", patch.ticketId);
    }
  }
  if (patch.orgId !== undefined) {
    if (!patch.orgId) {
      next.delete("orgId");
    } else {
      next.set("orgId", patch.orgId);
    }
  }

  return next;
}

export function serializeTypes(types: NotificationType[]): string {
  return types.join(",");
}

export function buildListKey(params: object): Record<string, unknown> {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && !(Array.isArray(v) && v.length === 0)
  );
  const sorted = entries.sort(([a], [b]) => a.localeCompare(b));
  const result: Record<string, unknown> = {};
  for (const [key, value] of sorted) {
    if (Array.isArray(value)) {
      result[key] = [...value].sort().join(",");
    } else {
      result[key] = value;
    }
  }
  return result;
}
