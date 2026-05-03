import {
  type TicketDetail,
  type TicketFilters,
  type TicketRow,
  TicketFilterParamsSchema,
  TicketListParamsSchema,
  type TicketListParams,
  TicketSearchParamsSchema,
} from "@shared/schema/tickets";
import { ticketDetails } from "./data";
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

export const getTicketById = (id: string) =>
  ticketDetails.find((ticket) => ticket.id === id);

const includesAny = (selected: string[] | undefined, value: string) =>
  selected === undefined || selected.length === 0 || selected.includes(value);

const matchesDateRange = (
  value: string,
  from: string | undefined,
  to: string | undefined,
) => {
  const time = Date.parse(value);

  if (from !== undefined && time < Date.parse(from)) {
    return false;
  }

  if (to !== undefined && time > Date.parse(to)) {
    return false;
  }

  return true;
};

export const filterTickets = <Ticket extends TicketDetail>(
  tickets: Ticket[],
  filters: TicketFilters,
) => {
  const query = filters.q?.trim().toLowerCase();

  return tickets.filter((ticket) => {
    const assigneeIds = ticket.assigneesPreview.map((assignee) => assignee.id);
    const matchesQuery =
      query === undefined ||
      ticket.subject.toLowerCase().includes(query) ||
      ticket.description.toLowerCase().includes(query);

    return (
      includesAny(filters.status, ticket.status) &&
      includesAny(filters.priority, ticket.priority) &&
      includesAny(filters.category, ticket.category ?? "") &&
      includesAny(filters.requesterIds, ticket.requester.id) &&
      includesAny(filters.orgIds, ticket.org.id) &&
      (filters.assigneeIds === undefined ||
        filters.assigneeIds.length === 0 ||
        filters.assigneeIds.some((id) => assigneeIds.includes(id))) &&
      (filters.stale === undefined || ticket.isStale === filters.stale) &&
      matchesDateRange(
        ticket.createdAt,
        filters.createdFrom,
        filters.createdTo,
      ) &&
      matchesQuery
    );
  });
};

const priorityRank: Record<string, number> = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
};

const getComparableValue = (
  ticket: TicketDetail,
  field: TicketListParams["sort"],
) => {
  const [sortField] = field.split(":");

  switch (sortField) {
    case "createdAt":
      return Date.parse(ticket.createdAt);
    case "priority":
      return priorityRank[ticket.priority] ?? Number.MAX_SAFE_INTEGER;
    case "status":
      return ticket.status;
    case "subject":
      return ticket.subject.toLowerCase();
    case "updatedAt":
    default:
      return Date.parse(ticket.updatedAt);
  }
};

export const sortTickets = <Ticket extends TicketDetail>(
  tickets: Ticket[],
  sort: TicketListParams["sort"],
) => {
  const [, direction = "desc"] = sort.split(":");
  const multiplier = direction === "asc" ? 1 : -1;

  return [...tickets].sort((left, right) => {
    const leftValue = getComparableValue(left, sort);
    const rightValue = getComparableValue(right, sort);

    if (leftValue < rightValue) {
      return -1 * multiplier;
    }

    if (leftValue > rightValue) {
      return 1 * multiplier;
    }

    return 0;
  });
};

export const toTicketRow = (ticket: TicketDetail): TicketRow => ({
  id: ticket.id,
  subject: ticket.subject,
  descriptionPreview: ticket.descriptionPreview,
  status: ticket.status,
  priority: ticket.priority,
  category: ticket.category,
  org: ticket.org,
  requester: ticket.requester,
  primaryAssignee: ticket.primaryAssignee,
  assigneeCount: ticket.assigneeCount,
  assigneesPreview: ticket.assigneesPreview,
  createdAt: ticket.createdAt,
  updatedAt: ticket.updatedAt,
  isStale: ticket.isStale,
  unread: ticket.unread,
});
