import {
  TicketFilterParamsSchema,
  TicketListParamsSchema,
  TicketSearchParamsSchema,
} from "@shared/schema/tickets";
import {
  getQuerySource,
  toBoolean,
  toNumber,
  toStringArray,
} from "../../lib/controllers";

export { IdParamsSchema } from "@shared/schema/domain";

export const parseTicketListParams = (query: unknown) => {
  const source = getQuerySource(query);

  return TicketListParamsSchema.safeParse({
    status: toStringArray(source.status),
    priority: toStringArray(source.priority),
    category: toStringArray(source.category),
    assigneeIds: toStringArray(source.assigneeIds),
    requesterIds: toStringArray(source.requesterIds),
    orgIds: toStringArray(source.orgIds),
    createdFrom: source.createdFrom,
    createdTo: source.createdTo,
    q: source.q,
    stale: toBoolean(source.stale),
    sort: source.sort ?? "updatedAt:desc",
    page: toNumber(source.page) ?? 1,
    pageSize: toNumber(source.pageSize) ?? 20,
    groupBy: source.groupBy,
  });
};

export const parseTicketFilterParams = (query: unknown) => {
  const source = getQuerySource(query);

  return TicketFilterParamsSchema.safeParse({
    status: toStringArray(source.status),
    priority: toStringArray(source.priority),
    category: toStringArray(source.category),
    assigneeIds: toStringArray(source.assigneeIds),
    requesterIds: toStringArray(source.requesterIds),
    orgIds: toStringArray(source.orgIds),
    createdFrom: source.createdFrom,
    createdTo: source.createdTo,
    q: source.q,
    stale: toBoolean(source.stale),
    sort: source.sort ?? "updatedAt:desc",
    groupBy: source.groupBy,
  });
};

export const parseTicketSearchParams = (query: unknown) => {
  const source = getQuerySource(query);

  return TicketSearchParamsSchema.safeParse({
    status: toStringArray(source.status),
    priority: toStringArray(source.priority),
    category: toStringArray(source.category),
    assigneeIds: toStringArray(source.assigneeIds),
    requesterIds: toStringArray(source.requesterIds),
    orgIds: toStringArray(source.orgIds),
    createdFrom: source.createdFrom,
    createdTo: source.createdTo,
    q: source.q,
    stale: toBoolean(source.stale),
    limit: toNumber(source.limit),
  });
};
