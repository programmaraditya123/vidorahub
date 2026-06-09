import { create } from 'zustand';

type UiState = {
  isOffline: boolean;
  isSidebarCollapsed: boolean;
  activeVibeId: string | null;
  setOffline: (offline: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setActiveVibeId: (id: string | null) => void;
};

export const useUiStore = create<UiState>((set) => ({
  isOffline: false,
  isSidebarCollapsed: false,
  activeVibeId: null,
  setOffline: (offline) => set({ isOffline: offline }),
  setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
  setActiveVibeId: (id) => set({ activeVibeId: id }),
}));
