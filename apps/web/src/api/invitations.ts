import { isAxiosError } from "axios";
import { api } from ".";

export interface VerifyInvitationResponse {
  success: boolean;
  email?: string;
  orgName?: string;
  error?: string;
}

const invalidInvitationMessage = "This invitation is invalid or has expired.";

export const invitationsApi = {
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
