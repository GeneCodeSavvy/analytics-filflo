import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { settingsApi } from "../api/settingsApi";
import { settingsKeys } from "../lib/settingsParams";
import { useSettingsStore } from "../stores/useSettingsStore";
import { useUIStore } from "../stores/useUIStore";
import type {
  UserProfile,
  AvatarUploadResponse,
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

// ─── Profile ───────────────────────────────────────────────────────────────────

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation<UserProfile, Error, UpdateProfilePayload>({
    mutationFn: (payload) => settingsApi.updateProfile(payload),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.profile() });
    },
    onSuccess: () => {
      useSettingsStore.getState().markSectionClean("profile");
    },
  });
}

export function useUploadAvatarMutation() {
  const queryClient = useQueryClient();

  return useMutation<AvatarUploadResponse, Error, File>({
    mutationFn: (file) => settingsApi.uploadAvatar(file),
    onSuccess: ({ avatarUrl }) => {
      // Surgical cache update — no need to refetch the full profile
      queryClient.setQueryData<UserProfile>(
        settingsKeys.profile(),
        (old) => old ? { ...old, avatarUrl } : old,
      );
    },
  });
}

export function useDeleteAvatarMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: () => settingsApi.deleteAvatar(),
    onSuccess: () => {
      queryClient.setQueryData<UserProfile>(
        settingsKeys.profile(),
        (old) => old ? { ...old, avatarUrl: undefined } : old,
      );
    },
  });
}

// ─── Security ──────────────────────────────────────────────────────────────────

export function useChangePasswordMutation() {
  // No cache to invalidate — password is write-only.
  // Component passes onSuccess callback to reset its local form state.
  return useMutation<void, Error, ChangePasswordPayload>({
    mutationFn: (payload) => settingsApi.changePassword(payload),
  });
}

// Not a useMutation — OAuth connect is a navigation with side state, not a cache operation.
// Call this function directly: it sets the pending flag then navigates to the OAuth URL.
export function useInitiateOAuthConnect() {
  const setOAuthRedirectPending = useSettingsStore(
    (s) => s.setOAuthRedirectPending,
  );

  return async (provider: OAuthProvider) => {
    setOAuthRedirectPending(provider);
    const { redirectUrl } = await settingsApi.getOAuthConnectUrl(provider);
    window.location.href = redirectUrl;
  };
}

export function useDisconnectProviderMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, OAuthProvider>({
    mutationFn: (provider) => settingsApi.disconnectProvider(provider),
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: settingsKeys.security.providers(),
      });
    },
  });
}

export function useRevokeSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (sessionId) => settingsApi.revokeSession(sessionId),
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: settingsKeys.security.sessions(),
      });
    },
  });
}

export function useRevokeAllSessionsMutation() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation<void, Error, void>({
    mutationFn: () => settingsApi.revokeAllSessions(),
    onSuccess: () => {
      queryClient.clear();
      navigate("/login");
    },
  });
}

// ─── Notifications ─────────────────────────────────────────────────────────────

export function useUpdateNotificationsMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    NotificationSettings,
    Error,
    UpdateNotificationSettingsPayload
  >({
    mutationFn: (payload) => settingsApi.updateNotificationSettings(payload),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.notifications() });
    },
    onSuccess: () => {
      useSettingsStore.getState().markSectionClean("notifications");
    },
  });
}

// ─── Appearance ────────────────────────────────────────────────────────────────

export function useUpdateAppearanceMutation() {
  const queryClient = useQueryClient();

  return useMutation<AppearanceSettings, Error, UpdateAppearancePayload>({
    mutationFn: (payload) => settingsApi.updateAppearanceSettings(payload),

    // Optimistic update: apply to useUIStore immediately so CSS reflects the change
    onMutate: async (newValues) => {
      await queryClient.cancelQueries({ queryKey: settingsKeys.appearance() });
      const snapshot = queryClient.getQueryData<AppearanceSettings>(
        settingsKeys.appearance(),
      );
      // Apply optimistically to both query cache and UIStore
      queryClient.setQueryData<AppearanceSettings>(
        settingsKeys.appearance(),
        (old) => old ? { ...old, ...newValues } : old,
      );
      if (newValues.theme) useUIStore.getState().setTheme(newValues.theme);
      if (newValues.density) useUIStore.getState().setDensity(newValues.density);
      return { snapshot };
    },

    // Rollback on error
    onError: (_err, _vars, context) => {
      const ctx = context as { snapshot?: AppearanceSettings } | undefined;
      if (ctx?.snapshot) {
        queryClient.setQueryData(settingsKeys.appearance(), ctx.snapshot);
        useUIStore.getState().setTheme(ctx.snapshot.theme);
        useUIStore.getState().setDensity(ctx.snapshot.density);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.appearance() });
    },
  });
}

// ─── Org Settings ──────────────────────────────────────────────────────────────

export function useUpdateOrgSettingsMutation() {
  const queryClient = useQueryClient();

  return useMutation<OrgSettings, Error, UpdateOrgSettingsPayload>({
    mutationFn: (payload) => settingsApi.updateOrgSettings(payload),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.org() });
    },
    onSuccess: () => {
      useSettingsStore.getState().markSectionClean("org");
    },
  });
}

export function useUploadOrgLogoMutation() {
  const queryClient = useQueryClient();

  return useMutation<OrgLogoUploadResponse, Error, File>({
    mutationFn: (file) => settingsApi.uploadOrgLogo(file),
    onSuccess: ({ orgLogoUrl }) => {
      // Surgical cache update — no need to refetch full OrgSettings
      queryClient.setQueryData<OrgSettings>(
        settingsKeys.org(),
        (old) => old ? { ...old, orgLogoUrl } : old,
      );
    },
  });
}

// ─── Danger Zone ───────────────────────────────────────────────────────────────

export function useDeleteAccountMutation() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation<void, Error, DeleteAccountPayload>({
    mutationFn: (payload) => settingsApi.deleteAccount(payload),
    onSuccess: () => {
      // Clear all server state and UI store state before redirect
      queryClient.clear();
      useSettingsStore.getState().clearAllUnsaved();
      useSettingsStore.getState().closeDeletionModal();
      useSettingsStore.getState().setOAuthRedirectPending(null);
      navigate("/");
    },
  });
}
