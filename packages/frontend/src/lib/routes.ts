export interface RouteConfig {
  path: string;
  title: string;
  description?: string;
  requireAuth?: boolean;
  adminOnly?: boolean;
  showInNav?: boolean;
  showInSidebar?: boolean;
  icon?: string;
  badge?: string | number;
  parent?: string;
  children?: string[];
}

export const ROUTE_CONFIG: Record<string, RouteConfig> = {
  home: {
    path: '/',
    title: 'Home',
    description: 'Welcome to Event Management Portal',
    showInNav: true,
    icon: 'Home',
  },

  dashboard: {
    path: '/dashboard',
    title: 'Dashboard',
    description: 'Your personal dashboard',
    requireAuth: true,
    showInNav: true,
    showInSidebar: true,
    icon: 'LayoutDashboard',
  },

  // Events
  events: {
    path: '/events',
    title: 'Events',
    description: 'Discover amazing events',
    showInNav: true,
    showInSidebar: true,
    icon: 'Calendar',
    children: ['events/my-events', 'events/create', 'events/analytics'],
  },

  'events/my-events': {
    path: '/events/my-events',
    title: 'My Events',
    description: "Events you've created or registered for",
    requireAuth: true,
    parent: 'events',
    icon: 'User',
  },

  'events/create': {
    path: '/events/create',
    title: 'Create Event',
    description: 'Create a new event',
    requireAuth: true,
    parent: 'events',
    icon: 'Plus',
  },

  'events/analytics': {
    path: '/events/analytics',
    title: 'Event Analytics',
    description: 'View event performance and statistics',
    requireAuth: true,
    parent: 'events',
    icon: 'TrendingUp',
  },

  // Clubs
  clubs: {
    path: '/clubs',
    title: 'Clubs',
    description: 'Join communities that match your interests',
    showInNav: true,
    showInSidebar: true,
    icon: 'Users',
    children: ['clubs/my-clubs', 'clubs/create'],
  },

  'clubs/my-clubs': {
    path: '/clubs/my-clubs',
    title: 'My Clubs',
    description: "Clubs you've joined or manage",
    requireAuth: true,
    parent: 'clubs',
    icon: 'User',
  },

  'clubs/create': {
    path: '/clubs/create',
    title: 'Create Club',
    description: 'Start a new club',
    requireAuth: true,
    parent: 'clubs',
    icon: 'Plus',
  },

  // Explore
  explore: {
    path: '/explore',
    title: 'Explore',
    description: 'Discover new events and clubs',
    showInSidebar: true,
    icon: 'Search',
    children: [
      'explore/trending',
      'explore/featured-clubs',
      'explore/categories',
    ],
  },

  'explore/trending': {
    path: '/explore/trending',
    title: 'Trending Events',
    description: 'Popular events happening now',
    parent: 'explore',
    icon: 'TrendingUp',
  },

  'explore/featured-clubs': {
    path: '/explore/featured-clubs',
    title: 'Featured Clubs',
    description: 'Featured clubs in your area',
    parent: 'explore',
    icon: 'Award',
  },

  'explore/categories': {
    path: '/explore/categories',
    title: 'Categories',
    description: 'Browse events and clubs by category',
    parent: 'explore',
    icon: 'BookOpen',
  },

  // User
  profile: {
    path: '/profile',
    title: 'Profile',
    description: 'Your profile and account information',
    requireAuth: true,
    showInSidebar: true,
    icon: 'User',
  },

  settings: {
    path: '/settings',
    title: 'Settings',
    description: 'Manage your account settings',
    requireAuth: true,
    showInSidebar: true,
    icon: 'Settings',
  },

  // Communication
  messages: {
    path: '/messages',
    title: 'Messages',
    description: 'Your messages and conversations',
    requireAuth: true,
    showInSidebar: true,
    icon: 'MessageSquare',
    badge: 3,
  },

  notifications: {
    path: '/notifications',
    title: 'Notifications',
    description: 'Your notifications and updates',
    requireAuth: true,
    showInSidebar: true,
    icon: 'Bell',
    badge: 'new',
  },

  // Auth
  login: {
    path: '/auth/login',
    title: 'Sign In',
    description: 'Sign in to your account',
    showInNav: false,
  },

  register: {
    path: '/auth/signup',
    title: 'Sign Up',
    description: 'Create a new account',
    showInNav: false,
  },

  // Static
  about: {
    path: '/about',
    title: 'About',
    description: 'Learn more about our platform',
    showInNav: true,
  },

  // Admin (future)
  admin: {
    path: '/admin',
    title: 'Admin Dashboard',
    description: 'Administrative dashboard',
    requireAuth: true,
    adminOnly: true,
    icon: 'Shield',
  },

  'admin/users': {
    path: '/admin/users',
    title: 'Manage Users',
    description: 'User management',
    requireAuth: true,
    adminOnly: true,
    parent: 'admin',
    icon: 'Users',
  },

  'admin/events': {
    path: '/admin/events',
    title: 'Manage Events',
    description: 'Event management',
    requireAuth: true,
    adminOnly: true,
    parent: 'admin',
    icon: 'Calendar',
  },

  'admin/clubs': {
    path: '/admin/clubs',
    title: 'Manage Clubs',
    description: 'Club management',
    requireAuth: true,
    adminOnly: true,
    parent: 'admin',
    icon: 'Users',
  },
};

