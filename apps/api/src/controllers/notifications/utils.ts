import { NotificationListParamsSchema } from "@shared/schema/notifications";
import { getQuerySource, toNumber, toStringArray } from "../../lib/controllers";
import { notificationRows } from "./data";
import type { ValidationIssue } from "../../lib/controllers";
import type {
  NotificationListParams,
  NotificationRow,
  NotificationType,
} from "@shared/schema/notifications";

type ParamParseResult<Key extends string> =
  | { success: true; data: Record<Key, string> }
  | { success: false; error: { issues: ValidationIssue[] } };

export const requiredParamSchema = <Key extends string>(key: Key) => ({
  safeParse: (params: unknown): ParamParseResult<Key> => {
    const source =
      typeof params === "object" && params !== null
        ? (params as Record<string, unknown>)
        : {};
    const value = source[key];

    if (typeof value === "string" && value.length > 0) {
      return { success: true, data: { [key]: value } as Record<Key, string> };
    }

    return {
      success: false,
      error: {
        issues: [
          {
            code: "invalid_type",
            path: [key],
            message: `${key} is required`,
          },
        ],
      },
    };
  },
});

const toTypeArray = (value: unknown): string[] | undefined => {
  const values = toStringArray(value);

  if (values === undefined) {
    return undefined;
  }

  return values.flatMap((item) => item.split(",").filter(Boolean));
};

export const parseNotificationListParams = (query: unknown) => {
  const source = getQuerySource(query);

  return NotificationListParamsSchema.safeParse({
    tab: source.tab ?? "inbox",
    type: toTypeArray(source.type),
    ticketId: source.ticketId,
    orgId: source.orgId,
    page: toNumber(source.page) ?? 1,
    pageSize: toNumber(source.pageSize) ?? 25,
  });
};

export const NotificationListParamsRequestSchema = {
  safeParse: parseNotificationListParams,
};

export const getNotificationById = (id: string) =>
  notificationRows.find((notification) => notification.id === id);

export const filterNotifications = (
  rows: NotificationRow[],
  params: NotificationListParams,
) =>
  rows.filter((row) => {
    const matchesTab = params.tab === "all" || row.state === params.tab;
    const matchesTypes =
      params.type === undefined ||
      params.type.length === 0 ||
      params.type.includes(row.type as NotificationType);
    const matchesTicket =
      params.ticketId === undefined || row.ticket?.id === params.ticketId;
    const matchesOrg =
      params.orgId === undefined || row.ticket?.orgId === params.orgId;

    return matchesTab && matchesTypes && matchesTicket && matchesOrg;
  });
