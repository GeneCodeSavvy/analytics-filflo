import {
  TeamAuditParamsSchema,
  TeamInvitationListParamsSchema,
  TeamMemberListParamsSchema,
} from "@shared/schema/teams";
import { getQuerySource, toNumber, toStringArray } from "../../lib/controllers";

export const parseTeamMemberListParams = (query: unknown) => {
  const source = getQuerySource(query);

  return TeamMemberListParamsSchema.safeParse({
    orgId: source.orgId,
    role: toStringArray(source.role),
    q: source.q,
    page: toNumber(source.page) ?? 1,
    pageSize: toNumber(source.pageSize) ?? 25,
  });
};

export const parseTeamAuditParams = (query: unknown) => {
  const source = getQuerySource(query);

  return TeamAuditParamsSchema.safeParse({
    orgId: source.orgId,
    limit: toNumber(source.limit) ?? 50,
    cursor: source.cursor,
  });
};

export const parseTeamInvitationListParams = (query: unknown) => {
  const source = getQuerySource(query);

  return TeamInvitationListParamsSchema.safeParse({
    orgId: source.orgId,
    status: source.status,
  });
};
