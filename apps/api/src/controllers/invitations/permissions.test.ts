import assert from "node:assert/strict";
import { InvitationStatus } from "@prisma/client";
import { getInvitationVerificationDecision } from "./permissions";

const now = new Date("2026-05-05T00:00:00.000Z");
const future = new Date("2026-05-06T00:00:00.000Z");
const past = new Date("2026-05-04T00:00:00.000Z");

assert.deepEqual(
  getInvitationVerificationDecision(
    { status: InvitationStatus.PENDING, expiresAt: future },
    now,
  ),
  { allowed: true },
);

assert.deepEqual(
  getInvitationVerificationDecision(
    { status: InvitationStatus.ACCEPTED, expiresAt: future },
    now,
  ),
  { allowed: false, shouldMarkExpired: false },
);

assert.deepEqual(
  getInvitationVerificationDecision(
    { status: InvitationStatus.PENDING, expiresAt: past },
    now,
  ),
  { allowed: false, shouldMarkExpired: true },
);
