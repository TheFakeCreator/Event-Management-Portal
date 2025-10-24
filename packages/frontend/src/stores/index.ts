// Store exports
export { useAuthStore, type AuthState } from './auth';
export {
  useNotificationStore,
  type NotificationState,
  type Notification,
} from './notifications';
export {
  useUIStore,
  useModal,
  useSidebar,
  useTheme,
  type UIState,
  type Modal,
} from './ui';
export {
  usePreferencesStore,
  useNotificationPreferences,
  useDashboardPreferences,
  useEventPreferences,
  useClubPreferences,
  usePrivacyPreferences,
  useAccessibilityPreferences,
  useLocalePreferences,
  type PreferencesState,
} from './preferences';

// Import the stores for internal use
import { useAuthStore, type AuthState } from './auth';
import { useNotificationStore, type NotificationState } from './notifications';
import { useUIStore, type UIState } from './ui';
import { usePreferencesStore, type PreferencesState } from './preferences';

// Store utilities
export const stores = {
  auth: useAuthStore,
  notifications: useNotificationStore,
  ui: useUIStore,
  preferences: usePreferencesStore,
};

// Global store reset utility
export const resetAllStores = () => {
  useAuthStore.getState().logout();
  useNotificationStore.getState().clearAll();
  useUIStore.getState().reset();
  usePreferencesStore.getState().resetToDefaults();
};

// Store selectors for common use cases
export const useIsAuthenticated = () => useAuthStore((state) => !!state.user);
export const useCurrentUser = () => useAuthStore((state) => state.user);
export const useAuthToken = () => useAuthStore((state) => state.token);

export const useGlobalLoading = () =>
  useUIStore((state) => state.globalLoading);
export const useThemeMode = () => useUIStore((state) => state.theme);
export const useViewMode = () => useUIStore((state) => state.viewMode);

export const useNotificationCount = () =>
  useNotificationStore((state) => state.notifications.length);

export const useUserPreferences = () => usePreferencesStore();

// Store action creators
export const createStoreActions = () => ({
  auth: {
    login: useAuthStore.getState().login,
    logout: useAuthStore.getState().logout,
    register: useAuthStore.getState().register,
    updateProfile: useAuthStore.getState().updateProfile,
    refreshToken: useAuthStore.getState().refreshToken,
  },
  notifications: {
    add: useNotificationStore.getState().addNotification,
    remove: useNotificationStore.getState().removeNotification,
    clear: useNotificationStore.getState().clearAll,
  },
  ui: {
    setLoading: useUIStore.getState().setGlobalLoading,
    openModal: useUIStore.getState().openModal,
    closeModal: useUIStore.getState().closeModal,
    setTheme: useUIStore.getState().setTheme,
    toggleSidebar: useUIStore.getState().toggleSidebar,
  },
  preferences: {
    updateNotifications: usePreferencesStore.getState().updateNotifications,
    updateDashboard: usePreferencesStore.getState().updateDashboard,
    updateEvents: usePreferencesStore.getState().updateEvents,
    updateClubs: usePreferencesStore.getState().updateClubs,
    followClub: usePreferencesStore.getState().followClub,
    unfollowClub: usePreferencesStore.getState().unfollowClub,
  },
});

// Development utilities
export const getStoreState = () => ({
  auth: useAuthStore.getState(),
  notifications: useNotificationStore.getState(),
  ui: useUIStore.getState(),
  preferences: usePreferencesStore.getState(),
});

export const logStoreState = () => {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.group('🏪 Store State');
    console.log('Auth:', useAuthStore.getState());
    console.log('Notifications:', useNotificationStore.getState());
    console.log('UI:', useUIStore.getState());
    console.log('Preferences:', usePreferencesStore.getState());
    console.groupEnd();
  }
};

// Store persistence utilities
export const clearStorePersistence = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth-storage');
    localStorage.removeItem('ui-storage');
    localStorage.removeItem('preferences-storage');
    // Note: notifications store is not persisted by design
  }
};

export const exportStoreData = () => {
  const data = {
    timestamp: new Date().toISOString(),
    auth: useAuthStore.getState(),
    ui: useUIStore.getState(),
    preferences: usePreferencesStore.getState().exportPreferences(),
  };

  return JSON.stringify(data, null, 2);
};

export const importStoreData = (jsonData: string) => {
  try {
    const data = JSON.parse(jsonData);

    if (data.preferences) {
      usePreferencesStore.getState().importPreferences(data.preferences);
    }

    // Note: Auth and UI stores should not be imported for security reasons

    return { success: true, message: 'Preferences imported successfully' };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Invalid JSON data',
    };
  }
};

// Type definitions for store state
export type StoreState = {
  auth: AuthState;
  notifications: NotificationState;
  ui: UIState;
  preferences: PreferencesState;
};

export type StoreActions = ReturnType<typeof createStoreActions>;
