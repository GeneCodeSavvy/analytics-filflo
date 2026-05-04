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
import { getAuditEntries, getInvitations, getOrgSummaries } from "./data";
import { parseTeamAuditParams, parseTeamInvitationListParams } from "./utils";
import { randomBytes, createHash } from "node:crypto";
import { sendInviteMail } from "../../lib/mail";
import {
  ensureInviteAllowed,
  ensureOrgReadable,
  scopedOrgId,
} from "./permissions";

const appBaseUrl = process.env.APP_BASE_URL ?? "http://localhost:5173";
const inviteExpiryDays = 7;

export const getInvitations_: RequestHandler = async (req, res) => {
  const params = parseTeamInvitationListParams(req.query);

  if (!params.success) {
    return sendInvalidRequest(
      res,
      "team invitation list params",
      params.error.issues,
    );
  }

  const db = req.app.locals.db as DbClient;
  const actor = req.dbUser;

  if (!ensureOrgReadable(res, actor, params.data.orgId)) {
    return;
  }

  const invitations = await getInvitations(db, {
    ...params.data,
    orgId: scopedOrgId(actor, params.data.orgId),
  });

  return sendValidatedData(res, InvitationSchema.array(), invitations);
};

export { getInvitations_ as getInvitations };

export const createInvitation: RequestHandler = async (req, res) => {
  const body = InvitePayloadSchema.safeParse(req.body);

  if (!body.success) {
    return sendInvalidRequest(res, "invite payload", body.error.issues);
  }

  const db = req.app.locals.db as DbClient;
  const actor = req.dbUser;

  if (!ensureInviteAllowed(res, actor, body.data.orgId, body.data.role)) {
    return;
  }

  const org = await db.org.findUnique({ where: { id: body.data.orgId } });

  if (!org) {
    return sendNotFound(res, "Org");
  }

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");

  const sentAt = new Date();
  const expiresAt = new Date(
    sentAt.getTime() + inviteExpiryDays * 24 * 60 * 60 * 1000,
  );

  const invitation = await db.invitation.create({
    data: {
      email: body.data.email,
      role: body.data.role,
      orgId: body.data.orgId,
      invitedById: actor.id,
      tokenHash,
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

  const inviteLink = `${appBaseUrl}/invitations/${rawToken}`;

  try {
    await sendInviteMail(
      [body.data.email],
      actor.displayName,
      org.displayName,
      inviteLink,
      invitation.id,
    );
  } catch {
    res
      .status(502)
      .json({ success: false, error: "Failed to send invitation email" });
    return;
  }

  return sendValidatedData(res, InvitationSchema, {
    id: invitation.id,
    email: invitation.email,
    role: invitation.role,
    orgId: invitation.orgId,
    orgName: invitation.org.displayName,
    invitedBy: {
      id: invitation.invitedBy.id,
      name: invitation.invitedBy.displayName,
    },
    sentAt: invitation.sentAt.toISOString(),
    expiresAt: invitation.expiresAt.toISOString(),
    status: invitation.status,
    inviteUrl: inviteLink,
  });
};

export const cancelInvitation: RequestHandler = async (req, res) => {
  const params = TeamInvitationParamsSchema.safeParse(req.params);

  if (!params.success) {
    return sendInvalidRequest(res, "team invitation id", params.error.issues);
  }

  const db = req.app.locals.db as DbClient;
  const actor = req.dbUser;
  const invitation = await db.invitation.findUnique({
    where: { id: params.data.id },
  });

  if (!invitation) {
    return sendNotFound(res, "Invitation");
  }

  if (!ensureInviteAllowed(res, actor, invitation.orgId, invitation.role)) {
    return;
  }

  await db.invitation.update({
    where: { id: params.data.id },
    data: { status: "CANCELLED" },
  });

  await db.teamAuditLog.create({
    data: {
      actorId: actor.id,
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
  const actor = req.dbUser;

  if (!ensureOrgReadable(res, actor, params.data.orgId)) {
    return;
  }

  const entries = await getAuditEntries(db, {
    ...params.data,
    orgId: scopedOrgId(actor, params.data.orgId),
  });

  return sendValidatedData(res, AuditEntrySchema.array(), entries);
};

export { getAuditEntries_ as getAuditEntries };

export const getOrgSummaries_: RequestHandler = async (_req, res) => {
  const db = _req.app.locals.db as DbClient;
  const summaries = await getOrgSummaries(db, scopedOrgId(_req.dbUser));

  return sendValidatedData(res, OrgSummarySchema.array(), summaries);
};

export { getOrgSummaries_ as getOrgSummaries };
