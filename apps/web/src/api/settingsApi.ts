import { api } from ".";
import {
  UserProfileSchema,
  AvatarUploadResponseSchema,
  SecurityInfoSchema,
  NotificationSettingsSchema,
  AppearanceSettingsSchema,
  OrgSettingsSchema,
  OrgLogoUploadResponseSchema,
} from "../lib/settingsParams";
import type {
  UserProfile,
  AvatarUploadResponse,
  SecurityInfo,
  NotificationSettings,
  AppearanceSettings,
  OrgSettings,
  OrgLogoUploadResponse,
  UpdateProfilePayload,
  ChangePasswordPayload,
  UpdateNotificationSettingsPayload,
  UpdateAppearancePayload,
  UpdateOrgSettingsPayload,
  DeleteAccountPayload,
  OAuthProvider,
} from "../lib/settingsParams";

export const settingsApi = {
  // ─── Profile ───────────────────────────────────────────────────────────────

  getProfile: async (signal?: AbortSignal): Promise<UserProfile> => {
    const data = await api.get<UserProfile>("/settings/profile", { signal });
    return UserProfileSchema.parse(data);
  },

  updateProfile: async (payload: UpdateProfilePayload): Promise<UserProfile> => {
    const data = await api.patch<UserProfile>("/settings/profile", payload);
    return UserProfileSchema.parse(data);
  },

  // Returns only the new avatar URL — not the full profile
  uploadAvatar: async (file: File): Promise<AvatarUploadResponse> => {
    const form = new FormData();
    form.append("avatar", file);
    const data = await api.post<AvatarUploadResponse>("/settings/profile/avatar", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return AvatarUploadResponseSchema.parse(data);
  },

  deleteAvatar: async (): Promise<void> => {
    await api.delete("/settings/profile/avatar");
  },

  // ─── Security ──────────────────────────────────────────────────────────────

  // Returns both providers and sessions — split into separate cache keys by the query hooks
  getSecurityInfo: async (signal?: AbortSignal): Promise<SecurityInfo> => {
    const data = await api.get<SecurityInfo>("/settings/security", { signal });
    return SecurityInfoSchema.parse(data);
  },

  // Initiates OAuth connect — returns redirect URL to navigate the browser to
  getOAuthConnectUrl: async (provider: OAuthProvider): Promise<{ redirectUrl: string }> => {
    const data = await api.post<{ redirectUrl: string }>(
      `/settings/security/oauth/${provider}/connect`,
    );
    return data as { redirectUrl: string };
  },

  disconnectProvider: async (provider: OAuthProvider): Promise<void> => {
    await api.delete(`/settings/security/oauth/${provider}`);
  },

  changePassword: async (payload: ChangePasswordPayload): Promise<void> => {
    await api.post("/settings/security/password", payload);
  },

  revokeSession: async (sessionId: string): Promise<void> => {
    await api.delete(`/settings/security/sessions/${sessionId}`);
  },

  revokeAllSessions: async (): Promise<void> => {
    await api.delete("/settings/security/sessions");
  },

  // ─── Notifications ─────────────────────────────────────────────────────────

  getNotificationSettings: async (signal?: AbortSignal): Promise<NotificationSettings> => {
    const data = await api.get<NotificationSettings>("/settings/notifications", { signal });
    return NotificationSettingsSchema.parse(data);
  },

  updateNotificationSettings: async (
    payload: UpdateNotificationSettingsPayload,
  ): Promise<NotificationSettings> => {
    const data = await api.patch<NotificationSettings>("/settings/notifications", payload);
    return NotificationSettingsSchema.parse(data);
  },

  // ─── Appearance ────────────────────────────────────────────────────────────

  getAppearanceSettings: async (signal?: AbortSignal): Promise<AppearanceSettings> => {
    const data = await api.get<AppearanceSettings>("/settings/appearance", { signal });
    return AppearanceSettingsSchema.parse(data);
  },

  updateAppearanceSettings: async (
    payload: UpdateAppearancePayload,
  ): Promise<AppearanceSettings> => {
    const data = await api.patch<AppearanceSettings>("/settings/appearance", payload);
    return AppearanceSettingsSchema.parse(data);
  },

  // ─── Org Settings (SUPER_ADMIN only) ───────────────────────────────────────

  getOrgSettings: async (signal?: AbortSignal): Promise<OrgSettings> => {
    const data = await api.get<OrgSettings>("/settings/org", { signal });
    return OrgSettingsSchema.parse(data);
  },

  updateOrgSettings: async (payload: UpdateOrgSettingsPayload): Promise<OrgSettings> => {
    const data = await api.patch<OrgSettings>("/settings/org", payload);
    return OrgSettingsSchema.parse(data);
  },

  // Returns only the new logo URL — not full OrgSettings
  uploadOrgLogo: async (file: File): Promise<OrgLogoUploadResponse> => {
    const form = new FormData();
    form.append("logo", file);
    const data = await api.post<OrgLogoUploadResponse>("/settings/org/logo", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return OrgLogoUploadResponseSchema.parse(data);
  },

  // ─── Danger Zone ───────────────────────────────────────────────────────────

  // POST (not DELETE) — body always safe on POST; deletion is a workflow, not a resource removal
  deleteAccount: async (payload: DeleteAccountPayload): Promise<void> => {
    await api.post("/settings/account/deletion-requests", payload);
  },
};
