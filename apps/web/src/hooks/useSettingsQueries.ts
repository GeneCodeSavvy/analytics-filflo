import { useQuery, useQueryClient, useCallback } from "@tanstack/react-query";
import { settingsApi } from "../api/settingsApi";
import { settingsKeys } from "../lib/settingsParams";
import { useAuthState } from "../stores/useAuthStore";
import type {
  UserProfile,
  ConnectedProvider,
  ActiveSession,
  SecurityInfo,
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

// Single query for security info — providers and sessions share one fetch.
// useConnectedProvidersQuery and useActiveSessionsQuery use `select` to derive
// their slices from this shared cache entry. TanStack Query deduplicates the request.
function useSecurityInfoQuery() {
  return useQuery<SecurityInfo>({
    queryKey: settingsKeys.security.all(),
    queryFn: ({ signal }) => settingsApi.getSecurityInfo(signal),
    staleTime: 2 * 60 * 1000,
  });
}

export function useConnectedProvidersQuery() {
  return useQuery<SecurityInfo, Error, ConnectedProvider[]>({
    queryKey: settingsKeys.security.all(),
    queryFn: ({ signal }) => settingsApi.getSecurityInfo(signal),
    select: (info) => info.providers,
    staleTime: 2 * 60 * 1000,
  });
}

export function useActiveSessionsQuery() {
  return useQuery<SecurityInfo, Error, ActiveSession[]>({
    queryKey: settingsKeys.security.all(),
    queryFn: ({ signal }) => settingsApi.getSecurityInfo(signal),
    select: (info) => info.sessions,
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

// Prefetch helper — memoized to be safe in useEffect dep arrays.
export function usePrefetchSecurityInfo() {
  const queryClient = useQueryClient();

  return useCallback(async () => {
    await queryClient.prefetchQuery({
      queryKey: settingsKeys.security.all(),
      queryFn: () => settingsApi.getSecurityInfo(),
      staleTime: 2 * 60 * 1000,
    });
  }, [queryClient]);
}
