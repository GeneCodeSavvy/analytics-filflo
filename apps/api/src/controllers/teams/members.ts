import {
  BulkMemberOpSchema,
  BulkMemberResultSchema,
  MemberDetailSchema,
  RemoveMemberParamsSchema,
  RoleChangePayloadSchema,
  TeamMemberListResponseSchema,
  TeamMemberParamsSchema,
} from "@shared/schema/teams";
import type { RequestHandler } from "express";
import {
  sendInvalidRequest,
  sendNotFound,
  sendValidatedData,
} from "../../lib/controllers";
import { filterMembers, getMemberById, parseTeamMemberListParams } from "./utils";

export const getMembers: RequestHandler = (req, res) => {
  const params = parseTeamMemberListParams(req.query);

  if (!params.success) {
    return sendInvalidRequest(res, "team member list params", params.error.issues);
  }

  const filtered = filterMembers(params.data);
  const start = (params.data.page - 1) * params.data.pageSize;
  const rows = filtered.slice(start, start + params.data.pageSize);

  return sendValidatedData(
    res,
    TeamMemberListResponseSchema,
    {
      rows,
      total: filtered.length,
      page: params.data.page,
      pageSize: params.data.pageSize,
      serverTime: "2026-05-02T09:45:00.000Z",
    },
    "Team member list dummy data",
  );
};

export const getMember: RequestHandler = (req, res) => {
  const params = TeamMemberParamsSchema.safeParse(req.params);

  if (!params.success) {
    return sendInvalidRequest(res, "team member id", params.error.issues);
  }

  const member = getMemberById(params.data.id);

  if (!member) {
    return sendNotFound(res, "Team member");
  }

  return sendValidatedData(
    res,
    MemberDetailSchema,
    member,
    "Team member detail dummy data",
  );
};

export const changeMemberRole: RequestHandler = (req, res) => {
  const params = TeamMemberParamsSchema.safeParse(req.params);
  const body = RoleChangePayloadSchema.safeParse(req.body);

  if (!params.success) {
    return sendInvalidRequest(res, "team member id", params.error.issues);
  }

  if (!body.success) {
    return sendInvalidRequest(res, "role change payload", body.error.issues);
  }

  const member = getMemberById(params.data.id);

  if (!member) {
    return sendNotFound(res, "Team member");
  }

  return sendValidatedData(
    res,
    MemberDetailSchema,
    {
      ...member,
      role: body.data.role,
    },
    "Changed member role dummy data",
  );
};

export const moveMember: RequestHandler = (req, res) => {
  const params = TeamMemberParamsSchema.safeParse(req.params);

  if (!params.success) {
    return sendInvalidRequest(res, "team member id", params.error.issues);
  }

  const member = getMemberById(params.data.id);

  if (!member) {
    return sendNotFound(res, "Team member");
  }

  return res.status(405).json({
    success: false,
    error: "Org moves are not supported",
  });
};

export const removeMember: RequestHandler = (req, res) => {
  const params = TeamMemberParamsSchema.safeParse(req.params);
  const query = RemoveMemberParamsSchema.safeParse(req.query);

  if (!params.success) {
    return sendInvalidRequest(res, "team member id", params.error.issues);
  }

  if (!query.success) {
    return sendInvalidRequest(res, "remove member params", query.error.issues);
  }

  if (!getMemberById(params.data.id)) {
    return sendNotFound(res, "Team member");
  }

  return sendValidatedData(
    res,
    BulkMemberResultSchema,
    { succeeded: [params.data.id], failed: [] },
    "Remove member dummy data",
  );
};

export const bulkMembers: RequestHandler = (req, res) => {
  const body = BulkMemberOpSchema.safeParse(req.body);

  if (!body.success) {
    return sendInvalidRequest(res, "bulk member payload", body.error.issues);
  }

  const knownIds = new Set(body.data.ids.filter((id) => getMemberById(id)));

  return sendValidatedData(
    res,
    BulkMemberResultSchema,
    {
      succeeded: body.data.ids.filter((id) => knownIds.has(id)),
      failed: body.data.ids
        .filter((id) => !knownIds.has(id))
        .map((id) => ({ id, reason: "Team member not found" })),
    },
    "Bulk member operation dummy data",
  );
};
