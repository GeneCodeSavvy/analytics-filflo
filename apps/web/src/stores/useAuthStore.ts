import { create } from "zustand";

interface AuthState {
  user: {
    id: string;
    displayName: string;
    email: string;
    avatarUrl?: string;
    role: "SUPER_ADMIN" | "ADMIN" | "MODERATOR" | "USER";
    orgId: string;
    timezone: string;
  } | null;
  orgMemberships: { orgId: string; orgName: string; role: string } | null; // one-to-one mapping
  isAuthenticated: boolean;
  setUser: (user: AuthState["user"]) => void;
  logout: () => void;
}

export const useAuthState = create<AuthState>((set) => ({
  user: null,
  orgMemberships: null,
  isAuthenticated: false,
  setUser(user) {
    try {
      set({ user, isAuthenticated: !!user });
    } catch (error) {
      console.error("Failed to create AuthState for User");
    }
  },
  logout() {
    set({
      user: null,
      orgMemberships: null,
      isAuthenticated: false,
    });
  },
}));
