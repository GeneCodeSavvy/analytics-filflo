import { Prisma } from "@prisma/client";
import {
  NotificationListParamsSchema,
  type NotificationFilters,
} from "@shared/schema/notifications";
import { getQuerySource, toNumber, toStringArray } from "../../lib/controllers";
import type { ValidationIssue } from "../../lib/controllers";

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
    type: toTypeArray(source.type)?.map((value) => value.toUpperCase()),
    ticketId: source.ticketId,
    orgId: source.orgId,
    page: toNumber(source.page) ?? 1,
    pageSize: toNumber(source.pageSize) ?? 25,
  });
};

export const NotificationListParamsRequestSchema = {
  safeParse: parseNotificationListParams,
};

export const buildNotificationWhere = (
  currentUserId: string,
  filters?: Pick<NotificationFilters, "type" | "ticketId" | "orgId">,
): Prisma.NotificationWhereInput => ({
  recipientId: currentUserId,
  ...(filters?.type?.length ? { type: { in: filters.type } } : {}),
  ...(filters?.ticketId ? { ticketId: filters.ticketId } : {}),
  ...(filters?.orgId
    ? {
        ticket: {
          orgId: filters.orgId,
        },
      }
    : {}),
});
