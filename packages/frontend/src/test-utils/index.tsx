import React from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { ToastProvider } from '@/components/ui/toast';

// Mock session data
export const mockSession = {
  user: {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    image: null,
  },
  expires: '2030-01-01',
  accessToken: 'mock-token',
};

// Test providers wrapper
interface TestProvidersProps {
  children: React.ReactNode;
  session?: any;
  queryClient?: QueryClient;
}

export function TestProviders({
  children,
  session = null,
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  }),
}: TestProvidersProps) {
  return (
    <SessionProvider session={session}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>{children}</ToastProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}

// Custom render function
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  session?: any;
  queryClient?: QueryClient;
}

export function renderWithProviders(
  ui: React.ReactElement,
  {
    session = null,
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    }),
    ...renderOptions
  }: CustomRenderOptions = {}
): RenderResult {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <TestProviders session={session} queryClient={queryClient}>
        {children}
      </TestProviders>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Mock functions for common use cases
export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
};

export const mockUseRouter = () => mockRouter;

// Mock stores with default values
export const mockAuthStore = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
  clearError: jest.fn(),
};

export const mockUIStore = {
  theme: 'light' as const,
  sidebarOpen: false,
  sidebarCollapsed: false,
  modals: [],
  globalLoading: false,
  setTheme: jest.fn(),
  toggleSidebar: jest.fn(),
  openModal: jest.fn(),
  closeModal: jest.fn(),
  setGlobalLoading: jest.fn(),
};

export const mockNotificationStore = {
  notifications: [],
  unreadCount: 0,
  add: jest.fn(),
  remove: jest.fn(),
  markAsRead: jest.fn(),
  markAllAsRead: jest.fn(),
  clear: jest.fn(),
};

export const mockPreferencesStore = {
  preferences: {
    notifications: { email: true, push: false, inApp: true },
    dashboard: { showRecentActivity: true, compactMode: false },
    events: { defaultView: 'grid' as const, autoRegister: false },
    clubs: { showAll: true, hideInactive: false },
    privacy: { profileVisibility: 'public' as const, showEmail: false },
    accessibility: { highContrast: false, reducedMotion: false },
  },
  updatePreferences: jest.fn(),
  resetToDefaults: jest.fn(),
};

// Test data factories
export const createMockUser = (overrides = {}) => ({
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'user',
  avatar: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createMockEvent = (overrides = {}) => ({
  _id: '1',
  title: 'Test Event',
  description: 'Test event description',
  date: new Date().toISOString(),
  time: '10:00',
  location: 'Test Location',
  category: 'technology',
  image: null,
  maxParticipants: 100,
  registeredCount: 25,
  status: 'upcoming',
  createdBy: createMockUser(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createMockClub = (overrides = {}) => ({
  _id: '1',
  name: 'Test Club',
  description: 'Test club description',
  logo: null,
  category: 'technology',
  memberCount: 50,
  tags: ['programming', 'technology'],
  socials: {
    website: 'https://testclub.com',
    instagram: 'testclub',
    twitter: 'testclub',
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

// Utility functions for testing
export const waitForElementToBeRemoved = async (element: HTMLElement) => {
  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      if (!document.contains(element)) {
        observer.disconnect();
        resolve(true);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });
};

// Custom matchers can be added here
export const customMatchers = {
  toBeInTheDocument: (element: HTMLElement) => {
    return {
      pass: document.body.contains(element),
      message: () => 'Element should be in the document',
    };
  },
};

// Re-export everything from testing-library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

// Re-export our custom render as the default render
export { renderWithProviders as render };
