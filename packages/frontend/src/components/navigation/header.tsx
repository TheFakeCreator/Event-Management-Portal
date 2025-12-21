'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, User, Settings, LogOut, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore, useNotificationCount, useSidebar } from '@/stores';
import { usePermissions } from '@/hooks/usePermissions';

interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  badge?: number;
}

const mainNavItems: NavItem[] = [
  { label: 'Dashboard', href: ROUTES.DASHBOARD },
  { label: 'Events', href: ROUTES.EVENTS },
  { label: 'Clubs', href: ROUTES.CLUBS },
  { label: 'About', href: ROUTES.ABOUT },
];

const getUserMenuItems = (
  isAdmin: boolean,
  isModerator: boolean
): NavItem[] => {
  const items: NavItem[] = [
    {
      label: 'Profile',
      href: ROUTES.PROFILE,
      icon: <User className="w-4 h-4" />,
    },
    {
      label: 'Settings',
      href: ROUTES.SETTINGS,
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  // Add admin dashboard link
  if (isAdmin) {
    items.unshift({
      label: 'Admin Dashboard',
      href: '/dashboard/admin',
      icon: <Settings className="w-4 h-4" />,
    });
  }

  // Add moderator dashboard link
  if (isModerator && !isAdmin) {
    items.unshift({
      label: 'Moderator Dashboard',
      href: '/dashboard/moderator',
      icon: <Settings className="w-4 h-4" />,
    });
  }

  return items;
};

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const pathname = usePathname();

  // Use both old hook and new store for compatibility
  const {
    user: legacyUser,
    isAuthenticated: legacyAuth,
    logout: legacyLogout,
  } = useAuth();
  const {
    user: storeUser,
    isAuthenticated: storeAuth,
    logout: storeLogout,
  } = useAuthStore();
  const notificationCount = useNotificationCount();
  const { toggle: toggleSidebar } = useSidebar();
  const { canCreateEvent, getDashboardRoute, isAdmin, isModerator } =
    usePermissions();

  // Use store data if available, fallback to legacy hook
  const user = storeUser || legacyUser;
  const isAuthenticated = storeAuth || legacyAuth;
  const logout = storeUser ? storeLogout : legacyLogout;

  // Get dynamic user menu items based on role
  const userMenuItems = getUserMenuItems(isAdmin, isModerator);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const toggleUserMenu = () => setIsUserMenuOpen(!isUserMenuOpen);

  const userMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    }

    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsUserMenuOpen(false);
      }
    }

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isUserMenuOpen]);

  const handleSignOut = () => {
    setIsUserMenuOpen(false);
    logout();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <Link href={ROUTES.HOME} className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">
                  EM
                </span>
              </div>
              <span className="font-bold text-lg hidden sm:inline-block">
                Event Management
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {mainNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary',
                  pathname === item.href
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
              >
                {item.label}
                {item.badge && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            ))}
          </nav>

          {/* Desktop User Menu & Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Theme Toggle */}
            <ThemeToggle />

            {isAuthenticated && user ? (
              <>
                {/* Create Event Button - Only for Moderators & Admins */}
                {canCreateEvent() && (
                  <Button asChild variant="default" size="sm">
                    <Link href="/events/create">Create Event</Link>
                  </Button>
                )}

                {/* Notifications */}
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-4 h-4" />
                  {notificationCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-2 -right-2 w-5 h-5 text-xs p-0 flex items-center justify-center"
                    >
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </Badge>
                  )}
                </Button>

                {/* User Menu */}
                <div className="relative" ref={userMenuRef}>
                  <Button
                    variant="ghost"
                    onClick={toggleUserMenu}
                    className="flex items-center space-x-2"
                  >
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-primary-foreground text-sm font-medium">
                        {user.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <span className="text-sm font-medium">{user.name}</span>
                  </Button>

                  {/* User Dropdown */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-background border rounded-md shadow-lg py-1 z-50">
                      <div className="px-4 py-2 border-b">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                      {userMenuItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="flex items-center px-4 py-2 text-sm hover:bg-accent"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          {item.icon}
                          <span className="ml-2">{item.label}</span>
                        </Link>
                      ))}
                      <div className="border-t">
                        <button
                          onClick={handleSignOut}
                          className="flex items-center w-full px-4 py-2 text-sm text-destructive hover:bg-accent"
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="ml-2">Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link href={ROUTES.LOGIN}>Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href={ROUTES.REGISTER}>Sign Up</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={toggleMobileMenu}
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-background">
            <nav className="px-2 pt-2 pb-4 space-y-1">
              {mainNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'block px-3 py-2 rounded-md text-base font-medium transition-colors',
                    pathname === item.href
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                  {item.badge && (
                    <Badge variant="secondary" className="ml-2">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              ))}

              {isAuthenticated && user && (
                <div className="border-t pt-4 mt-4">
                  <div className="px-3 py-2">
                    <p className="text-base font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  {userMenuItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-destructive hover:bg-accent"
                  >
                    Sign Out
                  </button>
                </div>
              )}

              {!isAuthenticated && (
                <div className="border-t pt-4 mt-4 space-y-1">
                  <Link
                    href={ROUTES.LOGIN}
                    className="block px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href={ROUTES.REGISTER}
                    className="block px-3 py-2 rounded-md text-base font-medium bg-primary text-primary-foreground"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
