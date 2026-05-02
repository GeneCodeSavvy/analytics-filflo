import { create } from "zustand";
import type { SettingsSection } from "../lib/settingsParams";
import type { OAuthProvider } from "../lib/settingsParams";

interface SettingsUIState {
  // Danger zone deletion modal
  deletionModalOpen: boolean;
  deletionEmailInput: string;

  // Tracks which OAuth provider connect is in-flight (set before redirect, cleared on return)
  oauthRedirectPending: OAuthProvider | null;

  // Sections with unsaved form changes — drives sidebar dirty indicators and leave-guard
  // Using Record instead of Set for devtools serialization
  unsavedSections: Record<SettingsSection, boolean>;

  // Actions
  openDeletionModal: () => void;
  closeDeletionModal: () => void;
  setDeletionEmailInput: (value: string) => void;

  setOAuthRedirectPending: (provider: OAuthProvider | null) => void;

  markSectionDirty: (section: SettingsSection) => void;
  markSectionClean: (section: SettingsSection) => void;
  clearAllUnsaved: () => void;
}

const emptyUnsavedSections: Record<SettingsSection, boolean> = {
  profile: false,
  security: false,
  notifications: false,
  appearance: false,
  org: false,
  danger: false,
};

export const useSettingsStore = create<SettingsUIState>()((set) => ({
  deletionModalOpen: false,
  deletionEmailInput: "",
  oauthRedirectPending: null,
  unsavedSections: { ...emptyUnsavedSections },

  openDeletionModal: () => set({ deletionModalOpen: true }),
  closeDeletionModal: () =>
    set({ deletionModalOpen: false, deletionEmailInput: "" }),
  setDeletionEmailInput: (value) => set({ deletionEmailInput: value }),

  setOAuthRedirectPending: (provider) =>
    set({ oauthRedirectPending: provider }),

  markSectionDirty: (section) =>
    set((state) => ({
      unsavedSections: { ...state.unsavedSections, [section]: true },
    })),

  markSectionClean: (section) =>
    set((state) => ({
      unsavedSections: { ...state.unsavedSections, [section]: false },
    })),

  clearAllUnsaved: () => set({ unsavedSections: { ...emptyUnsavedSections } }),
}));
