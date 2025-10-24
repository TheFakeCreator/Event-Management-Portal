import { create } from 'zustand';
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

const generateId = () =>
  Math.random().toString(36).substring(2) + Date.now().toString(36);

export const useNotificationStore = create<NotificationState>()(
  devtools(
    (set, get) => ({
      // Initial state
      notifications: [],

      // Actions
      addNotification: (notification) => {
        const id = generateId();
        const newNotification: Notification = {
          ...notification,
          id,
          createdAt: new Date(),
          duration:
            notification.duration ??
            (notification.type === 'error' ? 6000 : 4000),
        };

        set(
          (state) => ({
            notifications: [...state.notifications, newNotification],
          }),
          false,
          'notifications/add'
        );

        // Auto remove non-persistent notifications
        if (!newNotification.persistent && newNotification.duration) {
          setTimeout(() => {
            get().removeNotification(id);
          }, newNotification.duration);
        }

        return id;
      },

      removeNotification: (id) => {
        set(
          (state) => ({
            notifications: state.notifications.filter((n) => n.id !== id),
          }),
          false,
          'notifications/remove'
        );
      },

      clearAll: () => {
        set({ notifications: [] }, false, 'notifications/clearAll');
      },

      updateNotification: (id, updates) => {
        set(
          (state) => ({
            notifications: state.notifications.map((n) =>
              n.id === id ? { ...n, ...updates } : n
            ),
          }),
          false,
          'notifications/update'
        );
      },

      // Convenience methods
      success: (title, message, options = {}) => {
        return get().addNotification({
          type: 'success',
          title,
          message,
          ...options,
        });
      },

      error: (title, message, options = {}) => {
        return get().addNotification({
          type: 'error',
          title,
          message,
          persistent: options.persistent ?? false, // Errors are not persistent by default
          ...options,
        });
      },

      warning: (title, message, options = {}) => {
        return get().addNotification({
          type: 'warning',
          title,
          message,
          ...options,
        });
      },

      info: (title, message, options = {}) => {
        return get().addNotification({
          type: 'info',
          title,
          message,
          ...options,
        });
      },
    }),
    { name: 'notification-store' }
  )
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
