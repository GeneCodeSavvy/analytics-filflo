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
  ensureOrgReadable,
  ensureRoleChangeAllowed,
  ensureTargetManageable,
  ensureTargetReadable,
  scopedOrgId,
  sendForbidden,
} from "./permissions";
import { getMemberById, getMembers } from "./data";
import { parseTeamMemberListParams } from "./utils";

export const getMembers_: RequestHandler = async (req, res) => {
  const params = parseTeamMemberListParams(req.query);

  if (!params.success) {
    return sendInvalidRequest(
      res,
      "team member list params",
      params.error.issues,
    );
  }

  const db = req.app.locals.db as DbClient;
  const actor = req.dbUser;

  if (!ensureOrgReadable(res, actor, params.data.orgId)) {
    return;
  }

  const { rows, total } = await getMembers(db, {
    ...params.data,
    orgId: scopedOrgId(actor, params.data.orgId),
  });

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
  const target = await db.user.findUnique({
    where: { id: params.data.id },
    select: { orgId: true },
  });

  if (!target) {
    return sendNotFound(res, "Team member");
  }

  if (!ensureTargetReadable(res, req.dbUser, target)) {
    return;
  }

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
  const actor = req.dbUser;
  const existing = await db.user.findUnique({ where: { id: params.data.id } });

  if (!existing) {
    return sendNotFound(res, "Team member");
  }

  if (!ensureTargetManageable(res, actor, existing)) {
    return;
  }
  if (!ensureRoleChangeAllowed(res, actor, body.data.role)) {
    return;
  }

  const updated = await db.user.update({
    where: { id: params.data.id },
    data: { role: body.data.role },
    include: { org: true },
  });

  await db.teamAuditLog.create({
    data: {
      actorId: actor.id,
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
  const actor = req.dbUser;
  const existing = await db.user.findUnique({ where: { id: params.data.id } });

  if (!existing) {
    return sendNotFound(res, "Team member");
  }

  if (!ensureTargetManageable(res, actor, existing)) {
    return;
  }

  await db.user.delete({ where: { id: params.data.id } });

  await db.teamAuditLog.create({
    data: {
      actorId: actor.id,
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
  const actor = req.dbUser;

  if (!body.data.ids.length) {
    return sendValidatedData(res, BulkMemberResultSchema, {
      succeeded: [],
      failed: [],
    });
  }

  if (!body.data.payload && body.data.op === "change_role") {
    return sendInvalidRequest(res, "bulk member payload", [
      {
        code: "custom",
        path: ["payload"],
        message: "Role change payload is required",
      },
    ]);
  }

  if (!body.data.ids.every((id) => id !== actor.id)) {
    return sendForbidden(res);
  }

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

    if (!ensureTargetManageable(res, actor, user)) {
      return;
    }

    if (body.data.op === "remove") {
      await db.user.delete({ where: { id } });
      await db.teamAuditLog.create({
        data: {
          actorId: actor.id,
          targetUserId: id,
          orgId: user.orgId,
          action: "REMOVED",
          fromRole: user.role,
        },
      });
    } else if (body.data.op === "change_role" && body.data.payload) {
      if (!ensureRoleChangeAllowed(res, actor, body.data.payload.role)) {
        return;
      }

      await db.user.update({
        where: { id },
        data: { role: body.data.payload.role },
      });
      await db.teamAuditLog.create({
        data: {
          actorId: actor.id,
          targetUserId: id,
          orgId: user.orgId,
          action: "ROLE_CHANGED",
          fromRole: user.role,
          toRole: body.data.payload.role,
          ...(body.data.payload.reason
            ? { reason: body.data.payload.reason }
            : {}),
        },
      });
    }

    succeeded.push(id);
  }

  return sendValidatedData(res, BulkMemberResultSchema, { succeeded, failed });
};
