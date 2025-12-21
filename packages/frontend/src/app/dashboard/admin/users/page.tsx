'use client';

import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  RoleBasedDashboardLayout,
  StatCard,
} from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import {
  Users,
  Search,
  Filter,
  MoreVertical,
  Mail,
  Shield,
  Ban,
  CheckCircle,
  UserCog,
  Download,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type UserRole = 'user' | 'member' | 'moderator' | 'admin';
type UserStatus = 'active' | 'suspended' | 'pending';

interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  joinedAt: string;
  lastLoginAt?: string;
  avatar?: string;
}

export default function AdminUsersPage() {
  return (
    <ProtectedRoute requiredRole={['admin']}>
      <AdminUsersManagement />
    </ProtectedRoute>
  );
}

function AdminUsersManagement() {
  const { toast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    let filtered = users.filter(
      (user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (roleFilter !== 'all') {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((user) => user.status === statusFilter);
    }

    setFilteredUsers(filtered);
  }, [searchQuery, roleFilter, statusFilter, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await fetch('/api/v1/admin/users');
      // const data = await response.json();

      // Mock data
      setUsers([
        {
          _id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'user',
          status: 'active',
          joinedAt: '2024-01-15',
          lastLoginAt: '2025-01-20',
        },
        {
          _id: '2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          role: 'moderator',
          status: 'active',
          joinedAt: '2023-09-20',
          lastLoginAt: '2025-01-19',
        },
        {
          _id: '3',
          name: 'Bob Johnson',
          email: 'bob@example.com',
          role: 'user',
          status: 'suspended',
          joinedAt: '2024-12-10',
        },
        {
          _id: '4',
          name: 'Alice Williams',
          email: 'alice@example.com',
          role: 'member',
          status: 'active',
          joinedAt: '2024-11-05',
          lastLoginAt: '2025-01-18',
        },
        {
          _id: '5',
          name: 'Charlie Brown',
          email: 'charlie@example.com',
          role: 'user',
          status: 'pending',
          joinedAt: '2025-01-20',
        },
      ]);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast({
        title: 'Error',
        message: 'Failed to load users',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    try {
      // TODO: API call
      // await fetch(`/api/v1/admin/users/${userId}/role`, {
      //   method: 'PUT',
      //   body: JSON.stringify({ role: newRole }),
      // });

      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
      );
      toast({
        title: 'Success',
        message: 'User role updated successfully',
        type: 'success',
      });
    } catch (error) {
      console.error('Failed to update role:', error);
      toast({
        title: 'Error',
        message: 'Failed to update user role',
        type: 'error',
      });
    }
  };

  const handleSuspendUser = async (userId: string) => {
    if (!confirm('Are you sure you want to suspend this user?')) return;

    try {
      // TODO: API call
      // await fetch(`/api/v1/admin/users/${userId}/suspend`, {
      //   method: 'POST',
      // });

      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, status: 'suspended' } : u))
      );
      toast({
        title: 'Success',
        message: 'User suspended successfully',
        type: 'success',
      });
    } catch (error) {
      console.error('Failed to suspend user:', error);
      toast({
        title: 'Error',
        message: 'Failed to suspend user',
        type: 'error',
      });
    }
  };

  const handleActivateUser = async (userId: string) => {
    try {
      // TODO: API call
      // await fetch(`/api/v1/admin/users/${userId}/activate`, {
      //   method: 'POST',
      // });

      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, status: 'active' } : u))
      );
      toast({
        title: 'Success',
        message: 'User activated successfully',
        type: 'success',
      });
    } catch (error) {
      console.error('Failed to activate user:', error);
      toast({
        title: 'Error',
        message: 'Failed to activate user',
        type: 'error',
      });
    }
  };

  const handleExportUsers = () => {
    const csv = [
      ['Name', 'Email', 'Role', 'Status', 'Joined Date'],
      ...filteredUsers.map((u) => [
        u.name,
        u.email,
        u.role,
        u.status,
        new Date(u.joinedAt).toLocaleDateString(),
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'moderator':
        return 'default';
      case 'member':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusBadgeVariant = (status: UserStatus) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'suspended':
        return 'destructive';
      case 'pending':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <RoleBasedDashboardLayout
        title="User Management"
        description="Loading..."
      >
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-lg" />
          ))}
        </div>
      </RoleBasedDashboardLayout>
    );
  }

  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === 'active').length,
    suspended: users.filter((u) => u.status === 'suspended').length,
    pending: users.filter((u) => u.status === 'pending').length,
  };

  return (
    <RoleBasedDashboardLayout
      title="User Management"
      description="Manage all platform users and their permissions"
      actions={
        <Button onClick={handleExportUsers}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-4">
          <StatCard
            title="Total Users"
            value={stats.total}
            icon={<Users className="w-6 h-6 text-primary" />}
          />
          <StatCard
            title="Active Users"
            value={stats.active}
            icon={<CheckCircle className="w-6 h-6 text-green-500" />}
          />
          <StatCard
            title="Suspended"
            value={stats.suspended}
            icon={<Ban className="w-6 h-6 text-red-500" />}
          />
          <StatCard
            title="Pending"
            value={stats.pending}
            icon={<UserCog className="w-6 h-6 text-yellow-500" />}
          />
        </div>

        {/* Filters and Search */}
        <Card className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              value={roleFilter}
              onValueChange={(value) =>
                setRoleFilter(value as UserRole | 'all')
              }
            >
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="user">Users</SelectItem>
                <SelectItem value="member">Members</SelectItem>
                <SelectItem value="moderator">Moderators</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as UserStatus | 'all')
              }
            >
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Users Table */}
        <Card className="p-6">
          <div className="space-y-3">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-lg font-semibold text-primary">
                        {user.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{user.name}</h3>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        <span>{user.email}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-muted-foreground">
                          Joined: {new Date(user.joinedAt).toLocaleDateString()}
                        </p>
                        {user.lastLoginAt && (
                          <>
                            <span className="text-xs text-muted-foreground">
                              •
                            </span>
                            <p className="text-xs text-muted-foreground">
                              Last login:{' '}
                              {new Date(user.lastLoginAt).toLocaleDateString()}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {user.role}
                    </Badge>
                    <Badge variant={getStatusBadgeVariant(user.status)}>
                      {user.status}
                    </Badge>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleUpdateRole(user._id, 'user')}
                        >
                          <Users className="w-4 h-4 mr-2" />
                          Make User
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleUpdateRole(user._id, 'member')}
                        >
                          <Shield className="w-4 h-4 mr-2" />
                          Make Member
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleUpdateRole(user._id, 'moderator')
                          }
                        >
                          <UserCog className="w-4 h-4 mr-2" />
                          Make Moderator
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleUpdateRole(user._id, 'admin')}
                        >
                          <Shield className="w-4 h-4 mr-2" />
                          Make Admin
                        </DropdownMenuItem>
                        {user.status === 'active' ? (
                          <DropdownMenuItem
                            onClick={() => handleSuspendUser(user._id)}
                            className="text-destructive"
                          >
                            <Ban className="w-4 h-4 mr-2" />
                            Suspend User
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => handleActivateUser(user._id)}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Activate User
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No users found</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </RoleBasedDashboardLayout>
  );
}
