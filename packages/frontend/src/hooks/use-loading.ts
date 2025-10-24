import { useState, useCallback } from 'react';

/**
 * Hook for managing boolean loading state
 */
export function useLoading(initialState = false) {
  const [loading, setLoading] = useState(initialState);

  const startLoading = useCallback(() => setLoading(true), []);
  const stopLoading = useCallback(() => setLoading(false), []);
  const toggleLoading = useCallback(() => setLoading((prev) => !prev), []);

  return {
    loading,
    startLoading,
    stopLoading,
    toggleLoading,
    setLoading,
  };
}

/**
 * Hook for managing multiple loading states with keys
 */
export function useLoadingStates<T extends string>() {
  const [loadingStates, setLoadingStates] = useState<Record<T, boolean>>(
    {} as Record<T, boolean>
  );

  const setLoading = useCallback((key: T, loading: boolean) => {
    setLoadingStates((prev) => ({ ...prev, [key]: loading }));
  }, []);

  const startLoading = useCallback(
    (key: T) => {
      setLoading(key, true);
    },
    [setLoading]
  );

  const stopLoading = useCallback(
    (key: T) => {
      setLoading(key, false);
    },
    [setLoading]
  );

  const isLoading = useCallback(
    (key: T) => {
      return loadingStates[key] || false;
    },
    [loadingStates]
  );

  const isAnyLoading = useCallback(() => {
    return Object.values(loadingStates).some(Boolean);
  }, [loadingStates]);

  const clearAllLoading = useCallback(() => {
    setLoadingStates({} as Record<T, boolean>);
  }, []);

  return {
    loadingStates,
    setLoading,
    startLoading,
    stopLoading,
    isLoading,
    isAnyLoading,
    clearAllLoading,
  };
}

/**
 * Hook for managing async operations with automatic loading state
 */
export function useAsyncOperation<T = unknown, P extends unknown[] = []>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(
    async (
      asyncFn: (...args: P) => Promise<T>,
      ...args: P
    ): Promise<T | null> => {
      try {
        setLoading(true);
        setError(null);
        const result = await asyncFn(...args);
        setData(result);
        return result;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error('An unknown error occurred');
        setError(error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    loading,
    error,
    data,
    execute,
    reset,
  };
}

/**
 * Hook for managing form submission loading states
 */
export function useFormLoading() {
  const [submitting, setSubmitting] = useState(false);
  const [validating, setValidating] = useState(false);
  const [uploading, setUploading] = useState(false);

  const startSubmitting = useCallback(() => setSubmitting(true), []);
  const stopSubmitting = useCallback(() => setSubmitting(false), []);

  const startValidating = useCallback(() => setValidating(true), []);
  const stopValidating = useCallback(() => setValidating(false), []);

  const startUploading = useCallback(() => setUploading(true), []);
  const stopUploading = useCallback(() => setUploading(false), []);

  const reset = useCallback(() => {
    setSubmitting(false);
    setValidating(false);
    setUploading(false);
  }, []);

  const isAnyLoading = submitting || validating || uploading;

  return {
    submitting,
    validating,
    uploading,
    isAnyLoading,
    startSubmitting,
    stopSubmitting,
    startValidating,
    stopValidating,
    startUploading,
    stopUploading,
    reset,
  };
}

/**
 * Hook for managing pagination loading states
 */
export function usePaginationLoading() {
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const startLoading = useCallback(() => setLoading(true), []);
  const stopLoading = useCallback(() => setLoading(false), []);

  const startLoadingMore = useCallback(() => setLoadingMore(true), []);
  const stopLoadingMore = useCallback(() => setLoadingMore(false), []);

  const startRefreshing = useCallback(() => setRefreshing(true), []);
  const stopRefreshing = useCallback(() => setRefreshing(false), []);

  const reset = useCallback(() => {
    setLoading(false);
    setLoadingMore(false);
    setRefreshing(false);
  }, []);

  return {
    loading,
    loadingMore,
    refreshing,
    startLoading,
    stopLoading,
    startLoadingMore,
    stopLoadingMore,
    startRefreshing,
    stopRefreshing,
    reset,
  };
}

/**
 * Hook for debounced loading state (useful for search inputs)
 */
export function useDebouncedLoading(delay = 300) {
  const [loading, setLoading] = useState(false);
  const [debouncedLoading, setDebouncedLoading] = useState(false);

  const startLoading = useCallback(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setDebouncedLoading(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const stopLoading = useCallback(() => {
    setLoading(false);
    setDebouncedLoading(false);
  }, []);

  return {
    loading,
    debouncedLoading,
    startLoading,
    stopLoading,
  };
}

/**
 * Hook for managing retry loading state
 */
export function useRetryLoading() {
  const [retrying, setRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const startRetry = useCallback(() => {
    setRetrying(true);
    setRetryCount((prev) => prev + 1);
  }, []);

  const stopRetry = useCallback(() => {
    setRetrying(false);
  }, []);

  const resetRetry = useCallback(() => {
    setRetrying(false);
    setRetryCount(0);
  }, []);

  return {
    retrying,
    retryCount,
    startRetry,
    stopRetry,
    resetRetry,
  };
}
