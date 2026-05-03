import { createHash } from "node:crypto";
import type { RequestHandler } from "express";
import type { DbClient } from "../../lib/db";

export const verifyInvitation: RequestHandler = async (req, res) => {
  const { token } = req.params;

  if (!token || typeof token !== "string") {
    res.status(400).json({ success: false, error: "Missing token" });
    return;
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const db = req.app.locals.db as DbClient;

  const invitation = await db.invitation.findUnique({
    where: { tokenHash },
    include: { org: true },
  });

  if (!invitation) {
    res.status(404).json({ success: false, error: "Invalid invitation" });
    return;
  }

  if (invitation.status !== "PENDING") {
    res.status(400).json({ success: false, error: "Invitation already used or cancelled" });
    return;
  }

  if (invitation.expiresAt < new Date()) {
    await db.invitation.update({
      where: { id: invitation.id },
      data: { status: "EXPIRED" },
    });
    res.status(400).json({ success: false, error: "Invitation expired" });
    return;
  }

  // Idempotency: skip creation if stub user already exists for this email+org
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

  res.json({
    success: true,
    email: invitation.email,
    orgName: invitation.org.displayName,
  });
};
