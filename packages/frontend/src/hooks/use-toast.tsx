import {
  useState,
  useCallback,
  createContext,
  useContext,
  ReactNode,
} from 'react';

export interface ToastProps {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success' | 'warning';
  duration?: number;
}

interface ToastContextType {
  toasts: ToastProps[];
  addToast: (toast: Omit<ToastProps, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = useCallback((toastProps: Omit<ToastProps, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastProps = {
      id,
      duration: 5000,
      variant: 'default',
      ...toastProps,
    };

    setToasts((prev) => {
      // Deduplicate by title + description
      const exists = prev.some(
        (t) =>
          t.title === newToast.title && t.description === newToast.description
      );
      if (exists) return prev;
      return [...prev, newToast];
    });

    // Auto dismiss after duration using setToasts directly (avoid relying on removeToast closure)
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, newToast.duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const value = { toasts, addToast, removeToast };

  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  const toast = useCallback(
    (props: Omit<ToastProps, 'id'>) => {
      context.addToast(props);
    },
    [context]
  );

  const success = useCallback(
    (title: string, description?: string) => {
      toast({ title, description, variant: 'success' });
    },
    [toast]
  );

  const error = useCallback(
    (title: string, description?: string) => {
      toast({ title, description, variant: 'destructive' });
    },
    [toast]
  );

  const info = useCallback(
    (title: string, description?: string) => {
      toast({ title, description, variant: 'default' });
    },
    [toast]
  );

  const warning = useCallback(
    (title: string, description?: string) => {
      toast({ title, description, variant: 'warning' });
    },
    [toast]
  );

  return {
    toast,
    success,
    error,
    info,
    warning,
    toasts: context.toasts,
    removeToast: context.removeToast,
  };
}
