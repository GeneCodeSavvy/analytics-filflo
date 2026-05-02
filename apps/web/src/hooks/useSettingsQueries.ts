import { useQuery, useQueryClient } from "@tanstack/react-query";
import { settingsApi } from "../api/settingsApi";
import { settingsKeys } from "../lib/settingsParams";
import { useAuthState } from "../stores/useAuthStore";
import type {
  UserProfile,
  ConnectedProvider,
  ActiveSession,
  NotificationSettings,
  AppearanceSettings,
  OrgSettings,
} from "../lib/settingsParams";

export function useProfileQuery() {
  return useQuery<UserProfile>({
    queryKey: settingsKeys.profile(),
    queryFn: ({ signal }) => settingsApi.getProfile(signal),
    staleTime: 5 * 60 * 1000,
  });
}

// Providers and sessions share one network call but have separate cache entries.
// Use usePrefetchSecurityInfo to warm both from one response if needed.
export function useConnectedProvidersQuery() {
  return useQuery<ConnectedProvider[]>({
    queryKey: settingsKeys.security.providers(),
    queryFn: async ({ signal }) => {
      const info = await settingsApi.getSecurityInfo(signal);
      return info.providers;
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useActiveSessionsQuery() {
  return useQuery<ActiveSession[]>({
    queryKey: settingsKeys.security.sessions(),
    queryFn: async ({ signal }) => {
      const info = await settingsApi.getSecurityInfo(signal);
      return info.sessions;
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useNotificationSettingsQuery() {
  return useQuery<NotificationSettings>({
    queryKey: settingsKeys.notifications(),
    queryFn: ({ signal }) => settingsApi.getNotificationSettings(signal),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAppearanceSettingsQuery() {
  return useQuery<AppearanceSettings>({
    queryKey: settingsKeys.appearance(),
    queryFn: ({ signal }) => settingsApi.getAppearanceSettings(signal),
    staleTime: 10 * 60 * 1000,
  });
}

export function useOrgSettingsQuery() {
  const user = useAuthState((s) => s.user);

  return useQuery<OrgSettings>({
    queryKey: settingsKeys.org(),
    queryFn: ({ signal }) => settingsApi.getOrgSettings(signal),
    enabled: user?.role === "SUPER_ADMIN",
    staleTime: 5 * 60 * 1000,
  });
}

// Convenience hook: warms both security cache entries from a single API call.
// Call this on Security section mount instead of calling both hooks separately.
export function usePrefetchSecurityInfo() {
  const queryClient = useQueryClient();

  return async () => {
    const info = await settingsApi.getSecurityInfo();
    queryClient.setQueryData(settingsKeys.security.providers(), info.providers);
    queryClient.setQueryData(settingsKeys.security.sessions(), info.sessions);
  };
}
