'use client';

import React, { useEffect } from 'react';
import { Toaster as SonnerToaster } from 'sonner';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useNotificationStore } from '@/stores';

interface ToastComponentProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  actions?: Array<{
    label: string;
    action: () => void;
    variant?: 'default' | 'destructive';
  }>;
  onClose: () => void;
}

const ToastComponent: React.FC<ToastComponentProps> = ({
  id,
  type,
  title,
  message,
  actions,
  onClose,
}) => {
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const colors = {
    success: 'text-green-600 bg-green-50 border-green-200',
    error: 'text-red-600 bg-red-50 border-red-200',
    warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    info: 'text-blue-600 bg-blue-50 border-blue-200',
  };

  const Icon = icons[type];

  return (
    <div
      role="alert"
      className={`flex items-start p-4 border rounded-lg shadow-lg ${colors[type]}`}
    >
      <Icon className="w-5 h-5 mt-0.5 mr-3 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-sm">{title}</h4>
        {message && <p className="mt-1 text-sm opacity-90">{message}</p>}
        {actions && actions.length > 0 && (
          <div className="flex gap-2 mt-3">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  action.variant === 'destructive'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <button
        onClick={onClose}
        aria-label="Close notification"
        className="ml-3 flex-shrink-0 p-1 rounded-md hover:bg-black/5 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { notifications, removeNotification } = useNotificationStore();

  useEffect(() => {
    // Auto-remove notifications after their duration
    notifications.forEach((notification) => {
      if (!notification.persistent && notification.duration) {
        const timer = setTimeout(() => {
          removeNotification(notification.id);
        }, notification.duration);

        return () => clearTimeout(timer);
      }
    });
  }, [notifications, removeNotification]);

  return (
    <>
      {children}
      <SonnerToaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'transparent',
            border: 'none',
            padding: 0,
            boxShadow: 'none',
          },
        }}
      />

      {/* Custom notification stack */}
      <div className="fixed top-4 right-4 z-50 space-y-3 pointer-events-none">
        {notifications.map((notification) => (
          <div key={notification.id} className="pointer-events-auto">
            <ToastComponent
              id={notification.id}
              type={notification.type}
              title={notification.title}
              message={notification.message}
              actions={notification.actions}
              onClose={() => removeNotification(notification.id)}
            />
          </div>
        ))}
      </div>
    </>
  );
};

// Hook for easy toast usage
export const useToast = () => {
  const { addNotification, removeNotification, success, error, warning, info } =
    useNotificationStore();

  return {
    toast: addNotification,
    success,
    error,
    warning,
    info,
    dismiss: removeNotification,
  };
};

// Export ToastComponent for testing
export { ToastComponent };
