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
import { Checkbox } from '@/components/ui/checkbox';
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

  // Bulk operations state
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

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

      const response = await fetch('/api/admin/users', {
        credentials: 'include',
      });

      console.log('[Admin Users] Response status:', response.status);

      if (!response.ok) {
        console.log('[Admin Users] Response not OK');
        setUsers([]);
        return;
      }

      const result = await response.json();
      console.log('[Admin Users] Raw API response:', result);

      const usersData = result.data?.users || result.users || [];
      console.log('[Admin Users] Extracted users data:', usersData);
      console.log('[Admin Users] Number of users:', usersData.length);

      // Map backend response to frontend format
      const mappedUsers = usersData.map((user: any) => ({
        _id: user.id || user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.isVerified ? 'active' : 'pending',
        joinedAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      }));

      console.log('[Admin Users] Mapped users:', mappedUsers);
      setUsers(mappedUsers);
    } catch (error) {
      console.error('[Admin Users] Failed to fetch users:', error);
      setUsers([]);
      toast({
        title: 'Info',
        message: 'No users data available',
        type: 'info',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    try {
      const response = await fetch('/api/admin/assign-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (!response.ok) {
        throw new Error('Failed to update role');
      }

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
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to suspend user');
      }

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
      const response = await fetch('/api/admin/assign-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ userId, role: 'user' }),
      });

      if (!response.ok) {
        throw new Error('Failed to activate user');
      }

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
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Bulk operation handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(new Set(filteredUsers.map((u) => u._id)));
    } else {
      setSelectedUsers(new Set());
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    const newSelected = new Set(selectedUsers);
    if (checked) {
      newSelected.add(userId);
    } else {
      newSelected.delete(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleBulkRoleUpdate = async (newRole: UserRole) => {
    if (selectedUsers.size === 0) {
      toast({
        title: 'No users selected',
        message: 'Please select users to update',
        type: 'error',
      });
      return;
    }

    if (
      !confirm(
        `Are you sure you want to change role to "${newRole}" for ${selectedUsers.size} user(s)?`
      )
    ) {
      return;
    }

    try {
      setBulkActionLoading(true);
      // TODO: API call
      // await fetch('/api/v1/admin/users/bulk/role', {
      //   method: 'PUT',
      //   body: JSON.stringify({ userIds: Array.from(selectedUsers), role: newRole }),
      // });

      setUsers((prev) =>
        prev.map((u) =>
          selectedUsers.has(u._id) ? { ...u, role: newRole } : u
        )
      );

      toast({
        title: 'Success',
        message: `Updated ${selectedUsers.size} user(s) role to ${newRole}`,
        type: 'success',
      });
      setSelectedUsers(new Set());
    } catch (error) {
      console.error('Failed to update roles:', error);
      toast({
        title: 'Error',
        message: 'Failed to update user roles',
        type: 'error',
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkActivate = async () => {
    if (selectedUsers.size === 0) {
      toast({
        title: 'No users selected',
        message: 'Please select users to activate',
        type: 'error',
      });
      return;
    }

    try {
      setBulkActionLoading(true);
      // TODO: API call
      // await fetch('/api/v1/admin/users/bulk/activate', {
      //   method: 'POST',
      //   body: JSON.stringify({ userIds: Array.from(selectedUsers) }),
      // });

      setUsers((prev) =>
        prev.map((u) =>
          selectedUsers.has(u._id) ? { ...u, status: 'active' } : u
        )
      );

      toast({
        title: 'Success',
        message: `Activated ${selectedUsers.size} user(s)`,
        type: 'success',
      });
      setSelectedUsers(new Set());
    } catch (error) {
      console.error('Failed to activate users:', error);
      toast({
        title: 'Error',
        message: 'Failed to activate users',
        type: 'error',
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkSuspend = async () => {
    if (selectedUsers.size === 0) {
      toast({
        title: 'No users selected',
        message: 'Please select users to suspend',
        type: 'error',
      });
      return;
    }

    if (
      !confirm(
        `Are you sure you want to suspend ${selectedUsers.size} user(s)?`
      )
    ) {
      return;
    }

    try {
      setBulkActionLoading(true);
      // TODO: API call
      // await fetch('/api/v1/admin/users/bulk/suspend', {
      //   method: 'POST',
      //   body: JSON.stringify({ userIds: Array.from(selectedUsers) }),
      // });

      setUsers((prev) =>
        prev.map((u) =>
          selectedUsers.has(u._id) ? { ...u, status: 'suspended' } : u
        )
      );

      toast({
        title: 'Success',
        message: `Suspended ${selectedUsers.size} user(s)`,
        type: 'success',
      });
      setSelectedUsers(new Set());
    } catch (error) {
      console.error('Failed to suspend users:', error);
      toast({
        title: 'Error',
        message: 'Failed to suspend users',
        type: 'error',
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.size === 0) {
      toast({
        title: 'No users selected',
        message: 'Please select users to delete',
        type: 'error',
      });
      return;
    }

    if (
      !confirm(
        `⚠️ WARNING: Are you sure you want to permanently delete ${selectedUsers.size} user(s)? This action cannot be undone!`
      )
    ) {
      return;
    }

    try {
      setBulkActionLoading(true);
      // TODO: API call
      // await fetch('/api/v1/admin/users/bulk/delete', {
      //   method: 'DELETE',
      //   body: JSON.stringify({ userIds: Array.from(selectedUsers) }),
      // });

      setUsers((prev) => prev.filter((u) => !selectedUsers.has(u._id)));

      toast({
        title: 'Success',
        message: `Deleted ${selectedUsers.size} user(s)`,
        type: 'success',
      });
      setSelectedUsers(new Set());
    } catch (error) {
      console.error('Failed to delete users:', error);
      toast({
        title: 'Error',
        message: 'Failed to delete users',
        type: 'error',
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleExportSelected = () => {
    const usersToExport = users.filter((u) => selectedUsers.has(u._id));
    const csv = [
      ['Name', 'Email', 'Role', 'Status', 'Joined Date'],
      ...usersToExport.map((u) => [
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
        <div className="flex gap-2">
          {selectedUsers.size > 0 && (
            <Button
              variant="outline"
              onClick={handleExportSelected}
              disabled={bulkActionLoading}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Selected ({selectedUsers.size})
            </Button>
          )}
          <Button onClick={handleExportUsers}>
            <Download className="w-4 h-4 mr-2" />
            Export All CSV
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Bulk Actions Bar */}
        {selectedUsers.size > 0 && (
          <Card className="p-4 bg-primary/5 border-primary">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-medium">
                {selectedUsers.size} user(s) selected
              </span>
              <div className="flex flex-wrap gap-2 ml-auto">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={bulkActionLoading}
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Change Role
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      onClick={() => handleBulkRoleUpdate('user')}
                    >
                      Set as User
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleBulkRoleUpdate('member')}
                    >
                      Set as Member
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleBulkRoleUpdate('moderator')}
                    >
                      Set as Moderator
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleBulkRoleUpdate('admin')}
                    >
                      Set as Admin
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkActivate}
                  disabled={bulkActionLoading}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Activate
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkSuspend}
                  disabled={bulkActionLoading}
                >
                  <Ban className="w-4 h-4 mr-2" />
                  Suspend
                </Button>

                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleBulkDelete}
                  disabled={bulkActionLoading}
                >
                  Delete
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedUsers(new Set())}
                  disabled={bulkActionLoading}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </Card>
        )}
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
            {/* Select All Header */}
            {filteredUsers.length > 0 && (
              <div className="flex items-center gap-3 p-3 border-b">
                <Checkbox
                  checked={
                    selectedUsers.size === filteredUsers.length &&
                    filteredUsers.length > 0
                  }
                  onCheckedChange={handleSelectAll}
                  id="select-all"
                />
                <label
                  htmlFor="select-all"
                  className="text-sm font-medium cursor-pointer"
                >
                  Select All ({filteredUsers.length})
                </label>
              </div>
            )}

            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center gap-3 p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <Checkbox
                    checked={selectedUsers.has(user._id)}
                    onCheckedChange={(checked) =>
                      handleSelectUser(user._id, checked as boolean)
                    }
                    id={`select-${user._id}`}
                  />

                  <div className="flex items-center justify-between flex-1">
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
                            Joined:{' '}
                            {new Date(user.joinedAt).toLocaleDateString()}
                          </p>
                          {user.lastLoginAt && (
                            <>
                              <span className="text-xs text-muted-foreground">
                                •
                              </span>
                              <p className="text-xs text-muted-foreground">
                                Last login:{' '}
                                {new Date(
                                  user.lastLoginAt
                                ).toLocaleDateString()}
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
