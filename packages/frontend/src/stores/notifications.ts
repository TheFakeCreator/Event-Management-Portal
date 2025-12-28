import { create, type StateCreator } from 'zustand';
import { devtools } from 'zustand/middleware';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
  actions?: Array<{
    label: string;
    action: () => void;
    variant?: 'default' | 'destructive';
  }>;
  createdAt: Date;
}

export interface NotificationState {
  // State
  notifications: Notification[];

  // Actions
  addNotification: (
    notification: Omit<Notification, 'id' | 'createdAt'>
  ) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  updateNotification: (id: string, updates: Partial<Notification>) => void;

  // Convenience methods
  success: (
    title: string,
    message?: string,
    options?: Partial<Notification>
  ) => string;
  error: (
    title: string,
    message?: string,
    options?: Partial<Notification>
  ) => string;
  warning: (
    title: string,
    message?: string,
    options?: Partial<Notification>
  ) => string;
  info: (
    title: string,
    message?: string,
    options?: Partial<Notification>
  ) => string;
}

const generateId = (): string =>
  Math.random().toString(36).substring(2) + Date.now().toString(36);

const storeImpl: StateCreator<NotificationState> = (set, get) => ({
  // Initial state
  notifications: [],

  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => {
    const id = generateId();
    const newNotification: Notification = {
      ...notification,
      id,
      createdAt: new Date(),
      duration:
        notification.duration ?? (notification.type === 'error' ? 6000 : 4000),
    };

    // Deduplicate notifications with same title + message
    const existing = get().notifications.find(
      (n: Notification) =>
        n.title === newNotification.title &&
        n.message === newNotification.message
    );

    if (existing) {
      // If already exists, return existing id and don't add duplicate
      return existing.id;
    }

    set((state: NotificationState) => ({
      notifications: [...state.notifications, newNotification],
    }));

    // Auto remove non-persistent notifications
    if (!newNotification.persistent && newNotification.duration) {
      setTimeout(() => {
        get().removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  },

  removeNotification: (id: string) => {
    set((state: NotificationState) => ({
      notifications: state.notifications.filter(
        (n: Notification) => n.id !== id
      ),
    }));
  },

  clearAll: () => {
    set({ notifications: [] });
  },

  updateNotification: (id: string, updates: Partial<Notification>) => {
    set((state: NotificationState) => ({
      notifications: state.notifications.map((n: Notification) =>
        n.id === id ? { ...n, ...updates } : n
      ),
    }));
  },

  // Convenience methods
  success: (
    title: string,
    message?: string,
    options: Partial<Notification> = {}
  ) => {
    return get().addNotification({
      type: 'success',
      title,
      message,
      ...options,
    });
  },

  error: (
    title: string,
    message?: string,
    options: Partial<Notification> = {}
  ) => {
    return get().addNotification({
      type: 'error',
      title,
      message,
      persistent: options.persistent ?? false, // Errors are not persistent by default
      ...options,
    });
  },

  warning: (
    title: string,
    message?: string,
    options: Partial<Notification> = {}
  ) => {
    return get().addNotification({
      type: 'warning',
      title,
      message,
      ...options,
    });
  },

  info: (
    title: string,
    message?: string,
    options: Partial<Notification> = {}
  ) => {
    return get().addNotification({
      type: 'info',
      title,
      message,
      ...options,
    });
  },
});

export const useNotificationStore = create<NotificationState>()(
  devtools(storeImpl, { name: 'notification-store' })
);

// Hook for easy access to notification methods
export const useNotifications = () => {
  const { success, error, warning, info, addNotification, removeNotification } =
    useNotificationStore();

  return {
    success,
    error,
    warning,
    info,
    notify: addNotification,
    dismiss: removeNotification,
  };
};
