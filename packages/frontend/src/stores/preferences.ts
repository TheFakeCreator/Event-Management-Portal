import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface PreferencesState {
  // Notification preferences
  notifications: {
    email: boolean;
    push: boolean;
    eventReminders: boolean;
    clubUpdates: boolean;
    newRecruitments: boolean;
    systemAnnouncements: boolean;
    digest: 'daily' | 'weekly' | 'never';
  };

  // Dashboard preferences
  dashboard: {
    showUpcomingEvents: boolean;
    showMyEvents: boolean;
    showClubActivity: boolean;
    showRecommendations: boolean;
    eventCardLayout: 'compact' | 'detailed';
    defaultEventFilter:
      | 'all'
      | 'upcoming'
      | 'today'
      | 'this_week'
      | 'this_month';
  };

  // Event preferences
  events: {
    defaultView: 'calendar' | 'list' | 'grid';
    showPastEvents: boolean;
    autoRegisterReminders: boolean;
    reminderOffset: number; // minutes before event
    showOnlyInterestedCategories: boolean;
    interestedCategories: string[];
  };

  // Club preferences
  clubs: {
    showFollowedOnly: boolean;
    followedClubs: string[];
    hideClubsNotInterested: boolean;
    clubsNotInterested: string[];
    showMembershipStatus: boolean;
  };

  // Privacy preferences
  privacy: {
    profileVisibility: 'public' | 'clubs_only' | 'private';
    showEmail: boolean;
    showPhone: boolean;
    showOnlineStatus: boolean;
    allowEventInvitations: boolean;
    allowClubInvitations: boolean;
  };

  // Accessibility preferences
  accessibility: {
    reduceMotion: boolean;
    highContrast: boolean;
    largeText: boolean;
    screenReader: boolean;
    keyboardNavigation: boolean;
  };

  // Language and locale
  locale: {
    language: 'en' | 'es' | 'fr' | 'de' | 'hi';
    timezone: string;
    dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
    timeFormat: '12h' | '24h';
    currency: 'USD' | 'EUR' | 'INR' | 'GBP';
  };

  // Actions
  updateNotifications: (
    notifications: Partial<PreferencesState['notifications']>
  ) => void;
  updateDashboard: (dashboard: Partial<PreferencesState['dashboard']>) => void;
  updateEvents: (events: Partial<PreferencesState['events']>) => void;
  updateClubs: (clubs: Partial<PreferencesState['clubs']>) => void;
  updatePrivacy: (privacy: Partial<PreferencesState['privacy']>) => void;
  updateAccessibility: (
    accessibility: Partial<PreferencesState['accessibility']>
  ) => void;
  updateLocale: (locale: Partial<PreferencesState['locale']>) => void;

  // Club specific actions
  followClub: (clubId: string) => void;
  unfollowClub: (clubId: string) => void;
  markClubNotInterested: (clubId: string) => void;
  unmarkClubNotInterested: (clubId: string) => void;

  // Event category actions
  addInterestedCategory: (category: string) => void;
  removeInterestedCategory: (category: string) => void;

  // Bulk actions
  resetToDefaults: () => void;
  importPreferences: (preferences: Partial<PreferencesState>) => void;
  exportPreferences: () => Partial<PreferencesState>;
}

const defaultPreferences: Omit<PreferencesState, keyof PreferencesActions> = {
  notifications: {
    email: true,
    push: true,
    eventReminders: true,
    clubUpdates: true,
    newRecruitments: true,
    systemAnnouncements: true,
    digest: 'weekly',
  },
  dashboard: {
    showUpcomingEvents: true,
    showMyEvents: true,
    showClubActivity: true,
    showRecommendations: true,
    eventCardLayout: 'detailed',
    defaultEventFilter: 'upcoming',
  },
  events: {
    defaultView: 'calendar',
    showPastEvents: false,
    autoRegisterReminders: true,
    reminderOffset: 30,
    showOnlyInterestedCategories: false,
    interestedCategories: [],
  },
  clubs: {
    showFollowedOnly: false,
    followedClubs: [],
    hideClubsNotInterested: false,
    clubsNotInterested: [],
    showMembershipStatus: true,
  },
  privacy: {
    profileVisibility: 'clubs_only',
    showEmail: false,
    showPhone: false,
    showOnlineStatus: true,
    allowEventInvitations: true,
    allowClubInvitations: true,
  },
  accessibility: {
    reduceMotion: false,
    highContrast: false,
    largeText: false,
    screenReader: false,
    keyboardNavigation: false,
  },
  locale: {
    language: 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    currency: 'USD',
  },
};

type PreferencesActions = {
  updateNotifications: (
    notifications: Partial<PreferencesState['notifications']>
  ) => void;
  updateDashboard: (dashboard: Partial<PreferencesState['dashboard']>) => void;
  updateEvents: (events: Partial<PreferencesState['events']>) => void;
  updateClubs: (clubs: Partial<PreferencesState['clubs']>) => void;
  updatePrivacy: (privacy: Partial<PreferencesState['privacy']>) => void;
  updateAccessibility: (
    accessibility: Partial<PreferencesState['accessibility']>
  ) => void;
  updateLocale: (locale: Partial<PreferencesState['locale']>) => void;
  followClub: (clubId: string) => void;
  unfollowClub: (clubId: string) => void;
  markClubNotInterested: (clubId: string) => void;
  unmarkClubNotInterested: (clubId: string) => void;
  addInterestedCategory: (category: string) => void;
  removeInterestedCategory: (category: string) => void;
  resetToDefaults: () => void;
  importPreferences: (preferences: Partial<PreferencesState>) => void;
  exportPreferences: () => Partial<PreferencesState>;
};

