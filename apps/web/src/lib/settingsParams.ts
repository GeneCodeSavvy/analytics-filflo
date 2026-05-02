// Re-export all settings schemas and types from shared
export {
  RoleSchema,
  ThemeSchema,
  DensitySchema,
  OAuthProviderSchema,
  DefaultPrioritySchema,
  NotificationTypeSchema,
  UserProfileSchema,
  AvatarUploadResponseSchema,
  ConnectedProviderSchema,
  ActiveSessionSchema,
  SecurityInfoSchema,
  NotificationPreferenceSchema,
  QuietHoursSchema,
  MutedTicketSchema,
  NotificationSettingsSchema,
  AppearanceSettingsSchema,
  OrgSettingsSchema,
  OrgLogoUploadResponseSchema,
  UpdateProfilePayloadSchema,
  ChangePasswordPayloadSchema,
  UpdateNotificationSettingsPayloadSchema,
  UpdateAppearancePayloadSchema,
  UpdateOrgSettingsPayloadSchema,
  DeleteAccountPayloadSchema,
} from "@shared/schema";

export type {
  Role,
  Theme,
  Density,
  OAuthProvider,
  NotificationType,
  UserProfile,
  AvatarUploadResponse,
  ConnectedProvider,
  ActiveSession,
  SecurityInfo,
  NotificationPreference,
  QuietHours,
  MutedTicket,
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
} from "@shared/schema";

import { z } from "zod";

// ─── UI-only enum (settings sidebar sections) ─────────────────────────────────

export const SettingsSectionSchema = z.enum([
  "profile",
  "security",
  "notifications",
  "appearance",
  "org",
  "danger",
]);

export type SettingsSection = z.infer<typeof SettingsSectionSchema>;

// ─── Query Key Factory ────────────────────────────────────────────────────────

export const settingsKeys = {
  all: () => ["settings"] as const,
  profile: () => ["settings", "profile"] as const,
  security: {
    all: () => ["settings", "security"] as const,
    providers: () => ["settings", "security", "providers"] as const,
    sessions: () => ["settings", "security", "sessions"] as const,
  },
  notifications: () => ["settings", "notifications"] as const,
  appearance: () => ["settings", "appearance"] as const,
  org: () => ["settings", "org"] as const,
};
