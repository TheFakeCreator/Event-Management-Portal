'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RoleBasedDashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  User,
  Calendar,
  Activity,
} from 'lucide-react';

interface AuditLog {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  action: 'create' | 'update' | 'delete' | 'login' | 'logout';
  resource: string;
  resourceId?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export default function AuditLogsPage() {
  return (
    <ProtectedRoute requiredRole={['admin']}>
      <AuditLogs />
    </ProtectedRoute>
  );
}

function AuditLogs() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [resourceFilter, setResourceFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [logs, searchQuery, actionFilter, resourceFilter]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/admin/logs', {
        credentials: 'include',
      });

      if (!response.ok) {
        setLogs([]);
        setFilteredLogs([]);
        return;
      }

      const result = await response.json();
      const logsData = result.data?.logs || result.logs || [];
      setLogs(logsData);
      setFilteredLogs(logsData);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      setLogs([]);
      setFilteredLogs([]);
      toast({
        title: 'Info',
        message: 'No audit logs available',
        type: 'info',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = logs;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (log) =>
          log.userId.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.userId.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.details?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.resource.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Action filter
    if (actionFilter !== 'all') {
      filtered = filtered.filter((log) => log.action === actionFilter);
    }

    // Resource filter
    if (resourceFilter !== 'all') {
      filtered = filtered.filter((log) => log.resource === resourceFilter);
    }

    setFilteredLogs(filtered);
  };

  const handleExport = () => {
    const csv = [
      ['Timestamp', 'User', 'Action', 'Resource', 'Details', 'IP Address'].join(
        ','
      ),
      ...filteredLogs.map((log) =>
        [
          log.timestamp,
          log.userId.name,
          log.action,
          log.resource,
          log.details || '',
          log.ipAddress || '',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Success',
      message: 'Audit logs exported successfully',
      type: 'success',
    });
  };

  const getActionBadge = (action: string) => {
    const colors = {
      create: 'bg-green-100 text-green-700',
      update: 'bg-blue-100 text-blue-700',
      delete: 'bg-red-100 text-red-700',
      login: 'bg-purple-100 text-purple-700',
      logout: 'bg-gray-100 text-gray-700',
    };
    return colors[action as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (loading) {
    return (
      <RoleBasedDashboardLayout
        title="Audit Logs"
        description="Track all administrative actions and system events"
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading audit logs...</p>
          </div>
        </div>
      </RoleBasedDashboardLayout>
    );
  }

  return (
    <RoleBasedDashboardLayout
      title="Audit Logs"
      description="Track all administrative actions and system events"
      actions={
        <>
          <Button variant="outline" size="sm" onClick={() => fetchAuditLogs()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Filters */}
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user, action, or details..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Action Filter */}
            <div>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="logout">Logout</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Resource Filter */}
            <div>
              <Select value={resourceFilter} onValueChange={setResourceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Resources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Resources</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="club">Club</SelectItem>
                  <SelectItem value="auth">Auth</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredLogs.length} of {logs.length} logs
          </div>
        </Card>

        {/* Logs Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium">Timestamp</th>
                  <th className="text-left p-4 font-medium">User</th>
                  <th className="text-left p-4 font-medium">Action</th>
                  <th className="text-left p-4 font-medium">Resource</th>
                  <th className="text-left p-4 font-medium">Details</th>
                  <th className="text-left p-4 font-medium">IP Address</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center p-8 text-muted-foreground"
                    >
                      No audit logs found
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log._id} className="border-b hover:bg-muted/50">
                      <td className="p-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {formatTimestamp(log.timestamp)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm font-medium">
                              {log.userId.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {log.userId.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className={getActionBadge(log.action)}>
                          {log.action.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <span className="text-sm font-medium capitalize">
                          {log.resource}
                        </span>
                      </td>
                      <td className="p-4 text-sm max-w-xs truncate">
                        {log.details || '-'}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {log.ipAddress || '-'}
                      </td>
                      <td className="p-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedLog(log);
                            setShowDetails(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Details Modal */}
        {showDetails && selectedLog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="max-w-2xl w-full m-4 max-h-[80vh] overflow-y-auto">
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">Audit Log Details</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDetails(false)}
                  >
                    ✕
                  </Button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Timestamp
                    </label>
                    <p className="text-sm mt-1">
                      {new Date(selectedLog.timestamp).toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      User
                    </label>
                    <p className="text-sm mt-1">
                      {selectedLog.userId.name} ({selectedLog.userId.email})
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Action
                    </label>
                    <p className="text-sm mt-1">
                      <Badge className={getActionBadge(selectedLog.action)}>
                        {selectedLog.action.toUpperCase()}
                      </Badge>
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Resource
                    </label>
                    <p className="text-sm mt-1 capitalize">
                      {selectedLog.resource}
                    </p>
                  </div>

                  {selectedLog.resourceId && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Resource ID
                      </label>
                      <p className="text-sm mt-1 font-mono">
                        {selectedLog.resourceId}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Details
                    </label>
                    <p className="text-sm mt-1">
                      {selectedLog.details || 'N/A'}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      IP Address
                    </label>
                    <p className="text-sm mt-1">
                      {selectedLog.ipAddress || 'N/A'}
                    </p>
                  </div>

                  {selectedLog.userAgent && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        User Agent
                      </label>
                      <p className="text-sm mt-1 break-all">
                        {selectedLog.userAgent}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </RoleBasedDashboardLayout>
  );
}
