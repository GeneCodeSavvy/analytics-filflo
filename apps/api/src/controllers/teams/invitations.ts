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
import { auditEntries, orgSummaries } from "./data";
import {
  filterInvitations,
  getInvitationById,
  parseTeamAuditParams,
  parseTeamInvitationListParams,
} from "./utils";

export const getInvitations: RequestHandler = (req, res) => {
  const params = parseTeamInvitationListParams(req.query);

  if (!params.success) {
    return sendInvalidRequest(
      res,
      "team invitation list params",
      params.error.issues,
    );
  }

  return sendValidatedData(
    res,
    InvitationSchema.array(),
    filterInvitations(params.data),
    "Team invitation list dummy data",
  );
};

export const createInvitation: RequestHandler = (req, res) => {
  const body = InvitePayloadSchema.safeParse(req.body);

  if (!body.success) {
    return sendInvalidRequest(res, "invite payload", body.error.issues);
  }

  return sendValidatedData(
    res,
    InvitationSchema,
    {
      id: "inv-new",
      email: body.data.email,
      role: body.data.role,
      orgId: body.data.orgId,
      orgName: body.data.orgId === "org-nova" ? "Nova Retail" : "Acme Finance",
      invitedBy: {
        id: "usr-900",
        name: "Meera Iyer",
      },
      sentAt: "2026-05-02T09:45:00.000Z",
      expiresAt: "2026-05-09T09:45:00.000Z",
      status: "pending",
      inviteUrl: "https://app.filflo.example/invitations/inv-new",
    },
    "Created invitation dummy data",
  );
};

export const cancelInvitation: RequestHandler = (req, res) => {
  const params = TeamInvitationParamsSchema.safeParse(req.params);

  if (!params.success) {
    return sendInvalidRequest(res, "team invitation id", params.error.issues);
  }

  if (!getInvitationById(params.data.id)) {
    return sendNotFound(res, "Invitation");
  }

  return sendValidatedData(
    res,
    BulkMemberResultSchema,
    { succeeded: [params.data.id], failed: [] },
    "Cancel invitation dummy data",
  );
};

export const getAuditEntries: RequestHandler = (req, res) => {
  const params = parseTeamAuditParams(req.query);

  if (!params.success) {
    return sendInvalidRequest(res, "team audit params", params.error.issues);
  }

  const filtered = auditEntries
    .filter((entry) => params.data.orgId === undefined || entry.org.id === params.data.orgId)
    .slice(0, params.data.limit);

  return sendValidatedData(
    res,
    AuditEntrySchema.array(),
    filtered,
    "Team audit dummy data",
  );
};

export const getOrgSummaries: RequestHandler = (_req, res) => {
  return sendValidatedData(
    res,
    OrgSummarySchema.array(),
    orgSummaries,
    "Team org summary dummy data",
  );
};
