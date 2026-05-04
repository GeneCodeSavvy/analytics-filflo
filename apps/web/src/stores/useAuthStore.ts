import { create } from "zustand";

interface AuthState {
  user: {
    id: string;
    displayName: string;
    email: string;
    avatarUrl?: string;
    role: "SUPER_ADMIN" | "ADMIN" | "MODERATOR" | "USER";
    orgId: string;
  } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: AuthState["user"]) => void;
  logout: () => void;
  setLoading: (isLoading: boolean) => void;
}

export const useAuthState = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setUser(user) {
    try {
      set({ user, isAuthenticated: !!user, isLoading: false });
    } catch (error) {
      console.error("Failed to create AuthState for User");
    }
  },
  logout() {
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },
  setLoading(isLoading) {
    set({ isLoading });
  },
}));
