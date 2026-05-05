import { InvitationStatus } from "@prisma/client";

export type InvitationVerificationTarget = {
  status: InvitationStatus;
  expiresAt: Date;
};

export type InvitationVerificationDecision =
  | { allowed: true }
  | { allowed: false; shouldMarkExpired: boolean };

export const getInvitationVerificationDecision = (
  invitation: InvitationVerificationTarget,
  now = new Date(),
): InvitationVerificationDecision => {
  if (invitation.status !== InvitationStatus.PENDING) {
    return { allowed: false, shouldMarkExpired: false };
  }

  if (invitation.expiresAt < now) {
    return { allowed: false, shouldMarkExpired: true };
  }

  return { allowed: true };
};
