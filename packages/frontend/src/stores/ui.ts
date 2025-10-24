import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface Modal {
  id: string;
  component: string;
  props?: Record<string, any>;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closable?: boolean;
}

export interface UIState {
  // Navigation state
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;

  // Modal state
  modals: Modal[];

  // Loading states
  globalLoading: boolean;
  loadingMessage?: string;

  // Theme
  theme: 'light' | 'dark' | 'system';

  // Layout preferences
  viewMode: 'grid' | 'list';
  compactMode: boolean;

  // Search and filters
  globalSearch: string;
  quickFilters: Record<string, any>;

  // Actions
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  toggleSidebarCollapsed: () => void;

  openModal: (modal: Omit<Modal, 'id'>) => string;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  updateModal: (id: string, updates: Partial<Modal>) => void;

  setGlobalLoading: (loading: boolean, message?: string) => void;

  setTheme: (theme: 'light' | 'dark' | 'system') => void;

  setViewMode: (mode: 'grid' | 'list') => void;
  setCompactMode: (compact: boolean) => void;

  setGlobalSearch: (search: string) => void;
  setQuickFilter: (key: string, value: any) => void;
  clearQuickFilters: () => void;

  reset: () => void;
}

const generateModalId = () =>
  'modal_' + Math.random().toString(36).substring(2) + Date.now().toString(36);

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        sidebarOpen: false,
        sidebarCollapsed: false,
        modals: [],
        globalLoading: false,
        loadingMessage: undefined,
        theme: 'system',
        viewMode: 'grid',
        compactMode: false,
        globalSearch: '',
        quickFilters: {},

        // Navigation actions
        setSidebarOpen: (sidebarOpen) => {
          set({ sidebarOpen }, false, 'ui/setSidebarOpen');
        },

        setSidebarCollapsed: (sidebarCollapsed) => {
          set({ sidebarCollapsed }, false, 'ui/setSidebarCollapsed');
        },

        toggleSidebar: () => {
          set(
            (state) => ({ sidebarOpen: !state.sidebarOpen }),
            false,
            'ui/toggleSidebar'
          );
        },

        toggleSidebarCollapsed: () => {
          set(
            (state) => ({ sidebarCollapsed: !state.sidebarCollapsed }),
            false,
            'ui/toggleSidebarCollapsed'
          );
        },

        // Modal actions
        openModal: (modal) => {
          const id = generateModalId();
          const newModal: Modal = {
            ...modal,
            id,
            size: modal.size ?? 'md',
            closable: modal.closable ?? true,
          };

          set(
            (state) => ({
              modals: [...state.modals, newModal],
            }),
            false,
            'ui/openModal'
          );

          return id;
        },

        closeModal: (id) => {
          set(
            (state) => ({
              modals: state.modals.filter((modal) => modal.id !== id),
            }),
            false,
            'ui/closeModal'
          );
        },

        closeAllModals: () => {
          set({ modals: [] }, false, 'ui/closeAllModals');
        },

        updateModal: (id, updates) => {
          set(
            (state) => ({
              modals: state.modals.map((modal) =>
                modal.id === id ? { ...modal, ...updates } : modal
              ),
            }),
            false,
            'ui/updateModal'
          );
        },

        // Loading actions
        setGlobalLoading: (globalLoading, loadingMessage) => {
          set({ globalLoading, loadingMessage }, false, 'ui/setGlobalLoading');
        },

        // Theme actions
        setTheme: (theme) => {
          set({ theme }, false, 'ui/setTheme');

          // Apply theme to document
          const root = document.documentElement;
          if (theme === 'dark') {
            root.classList.add('dark');
          } else if (theme === 'light') {
            root.classList.remove('dark');
          } else {
            // System theme
            const prefersDark =
              typeof window !== 'undefined' &&
              window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDark) {
              root.classList.add('dark');
            } else {
              root.classList.remove('dark');
            }
          }
        },

        // Layout actions
        setViewMode: (viewMode) => {
          set({ viewMode }, false, 'ui/setViewMode');
        },

        setCompactMode: (compactMode) => {
          set({ compactMode }, false, 'ui/setCompactMode');
        },

        // Search and filter actions
        setGlobalSearch: (globalSearch) => {
          set({ globalSearch }, false, 'ui/setGlobalSearch');
        },

        setQuickFilter: (key, value) => {
          set(
            (state) => ({
              quickFilters: { ...state.quickFilters, [key]: value },
            }),
            false,
            'ui/setQuickFilter'
          );
        },

        clearQuickFilters: () => {
          set({ quickFilters: {} }, false, 'ui/clearQuickFilters');
        },

        reset: () => {
          set(
            {
              sidebarOpen: false,
              sidebarCollapsed: false,
              modals: [],
              globalLoading: false,
              loadingMessage: undefined,
              globalSearch: '',
              quickFilters: {},
            },
            false,
            'ui/reset'
          );
        },
      }),
      {
        name: 'ui-storage',
        partialize: (state) => ({
          sidebarCollapsed: state.sidebarCollapsed,
          theme: state.theme,
          viewMode: state.viewMode,
          compactMode: state.compactMode,
        }),
        onRehydrateStorage: () => (state) => {
          // Apply theme on rehydration
          if (state?.theme) {
            const root = document.documentElement;
            if (state.theme === 'dark') {
              root.classList.add('dark');
            } else if (state.theme === 'light') {
              root.classList.remove('dark');
            } else {
              const prefersDark =
                typeof window !== 'undefined' &&
                window.matchMedia('(prefers-color-scheme: dark)').matches;
              if (prefersDark) {
                root.classList.add('dark');
              } else {
                root.classList.remove('dark');
              }
            }
          }
        },
      }
    ),
    { name: 'ui-store' }
  )
);

// Convenience hooks
export const useModal = () => {
  const { openModal, closeModal, closeAllModals, updateModal, modals } =
    useUIStore();

  return {
    modals,
    open: openModal,
    close: closeModal,
    closeAll: closeAllModals,
    update: updateModal,
  };
};

export const useSidebar = () => {
  const {
    sidebarOpen,
    sidebarCollapsed,
    setSidebarOpen,
    setSidebarCollapsed,
    toggleSidebar,
    toggleSidebarCollapsed,
  } = useUIStore();

  return {
    isOpen: sidebarOpen,
    isCollapsed: sidebarCollapsed,
    setOpen: setSidebarOpen,
    setCollapsed: setSidebarCollapsed,
    toggle: toggleSidebar,
    toggleCollapsed: toggleSidebarCollapsed,
  };
};

export const useTheme = () => {
  const { theme, setTheme } = useUIStore();

  return {
    theme,
    setTheme,
    isDark:
      theme === 'dark' ||
      (theme === 'system' &&
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches),
    isLight:
      theme === 'light' ||
      (theme === 'system' &&
        typeof window !== 'undefined' &&
        !window.matchMedia('(prefers-color-scheme: dark)').matches),
  };
};
