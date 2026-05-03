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
import type { DbClient } from "../../lib/db";
import {
  getMemberById,
  getMembers,
} from "./data";
import { parseTeamMemberListParams } from "./utils";

export const getMembers_: RequestHandler = async (req, res) => {
  const params = parseTeamMemberListParams(req.query);

  if (!params.success) {
    return sendInvalidRequest(res, "team member list params", params.error.issues);
  }

  const db = req.app.locals.db as DbClient;
  const { rows, total } = await getMembers(db, params.data);

  return sendValidatedData(res, TeamMemberListResponseSchema, {
    rows,
    total,
    page: params.data.page,
    pageSize: params.data.pageSize,
    serverTime: new Date().toISOString(),
  });
};

export { getMembers_ as getMembers };

export const getMember: RequestHandler = async (req, res) => {
  const params = TeamMemberParamsSchema.safeParse(req.params);

  if (!params.success) {
    return sendInvalidRequest(res, "team member id", params.error.issues);
  }

  const db = req.app.locals.db as DbClient;
  const member = await getMemberById(db, params.data.id);

  if (!member) {
    return sendNotFound(res, "Team member");
  }

  return sendValidatedData(res, MemberDetailSchema, member);
};

export const changeMemberRole: RequestHandler = async (req, res) => {
  const params = TeamMemberParamsSchema.safeParse(req.params);
  const body = RoleChangePayloadSchema.safeParse(req.body);

  if (!params.success) {
    return sendInvalidRequest(res, "team member id", params.error.issues);
  }

  if (!body.success) {
    return sendInvalidRequest(res, "role change payload", body.error.issues);
  }

  const db = req.app.locals.db as DbClient;
  const existing = await db.user.findUnique({ where: { id: params.data.id } });

  if (!existing) {
    return sendNotFound(res, "Team member");
  }

  const updated = await db.user.update({
    where: { id: params.data.id },
    data: { role: body.data.role },
    include: { org: true },
  });

  await db.teamAuditLog.create({
    data: {
      actorId: params.data.id,
      targetUserId: params.data.id,
      orgId: existing.orgId,
      action: "ROLE_CHANGED",
      fromRole: existing.role,
      toRole: body.data.role,
      ...(body.data.reason ? { reason: body.data.reason } : {}),
    },
  });

  const member = await getMemberById(db, updated.id);

  return sendValidatedData(res, MemberDetailSchema, member);
};

export const moveMember: RequestHandler = (_req, res) => {
  return res.status(405).json({
    success: false,
    error: "Org moves are not supported",
  });
};

export const removeMember: RequestHandler = async (req, res) => {
  const params = TeamMemberParamsSchema.safeParse(req.params);
  const query = RemoveMemberParamsSchema.safeParse(req.query);

  if (!params.success) {
    return sendInvalidRequest(res, "team member id", params.error.issues);
  }

  if (!query.success) {
    return sendInvalidRequest(res, "remove member params", query.error.issues);
  }

  const db = req.app.locals.db as DbClient;
  const existing = await db.user.findUnique({ where: { id: params.data.id } });

  if (!existing) {
    return sendNotFound(res, "Team member");
  }

  await db.user.delete({ where: { id: params.data.id } });

  await db.teamAuditLog.create({
    data: {
      actorId: params.data.id,
      targetUserId: params.data.id,
      orgId: existing.orgId,
      action: "REMOVED",
      fromRole: existing.role,
    },
  });

  return sendValidatedData(res, BulkMemberResultSchema, {
    succeeded: [params.data.id],
    failed: [],
  });
};

export const bulkMembers: RequestHandler = async (req, res) => {
  const body = BulkMemberOpSchema.safeParse(req.body);

  if (!body.success) {
    return sendInvalidRequest(res, "bulk member payload", body.error.issues);
  }

  const db = req.app.locals.db as DbClient;
  const users = await db.user.findMany({
    where: { id: { in: body.data.ids } },
  });
  const knownIds = new Set(users.map((u) => u.id));
  const succeeded: string[] = [];
  const failed: { id: string; reason: string }[] = [];

  for (const id of body.data.ids) {
    if (!knownIds.has(id)) {
      failed.push({ id, reason: "Team member not found" });
      continue;
    }

    const user = users.find((u) => u.id === id)!;

    if (body.data.op === "remove") {
      await db.user.delete({ where: { id } });
      await db.teamAuditLog.create({
        data: {
          actorId: id,
          targetUserId: id,
          orgId: user.orgId,
          action: "REMOVED",
          fromRole: user.role,
        },
      });
    } else if (body.data.op === "change_role" && body.data.payload) {
      await db.user.update({
        where: { id },
        data: { role: body.data.payload.role },
      });
      await db.teamAuditLog.create({
        data: {
          actorId: id,
          targetUserId: id,
          orgId: user.orgId,
          action: "ROLE_CHANGED",
          fromRole: user.role,
          toRole: body.data.payload.role,
          ...(body.data.payload.reason ? { reason: body.data.payload.reason } : {}),
        },
      });
    }

    succeeded.push(id);
  }

  return sendValidatedData(res, BulkMemberResultSchema, { succeeded, failed });
};
