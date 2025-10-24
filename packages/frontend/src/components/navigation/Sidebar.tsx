'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Calendar,
  Users,
  Home,
  User,
  Settings,
  Bell,
  Plus,
  Search,
  TrendingUp,
  BookOpen,
  Award,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number | string;
  children?: SidebarItem[];
  requireAuth?: boolean;
  adminOnly?: boolean;
}

const sidebarItems: SidebarItem[] = [
  {
    label: 'Dashboard',
    href: ROUTES.DASHBOARD,
    icon: <Home className="w-5 h-5" />,
    requireAuth: true,
  },
  {
    label: 'Events',
    href: ROUTES.EVENTS,
    icon: <Calendar className="w-5 h-5" />,
    badge: 12,
    children: [
      {
        label: 'All Events',
        href: ROUTES.EVENTS,
        icon: <Calendar className="w-4 h-4" />,
      },
      {
        label: 'My Events',
        href: `${ROUTES.EVENTS}/my-events`,
        icon: <User className="w-4 h-4" />,
        requireAuth: true,
      },
      {
        label: 'Create Event',
        href: ROUTES.CREATE_EVENT,
        icon: <Plus className="w-4 h-4" />,
        requireAuth: true,
      },
      {
        label: 'Event Analytics',
        href: `${ROUTES.EVENTS}/analytics`,
        icon: <TrendingUp className="w-4 h-4" />,
        requireAuth: true,
      },
    ],
  },
  {
    label: 'Clubs',
    href: ROUTES.CLUBS,
    icon: <Users className="w-5 h-5" />,
    children: [
      {
        label: 'All Clubs',
        href: ROUTES.CLUBS,
        icon: <Users className="w-4 h-4" />,
      },
      {
        label: 'My Clubs',
        href: `${ROUTES.CLUBS}/my-clubs`,
        icon: <User className="w-4 h-4" />,
        requireAuth: true,
      },
      {
        label: 'Create Club',
        href: ROUTES.CREATE_CLUB,
        icon: <Plus className="w-4 h-4" />,
        requireAuth: true,
      },
    ],
  },
  {
    label: 'Explore',
    href: '/explore',
    icon: <Search className="w-5 h-5" />,
    children: [
      {
        label: 'Trending Events',
        href: '/explore/trending',
        icon: <TrendingUp className="w-4 h-4" />,
      },
      {
        label: 'Featured Clubs',
        href: '/explore/featured-clubs',
        icon: <Award className="w-4 h-4" />,
      },
      {
        label: 'Categories',
        href: '/explore/categories',
        icon: <BookOpen className="w-4 h-4" />,
      },
    ],
  },
  {
    label: 'Messages',
    href: '/messages',
    icon: <MessageSquare className="w-5 h-5" />,
    badge: 3,
    requireAuth: true,
  },
  {
    label: 'Notifications',
    href: '/notifications',
    icon: <Bell className="w-5 h-5" />,
    badge: 'new',
    requireAuth: true,
  },
];

const userItems: SidebarItem[] = [
  {
    label: 'Profile',
    href: ROUTES.PROFILE,
    icon: <User className="w-5 h-5" />,
    requireAuth: true,
  },
  {
    label: 'Settings',
    href: ROUTES.SETTINGS,
    icon: <Settings className="w-5 h-5" />,
    requireAuth: true,
  },
];

interface SidebarProps {
  className?: string;
  isMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({
  className,
  isMobile = false,
  isOpen = true,
  onClose,
}: SidebarProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuth();

  const toggleExpanded = (href: string) => {
    setExpandedItems((prev) =>
      prev.includes(href)
        ? prev.filter((item) => item !== href)
        : [...prev, href]
    );
  };

  const isItemActive = (item: SidebarItem) => {
    if (pathname === item.href) return true;
    if (item.children) {
      return item.children.some(
        (child) =>
          pathname === child.href || pathname.startsWith(child.href + '/')
      );
    }
    return pathname.startsWith(item.href + '/');
  };

  const shouldShowItem = (item: SidebarItem) => {
    if (item.requireAuth && !isAuthenticated) return false;
    if (item.adminOnly && (!user || user.role !== 'admin')) return false;
    return true;
  };

  const renderSidebarItem = (item: SidebarItem, depth = 0) => {
    if (!shouldShowItem(item)) return null;

    const isActive = isItemActive(item);
    const isExpanded = expandedItems.includes(item.href);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.href}>
        <div
          className={cn(
            'flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            depth > 0 && 'ml-4',
            isActive
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          )}
        >
          <Link
            href={item.href}
            className="flex items-center gap-3 flex-1"
            onClick={() => {
              if (isMobile && onClose) onClose();
            }}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.badge && (
              <Badge
                variant={isActive ? 'secondary' : 'outline'}
                className={cn(
                  'ml-auto text-xs',
                  isActive && 'bg-primary-foreground text-primary'
                )}
              >
                {item.badge}
              </Badge>
            )}
          </Link>

          {hasChildren && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 p-0"
              onClick={() => toggleExpanded(item.href)}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children!.map((child) => renderSidebarItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <Link href={ROUTES.HOME} className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">
              EM
            </span>
          </div>
          <span className="font-bold text-lg">Event Management</span>
        </Link>

        {isMobile && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 p-4">
        <div className="space-y-1">
          {sidebarItems.map((item) => renderSidebarItem(item))}
        </div>

        {isAuthenticated && (
          <>
            <div className="border-t pt-4 mt-4">
              <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Account
              </h3>
              <div className="space-y-1">
                {userItems.map((item) => renderSidebarItem(item))}
              </div>
            </div>

            {/* User Info */}
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground text-sm font-medium">
                    {user?.name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </nav>
    </div>
  );

  if (isMobile) {
    return (
      <>
        {isOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="fixed inset-0 bg-background/80 backdrop-blur-sm"
              onClick={onClose}
            />
            <div className="fixed left-0 top-0 h-full w-80 bg-background border-r shadow-lg">
              {sidebarContent}
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className={cn('w-80 bg-background border-r h-full', className)}>
      {sidebarContent}
    </div>
  );
}

export function MobileSidebarTrigger() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setIsOpen(true)}
      >
        <Menu className="w-5 h-5" />
      </Button>

      <Sidebar isMobile isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
