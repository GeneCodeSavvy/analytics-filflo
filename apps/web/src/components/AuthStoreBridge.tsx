import { useEffect } from "react";
import { useUser } from "@clerk/react";
import { useAuthState } from "../stores/useAuthStore";

type AppRole = NonNullable<ReturnType<typeof useAuthState.getState>["user"]>["role"];

function metadataString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function metadataRole(value: unknown): AppRole {
  if (
    value === "SUPER_ADMIN" ||
    value === "ADMIN" ||
    value === "MODERATOR" ||
    value === "USER"
  ) {
    return value;
  }
  return "USER";
}

export function AuthStoreBridge() {
  const { isLoaded, isSignedIn, user } = useUser();
  const setUser = useAuthState((state) => state.setUser);
  const logout = useAuthState((state) => state.logout);
  const setLoading = useAuthState((state) => state.setLoading);

  useEffect(() => {
    if (!isLoaded) {
      setLoading(true);
      return;
    }

    if (!isSignedIn || !user) {
      logout();
      return;
    }

    setUser({
      id: user.id,
      displayName: user.fullName ?? user.primaryEmailAddress?.emailAddress ?? "User",
      email: user.primaryEmailAddress?.emailAddress ?? "",
      avatarUrl: user.imageUrl,
      role: metadataRole(user.publicMetadata?.role),
      orgId: metadataString(user.publicMetadata?.orgId) ?? "",
    });
  }, [isLoaded, isSignedIn, logout, setLoading, setUser, user]);

  return null;
}
