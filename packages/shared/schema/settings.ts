import { z } from "zod";
import { TeamRoleSchema } from "./teams";

// ─── Enums ───────────────────────────────────────────────────────────────────

export const RoleSchema = TeamRoleSchema;

export const ThemeSchema = z.enum(["light", "dark", "system"]);
export const DensitySchema = z.enum(["comfortable", "compact"]);
export const OAuthProviderSchema = z.enum(["github", "google"]);
export const DefaultPrioritySchema = z.enum(["HIGH", "MEDIUM", "LOW"]);

export const NotificationTypeSchema = z.enum([
  "ticket_assigned",
  "review_requested",
  "ticket_invitation",
  "mention",
  "ticket_resolved",
  "ticket_closed",
  "new_ticket_in_org",
  "message_activity",
]);

// ─── Response Schemas ─────────────────────────────────────────────────────────

export const UserProfileSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  email: z.string().email(),
  avatarUrl: z.string().url().optional(),
  timezone: z.string(),
  role: RoleSchema,
});

export const AvatarUploadResponseSchema = z.object({
  avatarUrl: z.string().url(),
});

export const ConnectedProviderSchema = z.object({
  provider: OAuthProviderSchema,
  connected: z.boolean(),
  accountIdentifier: z.string().optional(),
});

export const ActiveSessionSchema = z.object({
  id: z.string(),
  deviceDescription: z.string(),
  locationCity: z.string().optional(),
  lastActiveAt: z.string(),
  isCurrent: z.boolean(),
});

export const SecurityInfoSchema = z.object({
  providers: ConnectedProviderSchema.array(),
  sessions: ActiveSessionSchema.array(),
});

export const NotificationPreferenceSchema = z.object({
  type: NotificationTypeSchema,
  inApp: z.boolean(),
  email: z.boolean(),
});

const TimeStringSchema = z.string()
  .regex(/^\d{2}:\d{2}$/)
  .refine((t) => {
    const [h, m] = t.split(":").map(Number);
    return (h ?? 0) >= 0 && (h ?? 0) <= 23 && (m ?? 0) >= 0 && (m ?? 0) <= 59;
  });

export const QuietHoursSchema = z.object({
  enabled: z.boolean(),
  from: TimeStringSchema,
  to: TimeStringSchema,
  timezone: z.string(),
});

export const MutedTicketSchema = z.object({
  id: z.string(),
  subject: z.string(),
});

export const NotificationSettingsSchema = z.object({
  preferences: NotificationPreferenceSchema.array(),
  quietHours: QuietHoursSchema,
  mutedTickets: MutedTicketSchema.array(),
});

export const AppearanceSettingsSchema = z.object({
  theme: ThemeSchema,
  density: DensitySchema,
});

export const OrgSettingsSchema = z.object({
  orgId: z.string(),
  orgName: z.string(),
  orgLogoUrl: z.string().url().optional(),
  defaultCategories: z.string().array(),
  defaultPriority: DefaultPrioritySchema,
});

export const OrgLogoUploadResponseSchema = z.object({
  orgLogoUrl: z.string().url(),
});

// ─── Request / Payload Schemas ────────────────────────────────────────────────

export const UpdateProfilePayloadSchema = z.object({
  displayName: z.string().min(1).optional(),
  timezone: z.string().optional(),
});

// Discriminated union: "change" requires currentPassword; "set" (first time) omits it
export const ChangePasswordPayloadSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("change"),
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
  }),
  z.object({
    mode: z.literal("set"),
    newPassword: z.string().min(8),
  }),
]);

export const UpdateNotificationSettingsPayloadSchema = z.object({
  preferences: NotificationPreferenceSchema.array().optional(),
  quietHours: QuietHoursSchema.optional(),
  mutedTicketIds: z.string().array().optional(),
});

export const UpdateAppearancePayloadSchema = z.object({
  theme: ThemeSchema.optional(),
  density: DensitySchema.optional(),
});

export const UpdateOrgSettingsPayloadSchema = z.object({
  orgName: z.string().min(1).optional(),
  defaultCategories: z.string().array().optional(),
  defaultPriority: DefaultPrioritySchema.optional(),
});

export const DeleteAccountPayloadSchema = z.object({
  emailConfirmation: z.string().email(),
});

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type Role = z.infer<typeof RoleSchema>;
export type Theme = z.infer<typeof ThemeSchema>;
export type Density = z.infer<typeof DensitySchema>;
export type OAuthProvider = z.infer<typeof OAuthProviderSchema>;
export type NotificationType = z.infer<typeof NotificationTypeSchema>;

export type UserProfile = z.infer<typeof UserProfileSchema>;
export type AvatarUploadResponse = z.infer<typeof AvatarUploadResponseSchema>;
export type ConnectedProvider = z.infer<typeof ConnectedProviderSchema>;
export type ActiveSession = z.infer<typeof ActiveSessionSchema>;
export type SecurityInfo = z.infer<typeof SecurityInfoSchema>;
export type NotificationPreference = z.infer<typeof NotificationPreferenceSchema>;
export type QuietHours = z.infer<typeof QuietHoursSchema>;
export type MutedTicket = z.infer<typeof MutedTicketSchema>;
export type NotificationSettings = z.infer<typeof NotificationSettingsSchema>;
export type AppearanceSettings = z.infer<typeof AppearanceSettingsSchema>;
export type OrgSettings = z.infer<typeof OrgSettingsSchema>;
export type OrgLogoUploadResponse = z.infer<typeof OrgLogoUploadResponseSchema>;

export type UpdateProfilePayload = z.infer<typeof UpdateProfilePayloadSchema>;
export type ChangePasswordPayload = z.infer<typeof ChangePasswordPayloadSchema>;
export type UpdateNotificationSettingsPayload = z.infer<typeof UpdateNotificationSettingsPayloadSchema>;
export type UpdateAppearancePayload = z.infer<typeof UpdateAppearancePayloadSchema>;
export type UpdateOrgSettingsPayload = z.infer<typeof UpdateOrgSettingsPayloadSchema>;
export type DeleteAccountPayload = z.infer<typeof DeleteAccountPayloadSchema>;
