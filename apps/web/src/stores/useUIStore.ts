export interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  density: 'comfortable' | 'compact';

  toggleSidebar: () => void;
  setTheme: (theme: UIState['theme']) => void;
  setDensity: (density: UIState['density']) => void;
}
