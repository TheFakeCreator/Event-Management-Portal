// jest.setup.js
import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
    useRouter() {
        return {
            push: jest.fn(),
            replace: jest.fn(),
            back: jest.fn(),
            forward: jest.fn(),
            refresh: jest.fn(),
            prefetch: jest.fn(),
        }
    },
    useSearchParams() {
        return new URLSearchParams()
    },
    usePathname() {
        return '/'
    },
}))

// Mock Next.js Image component
jest.mock('next/image', () => ({
    __esModule: true,
    default: (props) => {
        // eslint-disable-next-line @next/next/no-img-element
        return <img {...props} />
    },
}))

// Mock Next.js Link component
jest.mock('next/link', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        return <a {...props}>{children}</a>
    },
}))

// Mock next-auth
jest.mock('next-auth/react', () => ({
    useSession: jest.fn(() => ({
        data: null,
        status: 'unauthenticated',
    })),
    signIn: jest.fn(),
    signOut: jest.fn(),
    SessionProvider: ({ children }) => children,
}))

// Mock React Query
jest.mock('@tanstack/react-query', () => ({
    useQuery: jest.fn(),
    useMutation: jest.fn(),
    useQueryClient: jest.fn(),
    QueryClient: jest.fn(),
    QueryClientProvider: ({ children }) => children,
}))

// Mock Zustand stores
jest.mock('@/stores/auth', () => ({
    useAuthStore: jest.fn(() => ({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        clearError: jest.fn(),
    })),
}))

jest.mock('@/stores/notifications', () => ({
    useNotificationStore: jest.fn(() => ({
        notifications: [],
        unreadCount: 0,
        add: jest.fn(),
        remove: jest.fn(),
        markAsRead: jest.fn(),
        markAllAsRead: jest.fn(),
        clear: jest.fn(),
    })),
}))

jest.mock('@/stores/ui', () => ({
    useUIStore: jest.fn(() => ({
        theme: 'light',
        sidebarOpen: false,
        sidebarCollapsed: false,
        modals: [],
        globalLoading: false,
        setTheme: jest.fn(),
        toggleSidebar: jest.fn(),
        openModal: jest.fn(),
        closeModal: jest.fn(),
        setGlobalLoading: jest.fn(),
    })),
}))

jest.mock('@/stores/preferences', () => ({
    usePreferencesStore: jest.fn(() => ({
        preferences: {
            notifications: { email: true, push: false, inApp: true },
            dashboard: { showRecentActivity: true, compactMode: false },
            events: { defaultView: 'grid', autoRegister: false },
            clubs: { showAll: true, hideInactive: false },
            privacy: { profileVisibility: 'public', showEmail: false },
            accessibility: { highContrast: false, reducedMotion: false },
        },
        updatePreferences: jest.fn(),
        resetToDefaults: jest.fn(),
    })),
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // deprecated
        removeListener: jest.fn(), // deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
    constructor() { }
    disconnect() { }
    observe() { }
    unobserve() { }
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
    constructor() { }
    disconnect() { }
    observe() { }
    unobserve() { }
}

// Mock fetch if needed
global.fetch = jest.fn()

// Clean up after each test
afterEach(() => {
    jest.clearAllMocks()
})