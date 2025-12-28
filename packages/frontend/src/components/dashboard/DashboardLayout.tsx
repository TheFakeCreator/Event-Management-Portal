'use client';

import React, { ReactNode, useState } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/navigation/header';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Settings,
  Bell,
  Trophy,
  Building2,
  UserCog,
  BarChart3,
  FileText,
  ChevronLeft,
  ChevronRight,
  Menu,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
  badge?: number;
}

interface DashboardSidebarProps {
  role: 'user' | 'moderator' | 'admin' | 'member';
}

const userNavItems: NavItem[] = [
  {
    label: 'Overview',
    href: '/dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    label: 'My Events',
    href: '/dashboard/events',
    icon: <Calendar className="w-5 h-5" />,
  },
  {
    label: 'My Clubs',
    href: '/dashboard/clubs',
    icon: <Users className="w-5 h-5" />,
  },
  {
    label: 'Achievements',
    href: '/dashboard/achievements',
    icon: <Trophy className="w-5 h-5" />,
  },
  {
    label: 'Notifications',
    href: '/dashboard/notifications',
    icon: <Bell className="w-5 h-5" />,
  },
  {
    label: 'Settings',
    href: '/dashboard/settings',
    icon: <Settings className="w-5 h-5" />,
  },
];

const moderatorNavItems: NavItem[] = [
  {
    label: 'Overview',
    href: '/dashboard/moderator',
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    label: 'My Clubs',
    href: '/dashboard/moderator/clubs',
    icon: <Building2 className="w-5 h-5" />,
  },
  {
    label: 'Events',
    href: '/dashboard/moderator/events',
    icon: <Calendar className="w-5 h-5" />,
  },
  {
    label: 'Members',
    href: '/dashboard/moderator/members',
    icon: <Users className="w-5 h-5" />,
  },
  {
    label: 'Registrations',
    href: '/dashboard/moderator/registrations',
    icon: <FileText className="w-5 h-5" />,
  },
  {
    label: 'Analytics',
    href: '/dashboard/moderator/analytics',
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    label: 'Settings',
    href: '/dashboard/moderator/settings',
    icon: <Settings className="w-5 h-5" />,
  },
];

const adminNavItems: NavItem[] = [
  {
    label: 'Overview',
    href: '/dashboard/admin',
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    label: 'Users',
    href: '/dashboard/admin/users',
    icon: <UserCog className="w-5 h-5" />,
  },
  {
    label: 'Clubs',
    href: '/dashboard/admin/clubs',
    icon: <Building2 className="w-5 h-5" />,
  },
  {
    label: 'Events',
    href: '/dashboard/admin/events',
    icon: <Calendar className="w-5 h-5" />,
  },
  {
    label: 'Analytics',
    href: '/dashboard/admin/analytics',
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    label: 'Audit Logs',
    href: '/dashboard/admin/audit-logs',
    icon: <FileText className="w-5 h-5" />,
  },
  {
    label: 'Settings',
    href: '/dashboard/admin/settings',
    icon: <Settings className="w-5 h-5" />,
  },
];

function DashboardSidebar({ role }: DashboardSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems =
    role === 'admin'
      ? adminNavItems
      : role === 'moderator'
        ? moderatorNavItems
        : userNavItems; // 'user' or 'member' both get user nav items

  const SidebarContent = () => (
    <>
      <div className="flex items-center justify-between p-4 border-b">
        {!collapsed && (
          <h2 className="font-semibold text-lg">
            {role === 'admin'
              ? 'Admin'
              : role === 'moderator'
                ? 'Moderator'
                : 'User'}{' '}
            Dashboard
          </h2>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className={cn('hidden lg:flex', collapsed && 'mx-auto')}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </Button>
      </div>
      <nav className="p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center rounded-lg transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground',
                collapsed ? 'justify-center px-3 py-3' : 'space-x-3 px-3 py-2'
              )}
              title={collapsed ? item.label : undefined}
              onClick={() => setMobileOpen(false)}
            >
              <span className={collapsed ? 'w-6 h-6' : 'w-5 h-5'}>
                {item.icon}
              </span>
              {!collapsed && (
                <>
                  <span className="font-medium flex-1">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50"
      >
        <Menu className="w-5 h-5" />
      </Button>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed left-0 top-0 bottom-0 w-64 border-r bg-card z-50 lg:hidden overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold text-lg">
                {role === 'admin'
                  ? 'Admin'
                  : role === 'moderator'
                    ? 'Moderator'
                    : 'User'}{' '}
                Dashboard
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileOpen(false)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
            <SidebarContent />
          </aside>
        </>
      )}

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden lg:block border-r bg-card transition-all duration-300',
          collapsed ? 'w-20' : 'w-64'
        )}
      >
        <div className="sticky top-[64px] h-[calc(100vh-64px)] overflow-y-auto">
          <SidebarContent />
        </div>
      </aside>
    </>
  );
}

interface RoleBasedDashboardLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  actions?: ReactNode;
}

export function RoleBasedDashboardLayout({
  children,
  title,
  description,
  actions,
}: RoleBasedDashboardLayoutProps) {
  const { role } = usePermissions();

  return (
    <>
      <Header />
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar
          role={role as 'user' | 'moderator' | 'admin' | 'member'}
        />

        <main className="flex-1">
          {(title || description || actions) && (
            <div className="border-b bg-card">
              <div className="container mx-auto px-4 py-6">
                <div className="flex items-center justify-between">
                  <div>
                    {title && (
                      <h1 className="text-3xl font-bold tracking-tight">
                        {title}
                      </h1>
                    )}
                    {description && (
                      <p className="text-muted-foreground mt-1">
                        {description}
                      </p>
                    )}
                  </div>
                  {actions && (
                    <div className="flex items-center space-x-2">{actions}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="container mx-auto px-4 py-6">{children}</div>
        </main>
      </div>
    </>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: ReactNode;
}

export function StatCard({ title, value, change, trend, icon }: StatCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-2">{value}</p>
          {change && (
            <p
              className={cn(
                'text-sm mt-1',
                trend === 'up' && 'text-green-600',
                trend === 'down' && 'text-red-600',
                trend === 'neutral' && 'text-muted-foreground'
              )}
            >
              {change}
            </p>
          )}
        </div>
        <div className="p-3 bg-primary/10 rounded-lg">{icon}</div>
      </div>
    </Card>
  );
}
