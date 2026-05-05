import {
  MessageFilters,
  MessageFiltersSchema,
  MessagePageParamsSchema,
} from "@shared/schema/messages";
import { Prisma, TicketParticipantRole } from "@prisma/client";
import { getQuerySource, toNumber } from "../../lib/controllers";
import type { MessageActor } from "./permissions";
import { createThreadAccessWhere } from "./permissions";

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
  actor: MessageActor,
): Prisma.ThreadWhereInput => {
  const query = filters.q?.trim().toLowerCase();
  const and: Prisma.ThreadWhereInput[] = [createThreadAccessWhere(actor)];
  const ticketWhere: Prisma.ThreadWhereInput["ticket"] = {};

  if (filters.orgId) {
    ticketWhere.orgId = filters.orgId;
  }

  if (filters.tab === "mine") {
    ticketWhere.participants = {
      some: {
        userId: actor.id,
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

  return and.length > 0 ? { AND: and } : {};
};
