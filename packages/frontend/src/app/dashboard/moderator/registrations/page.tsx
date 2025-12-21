'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  RoleBasedDashboardLayout,
  StatCard,
} from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import {
  FileText,
  Search,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  Mail,
  Clock,
} from 'lucide-react';
import { moderatorApi } from '@/services/moderator.service';

interface Registration {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  eventId: {
    _id: string;
    title: string;
    startDate: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: {
    _id: string;
    name: string;
  };
}

export default function ModeratorRegistrationsPage() {
  return (
    <ProtectedRoute requiredRole={['moderator', 'admin']}>
      <RegistrationsManagement />
    </ProtectedRoute>
  );
}

function RegistrationsManagement() {
  const { toast } = useToast();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState<
    Registration[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'pending' | 'approved' | 'rejected'
  >('pending');

  useEffect(() => {
    fetchRegistrations();
  }, []);

  useEffect(() => {
    filterRegistrations();
  }, [registrations, searchQuery, statusFilter]);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const data = await moderatorApi.registrations.getPending();
      setRegistrations(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        message: error.message || 'Failed to fetch registrations',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterRegistrations = () => {
    let filtered = [...registrations];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((reg) => reg.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (reg) =>
          reg.userId.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          reg.userId.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          reg.eventId.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredRegistrations(filtered);
  };

  const handleApprove = async (registrationId: string) => {
    try {
      await moderatorApi.registrations.approve(registrationId);
      toast({
        title: 'Success',
        message: 'Registration approved successfully',
        type: 'success',
      });

      // Update local state
      setRegistrations((prev) =>
        prev.map((reg) =>
          reg._id === registrationId
            ? {
                ...reg,
                status: 'approved' as const,
                reviewedAt: new Date().toISOString(),
              }
            : reg
        )
      );
    } catch (error: any) {
      toast({
        title: 'Error',
        message: error.message || 'Failed to approve registration',
        type: 'error',
      });
    }
  };

  const handleReject = async (registrationId: string) => {
    if (!confirm('Are you sure you want to reject this registration?')) return;

    try {
      await moderatorApi.registrations.reject(registrationId);
      toast({
        title: 'Success',
        message: 'Registration rejected',
        type: 'success',
      });

      // Update local state
      setRegistrations((prev) =>
        prev.map((reg) =>
          reg._id === registrationId
            ? {
                ...reg,
                status: 'rejected' as const,
                reviewedAt: new Date().toISOString(),
              }
            : reg
        )
      );
    } catch (error: any) {
      toast({
        title: 'Error',
        message: error.message || 'Failed to reject registration',
        type: 'error',
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline' as any;
    }
  };

  if (loading) {
    return (
      <RoleBasedDashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </RoleBasedDashboardLayout>
    );
  }

  const stats = {
    total: registrations.length,
    pending: registrations.filter((r) => r.status === 'pending').length,
    approved: registrations.filter((r) => r.status === 'approved').length,
    rejected: registrations.filter((r) => r.status === 'rejected').length,
  };

  return (
    <RoleBasedDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Registration Management</h1>
          <p className="text-muted-foreground mt-1">
            Review and manage event registrations
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-4">
          <StatCard
            title="Total Registrations"
            value={stats.total}
            icon={<FileText className="w-6 h-6 text-primary" />}
          />
          <StatCard
            title="Pending Review"
            value={stats.pending}
            icon={<Clock className="w-6 h-6 text-yellow-500" />}
          />
          <StatCard
            title="Approved"
            value={stats.approved}
            icon={<CheckCircle className="w-6 h-6 text-green-500" />}
          />
          <StatCard
            title="Rejected"
            value={stats.rejected}
            icon={<XCircle className="w-6 h-6 text-red-500" />}
          />
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or event..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('pending')}
              >
                Pending
              </Button>
              <Button
                variant={statusFilter === 'approved' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('approved')}
              >
                Approved
              </Button>
              <Button
                variant={statusFilter === 'rejected' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('rejected')}
              >
                Rejected
              </Button>
            </div>
          </div>
        </Card>

        {/* Registrations List */}
        {filteredRegistrations.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No registrations found
              </h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== 'pending'
                  ? 'Try adjusting your filters'
                  : 'No pending registrations at the moment'}
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRegistrations.map((registration) => (
              <Card key={registration._id} className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    {/* Status Badge */}
                    <Badge variant={getStatusBadgeVariant(registration.status)}>
                      {registration.status}
                    </Badge>

                    {/* User Info */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <h3 className="font-semibold">
                          {registration.userId.name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        <span>{registration.userId.email}</span>
                      </div>
                    </div>

                    {/* Event Info */}
                    <div className="text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>Event: {registration.eventId.title}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground mt-1">
                        <Clock className="w-4 h-4" />
                        <span>
                          Submitted:{' '}
                          {new Date(registration.submittedAt).toLocaleString()}
                        </span>
                      </div>
                      {registration.reviewedAt && (
                        <div className="flex items-center gap-2 text-muted-foreground mt-1">
                          <CheckCircle className="w-4 h-4" />
                          <span>
                            Reviewed:{' '}
                            {new Date(registration.reviewedAt).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {registration.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => handleApprove(registration._id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleReject(registration._id)}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Summary */}
        {filteredRegistrations.length > 0 && (
          <Card className="p-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Showing {filteredRegistrations.length} registrations</span>
              <span>
                {stats.pending} pending | {stats.approved} approved |{' '}
                {stats.rejected} rejected
              </span>
            </div>
          </Card>
        )}
      </div>
    </RoleBasedDashboardLayout>
  );
}
