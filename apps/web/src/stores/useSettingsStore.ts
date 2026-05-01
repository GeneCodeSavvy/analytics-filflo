interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  timezone: string;
  role: string;
}

interface ConnectedProvider {
  provider: "github" | "google";
  connected: boolean;
  accountIdentifier?: string;
}

interface ActiveSession {
  id: string;
  deviceDescription: string;
  locationCity?: string;
  lastActiveAt: string;
  isCurrent: boolean;
}

interface NotificationPreference {
  type: string;
  inApp: boolean;
  email: boolean;
}

interface QuietHours {
  enabled: boolean;
  from: string; // "HH:mm"
  to: string;
  timezone: string;
}

interface OrgSettingsData {
  orgId: string;
  orgName: string;
  orgLogoUrl?: string;
  defaultCategories: string[];
  defaultPriority: "HIGH" | "MEDIUM" | "LOW";
}

export interface SettingsState {
  // Profile
  profile: UserProfile | null;
  // Security
  connectedProviders: ConnectedProvider[];
  activeSessions: ActiveSession[];
  // Notifications
  notificationPreferences: NotificationPreference[];
  quietHours: QuietHours | null;
  mutedTickets: { id: string; subject: string }[];
  // Org
  orgSettings: OrgSettingsData | null;
  // UI
  saving: Record<string, boolean>; // keyed by section
  errors: Record<string, string | null>;

  // Profile
  setProfile: (profile: UserProfile) => void;
  updateDisplayName: (name: string) => void;
  updateTimezone: (tz: string) => void;
  uploadAvatar: (file: File) => void;

  // Security
  setConnectedProviders: (providers: ConnectedProvider[]) => void;
  setActiveSessions: (sessions: ActiveSession[]) => void;
  changePassword: (current: string, next: string) => void;
  connectOAuthProvider: (provider: "github" | "google") => void;
  disconnectOAuthProvider: (provider: string) => void;
  logoutSession: (sessionId: string) => void;
  logoutAllSessions: () => void;

  // Notifications
  setNotificationPreferences: (prefs: NotificationPreference[]) => void;
  toggleNotificationType: (type: string, channel: "inApp" | "email") => void;
  setQuietHours: (qh: QuietHours) => void;
  muteTicket: (id: string, subject: string) => void;
  unmuteTicket: (id: string) => void;

  // Appearance — delegates to useUIStore
  // (theme and density live in useUIStore, settings page reads/writes there)

  // Org
  setOrgSettings: (settings: OrgSettingsData) => void;
  updateOrgName: (name: string) => void;
  uploadOrgLogo: (file: File) => void;
  updateDefaultCategories: (categories: string[]) => void;
  updateDefaultPriority: (priority: string) => void;

  // Danger
  initiateAccountDeletion: () => void;
  confirmAccountDeletion: (emailConfirmation: string) => void;
}