export const usePreferencesStore = create<PreferencesState>()(
  devtools(
    persist(
      (set, get) => ({
        ...defaultPreferences,

        updateNotifications: (notifications) => {
          set(
            (state) => ({
              notifications: { ...state.notifications, ...notifications },
            }),
            false,
            'preferences/updateNotifications'
          );
        },

        updateDashboard: (dashboard) => {
          set(
            (state) => ({
              dashboard: { ...state.dashboard, ...dashboard },
            }),
            false,
            'preferences/updateDashboard'
          );
        },

        updateEvents: (events) => {
          set(
            (state) => ({
              events: { ...state.events, ...events },
            }),
            false,
            'preferences/updateEvents'
          );
        },

        updateClubs: (clubs) => {
          set(
            (state) => ({
              clubs: { ...state.clubs, ...clubs },
            }),
            false,
            'preferences/updateClubs'
          );
        },

        updatePrivacy: (privacy) => {
          set(
            (state) => ({
              privacy: { ...state.privacy, ...privacy },
            }),
            false,
            'preferences/updatePrivacy'
          );
        },

        updateAccessibility: (accessibility) => {
          set(
            (state) => ({
              accessibility: { ...state.accessibility, ...accessibility },
            }),
            false,
            'preferences/updateAccessibility'
          );
        },

        updateLocale: (locale) => {
          set(
            (state) => ({
              locale: { ...state.locale, ...locale },
            }),
            false,
            'preferences/updateLocale'
          );
        },

        // Club actions
        followClub: (clubId) => {
          set(
            (state) => ({
              clubs: {
                ...state.clubs,
                followedClubs: [
                  ...new Set([...state.clubs.followedClubs, clubId]),
                ],
                clubsNotInterested: state.clubs.clubsNotInterested.filter(
                  (id) => id !== clubId
                ),
              },
            }),
            false,
            'preferences/followClub'
          );
        },

        unfollowClub: (clubId) => {
          set(
            (state) => ({
              clubs: {
                ...state.clubs,
                followedClubs: state.clubs.followedClubs.filter(
                  (id) => id !== clubId
                ),
              },
            }),
            false,
            'preferences/unfollowClub'
          );
        },

        markClubNotInterested: (clubId) => {
          set(
            (state) => ({
              clubs: {
                ...state.clubs,
                clubsNotInterested: [
                  ...new Set([...state.clubs.clubsNotInterested, clubId]),
                ],
                followedClubs: state.clubs.followedClubs.filter(
                  (id) => id !== clubId
                ),
              },
            }),
            false,
            'preferences/markClubNotInterested'
          );
        },

        unmarkClubNotInterested: (clubId) => {
          set(
            (state) => ({
              clubs: {
                ...state.clubs,
                clubsNotInterested: state.clubs.clubsNotInterested.filter(
                  (id) => id !== clubId
                ),
              },
            }),
            false,
            'preferences/unmarkClubNotInterested'
          );
        },

        // Event category actions
        addInterestedCategory: (category) => {
          set(
            (state) => ({
              events: {
                ...state.events,
                interestedCategories: [
                  ...new Set([...state.events.interestedCategories, category]),
                ],
              },
            }),
            false,
            'preferences/addInterestedCategory'
          );
        },

        removeInterestedCategory: (category) => {
          set(
            (state) => ({
              events: {
                ...state.events,
                interestedCategories: state.events.interestedCategories.filter(
                  (c) => c !== category
                ),
              },
            }),
            false,
            'preferences/removeInterestedCategory'
          );
        },

        resetToDefaults: () => {
          set(defaultPreferences, false, 'preferences/resetToDefaults');
        },

        importPreferences: (preferences) => {
          set(
            (state) => ({
              ...state,
              ...preferences,
            }),
            false,
            'preferences/importPreferences'
          );
        },

        exportPreferences: () => {
          const state = get();
          const {
            updateNotifications,
            updateDashboard,
            updateEvents,
            updateClubs,
            updatePrivacy,
            updateAccessibility,
            updateLocale,
            followClub,
            unfollowClub,
            markClubNotInterested,
            unmarkClubNotInterested,
            addInterestedCategory,
            removeInterestedCategory,
            resetToDefaults,
            importPreferences,
            exportPreferences,
            ...preferences
          } = state;
          return preferences;
        },
      }),
      {
        name: 'preferences-storage',
        version: 1,
      }
    ),
    { name: 'preferences-store' }
  )
);

// Convenience hooks
export const useNotificationPreferences = () => {
  const { notifications, updateNotifications } = usePreferencesStore();
  return { notifications, updateNotifications };
};

export const useDashboardPreferences = () => {
  const { dashboard, updateDashboard } = usePreferencesStore();
  return { dashboard, updateDashboard };
};

export const useEventPreferences = () => {
  const {
    events,
    updateEvents,
    addInterestedCategory,
    removeInterestedCategory,
  } = usePreferencesStore();

  return {
    events,
    updateEvents,
    addInterestedCategory,
    removeInterestedCategory,
  };
};

export const useClubPreferences = () => {
  const {
    clubs,
    updateClubs,
    followClub,
    unfollowClub,
    markClubNotInterested,
    unmarkClubNotInterested,
  } = usePreferencesStore();

  return {
    clubs,
    updateClubs,
    followClub,
    unfollowClub,
    markClubNotInterested,
    unmarkClubNotInterested,
  };
};

export const usePrivacyPreferences = () => {
  const { privacy, updatePrivacy } = usePreferencesStore();
  return { privacy, updatePrivacy };
};

export const useAccessibilityPreferences = () => {
  const { accessibility, updateAccessibility } = usePreferencesStore();
  return { accessibility, updateAccessibility };
};

export const useLocalePreferences = () => {
  const { locale, updateLocale } = usePreferencesStore();
  return { locale, updateLocale };
};
