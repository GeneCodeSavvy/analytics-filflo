import {
  type InvitationStatus,
  TeamAuditParamsSchema,
  TeamInvitationListParamsSchema,
  TeamMemberListParamsSchema,
  type TeamRole,
} from "@shared/schema/teams";
import { getQuerySource, toNumber, toStringArray } from "../../lib/controllers";
import { invitations, members } from "./data";

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

export const getMemberById = (id: string) =>
  members.find((member) => member.id === id);

export const getInvitationById = (id: string) =>
  invitations.find((invitation) => invitation.id === id);

const includesRole = (roles: TeamRole[] | undefined, role: TeamRole) =>
  roles === undefined || roles.length === 0 || roles.includes(role);

export const filterMembers = (
  params: ReturnType<typeof TeamMemberListParamsSchema.parse>,
) => {
  const query = params.q?.trim().toLowerCase();

  return members.filter((member) => {
    const matchesOrg = params.orgId === undefined || member.orgId === params.orgId;
    const matchesRole = includesRole(params.role, member.role);
    const matchesQuery =
      query === undefined ||
      member.name.toLowerCase().includes(query) ||
      member.email.toLowerCase().includes(query);

    return matchesOrg && matchesRole && matchesQuery;
  });
};

export const filterInvitations = (filters: {
  orgId?: string;
  status?: InvitationStatus;
}) =>
  invitations.filter(
    (invitation) =>
      (filters.orgId === undefined || invitation.orgId === filters.orgId) &&
      (filters.status === undefined || invitation.status === filters.status),
  );
