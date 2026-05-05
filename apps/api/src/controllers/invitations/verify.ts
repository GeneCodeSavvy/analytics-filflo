import { createHash } from "node:crypto";
import type { RequestHandler, Response } from "express";
import type { DbClient } from "../../lib/db";
import { getInvitationVerificationDecision } from "./permissions";

const invalidInvitationError = "Invalid or expired invitation";

const sendInvalidInvitation = (res: Response) => {
  res.status(400).json({ success: false, error: invalidInvitationError });
};

export const verifyInvitation: RequestHandler = async (req, res) => {
  const { token } = req.params;

  if (!token || typeof token !== "string") {
    res.status(400).json({ success: false, error: "Missing token" });
    return;
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const db = req.app.locals.db as DbClient;

  let invitation:
    | (Awaited<ReturnType<typeof db.invitation.findUnique>> & {
        org: { displayName: string };
      })
    | null;

  try {
    invitation = (await db.invitation.findUnique({
      where: { tokenHash },
      include: { org: true },
    })) as typeof invitation;
  } catch {
    res.status(500).json({ success: false, error: "Internal error" });
    return;
  }

  if (!invitation) {
    sendInvalidInvitation(res);
    return;
  }

  const decision = getInvitationVerificationDecision(invitation);

  if (!decision.allowed && decision.shouldMarkExpired) {
    try {
      await db.invitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" },
      });
    } catch {
      // Best-effort expiry update — don't block the response
    }
  }

  if (!decision.allowed) {
    sendInvalidInvitation(res);
    return;
  }

  try {
    const existingUser = await db.user.findFirst({
      where: { email: invitation.email, orgId: invitation.orgId },
    });

    if (!existingUser) {
      await db.user.create({
        data: {
          email: invitation.email,
          displayName: invitation.email,
          role: invitation.role,
          orgId: invitation.orgId,
          clerkUserId: null,
        },
      });
    }

    await db.invitation.update({
      where: { id: invitation.id },
      data: { status: "ACCEPTED", acceptedAt: new Date() },
    });
  } catch {
    res.status(500).json({ success: false, error: "Internal error" });
    return;
  }

  res.json({
    success: true,
    email: invitation.email,
    orgName: invitation.org.displayName,
  });
};