// Helper functions
export function getRouteConfig(path: string): RouteConfig | undefined {
  // First try exact match
  for (const [key, config] of Object.entries(ROUTE_CONFIG)) {
    if (config.path === path) {
      return config;
    }
  }

  // Then try partial match for dynamic routes
  for (const [key, config] of Object.entries(ROUTE_CONFIG)) {
    if (path.startsWith(config.path + '/')) {
      return config;
    }
  }

  return undefined;
}

export function getNavigationItems(
  options: {
    includeAuth?: boolean;
    includeAdmin?: boolean;
    isAuthenticated?: boolean;
    userRole?: string;
  } = {}
) {
  const {
    includeAuth = true,
    includeAdmin = false,
    isAuthenticated = false,
    userRole,
  } = options;

  return Object.values(ROUTE_CONFIG).filter((route) => {
    // Filter out routes that shouldn't be shown in navigation
    if (!route.showInNav && !route.showInSidebar) return false;

    // Filter auth-required routes
    if (route.requireAuth && !isAuthenticated && includeAuth) return false;

    // Filter admin routes
    if (route.adminOnly && (!includeAdmin || userRole !== 'admin'))
      return false;

    return true;
  });
}

export function getSidebarItems(
  options: {
    isAuthenticated?: boolean;
    userRole?: string;
  } = {}
) {
  const { isAuthenticated = false, userRole } = options;

  return Object.values(ROUTE_CONFIG).filter((route) => {
    // Only show routes marked for sidebar
    if (!route.showInSidebar) return false;

    // Filter auth-required routes
    if (route.requireAuth && !isAuthenticated) return false;

    // Filter admin routes
    if (route.adminOnly && userRole !== 'admin') return false;

    return true;
  });
}

export function getBreadcrumbItems(
  path: string
): Array<{ label: string; href: string; current?: boolean }> {
  const segments = path.split('/').filter(Boolean);
  const breadcrumbs: Array<{ label: string; href: string; current?: boolean }> =
    [];

  let currentPath = '';

  for (let i = 0; i < segments.length; i++) {
    currentPath += `/${segments[i]}`;
    const config = getRouteConfig(currentPath);
    const isLast = i === segments.length - 1;

    breadcrumbs.push({
      label:
        config?.title ||
        segments[i].charAt(0).toUpperCase() + segments[i].slice(1),
      href: currentPath,
      current: isLast,
    });
  }

  return breadcrumbs;
}
