import { isAxiosError } from "axios";
import { api } from ".";

export interface VerifyInvitationResponse {
  success: boolean;
  email?: string;
  orgName?: string;
  error?: string;
}

const invalidInvitationMessage = "This invitation is invalid or has expired.";

/**
 * Public invitation acceptance API.
 *
 * Permission model enforced by the API:
 * - This route is not role-gated and does not require an authenticated session.
 * - Possession of a valid invitation token is the permission to accept it.
 * - The backend accepts only PENDING invitations whose token hash matches and
 *   whose expiresAt is still in the future.
 * - ACCEPTED, CANCELLED, EXPIRED, missing, and expired PENDING invitations all
 *   return the same invalid/expired error to avoid leaking invitation state.
 *
 * Frontend guidance:
 * - Do not use team invite-creation permissions here. SUPER_ADMIN/MODERATOR
 *   rules apply to creating/cancelling invitations, not accepting one.
 * - Always URL-encode the token before calling the route.
 * - The shared axios wrapper unwraps response.data, so verify resolves directly
 *   to VerifyInvitationResponse.
 */
export const invitationsApi = {
  /** Verify and accept an invitation token. On success the backend creates or
   * finds the invited DB user stub and marks the invitation ACCEPTED.
   */
  verify: (token: string): Promise<VerifyInvitationResponse> =>
    api.get<VerifyInvitationResponse>(
      `/invitations/${encodeURIComponent(token)}`,
    ),
};

export function getInvitationErrorMessage(error: unknown): string {
  if (isAxiosError<VerifyInvitationResponse>(error)) {
    return error.response?.data?.error ?? invalidInvitationMessage;
  }

  return "Something went wrong. Please try again.";
}
