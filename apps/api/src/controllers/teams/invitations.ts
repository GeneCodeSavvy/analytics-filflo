import {
  AuditEntrySchema,
  BulkMemberResultSchema,
  InvitationSchema,
  OrgSummarySchema,
  TeamInvitationParamsSchema,
} from "@shared/schema/teams";
import { InvitePayloadSchema } from "@shared/schema/teams";
import type { RequestHandler } from "express";
import {
  sendInvalidRequest,
  sendNotFound,
  sendValidatedData,
} from "../../lib/controllers";
import type { DbClient } from "../../lib/db";
import {
  getAuditEntries,
  getInvitations,
  getOrgSummaries,
} from "./data";
import {
  parseTeamAuditParams,
  parseTeamInvitationListParams,
} from "./utils";

const appBaseUrl = process.env.APP_BASE_URL ?? "https://app.filflo.example";
const inviteExpiryDays = 7;

export const getInvitations_: RequestHandler = async (req, res) => {
  const params = parseTeamInvitationListParams(req.query);

  if (!params.success) {
    return sendInvalidRequest(res, "team invitation list params", params.error.issues);
  }

  const db = req.app.locals.db as DbClient;
  const invitations = await getInvitations(db, params.data);

  return sendValidatedData(res, InvitationSchema.array(), invitations);
};

export { getInvitations_ as getInvitations };

export const createInvitation: RequestHandler = async (req, res) => {
  const body = InvitePayloadSchema.safeParse(req.body);

  if (!body.success) {
    return sendInvalidRequest(res, "invite payload", body.error.issues);
  }

  const db = req.app.locals.db as DbClient;
  const org = await db.org.findUnique({ where: { id: body.data.orgId } });

  if (!org) {
    return sendNotFound(res, "Org");
  }

  // TODO: replace with actual authenticated actor id from session
  const actor = await db.user.findFirst({ where: { role: "ADMIN" } });

  if (!actor) {
    return sendNotFound(res, "Actor");
  }

  const sentAt = new Date();
  const expiresAt = new Date(sentAt.getTime() + inviteExpiryDays * 24 * 60 * 60 * 1000);

  const invitation = await db.invitation.create({
    data: {
      email: body.data.email,
      role: body.data.role,
      orgId: body.data.orgId,
      invitedById: actor.id,
      sentAt,
      expiresAt,
      ...(body.data.message ? { message: body.data.message } : {}),
    },
    include: { org: true, invitedBy: true },
  });

  await db.teamAuditLog.create({
    data: {
      actorId: actor.id,
      targetEmail: body.data.email,
      orgId: body.data.orgId,
      action: "INVITED",
      toRole: body.data.role,
    },
  });

  return sendValidatedData(res, InvitationSchema, {
    id: invitation.id,
    email: invitation.email,
    role: invitation.role,
    orgId: invitation.orgId,
    orgName: invitation.org.displayName,
    invitedBy: { id: invitation.invitedBy.id, name: invitation.invitedBy.displayName },
    sentAt: invitation.sentAt.toISOString(),
    expiresAt: invitation.expiresAt.toISOString(),
    status: invitation.status,
    inviteUrl: `${appBaseUrl}/invitations/${invitation.id}`,
  });
};

export const cancelInvitation: RequestHandler = async (req, res) => {
  const params = TeamInvitationParamsSchema.safeParse(req.params);

  if (!params.success) {
    return sendInvalidRequest(res, "team invitation id", params.error.issues);
  }

  const db = req.app.locals.db as DbClient;
  const invitation = await db.invitation.findUnique({
    where: { id: params.data.id },
  });

  if (!invitation) {
    return sendNotFound(res, "Invitation");
  }

  await db.invitation.update({
    where: { id: params.data.id },
    data: { status: "CANCELLED" },
  });

  await db.teamAuditLog.create({
    data: {
      actorId: invitation.invitedById,
      targetEmail: invitation.email,
      orgId: invitation.orgId,
      action: "INVITATION_CANCELLED",
    },
  });

  return sendValidatedData(res, BulkMemberResultSchema, {
    succeeded: [params.data.id],
    failed: [],
  });
};

export const getAuditEntries_: RequestHandler = async (req, res) => {
  const params = parseTeamAuditParams(req.query);

  if (!params.success) {
    return sendInvalidRequest(res, "team audit params", params.error.issues);
  }

  const db = req.app.locals.db as DbClient;
  const entries = await getAuditEntries(db, params.data);

  return sendValidatedData(res, AuditEntrySchema.array(), entries);
};

export { getAuditEntries_ as getAuditEntries };

export const getOrgSummaries_: RequestHandler = async (_req, res) => {
  const db = _req.app.locals.db as DbClient;
  const summaries = await getOrgSummaries(db);

  return sendValidatedData(res, OrgSummarySchema.array(), summaries);
};

export { getOrgSummaries_ as getOrgSummaries };
