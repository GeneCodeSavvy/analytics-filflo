import {
  MessageFilters,
  MessageFiltersSchema,
  MessagePageParamsSchema,
} from "@shared/schema/messages";
import { Prisma, TicketParticipantRole } from "@prisma/client";
import { getQuerySource, toNumber } from "../../lib/controllers";

export const parseMessageFilters = (query: unknown) => {
  const source = getQuerySource(query);

  return MessageFiltersSchema.safeParse({
    tab: source.tab,
    orgId: source.orgId,
    q: source.q,
  });
};

export const parseMessagePageParams = (query: unknown) => {
  const source = getQuerySource(query);

  return MessagePageParamsSchema.safeParse({
    cursor: source.cursor,
    limit: toNumber(source.limit) ?? 50,
  });
};

export const buildThreadWhere = (
  filters: MessageFilters,
  currentUserId?: string,
): Prisma.ThreadWhereInput => {
  const query = filters.q?.trim().toLowerCase();
  const and: Prisma.ThreadWhereInput[] = [];
  const ticketWhere: Prisma.ThreadWhereInput["ticket"] = {};

  if (filters.orgId) {
    ticketWhere.orgId = filters.orgId;
  }

  if (filters.tab === "mine" && currentUserId) {
    ticketWhere.participants = {
      some: {
        userId: currentUserId,
        role: TicketParticipantRole.ASSIGNEE,
      },
    };
  }

  if (Object.keys(ticketWhere).length > 0) {
    and.push({ ticket: ticketWhere });
  }

  if (query) {
    and.push({
      OR: [
        { ticket: { subject: { contains: query, mode: "insensitive" } } },
        {
          messages: {
            some: {
              deletedAt: null,
              content: { contains: query, mode: "insensitive" },
            },
          },
        },
      ],
    });
  }

  if (filters.tab === "org" && !filters.orgId) {
    and.push({ id: "__no_org_selected__" });
  }

  if (filters.tab === "unread" && !currentUserId) {
    and.push({ id: "__no_current_user__" });
  }

  return and.length > 0 ? { AND: and } : {};
};
