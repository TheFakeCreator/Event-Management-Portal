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
    getSession: jest.fn(() => Promise.resolve(null)),
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

// Mock Zustand notification store
const mockNotificationStore = {
    notifications: [],
    addNotification: jest.fn((notification) => 'mock-id'),
    removeNotification: jest.fn(),
    clearAll: jest.fn(),
    updateNotification: jest.fn(),
    success: jest.fn((title, message) => 'mock-id'),
    error: jest.fn((title, message) => 'mock-id'),
    warning: jest.fn((title, message) => 'mock-id'),
    info: jest.fn((title, message) => 'mock-id'),
}

// Mock the stores index file
jest.mock('@/stores', () => ({
    useNotificationStore: jest.fn(() => mockNotificationStore),
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