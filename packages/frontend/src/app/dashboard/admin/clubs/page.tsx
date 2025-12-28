'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RoleBasedDashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import {
  Building2,
  Plus,
  Edit3,
  Trash2,
  Search,
  Users,
  Calendar,
  Shield,
} from 'lucide-react';
import Link from 'next/link';
import { adminApi, type AdminClub } from '@/services/admin.service';

export default function AdminClubsPage() {
  return (
    <ProtectedRoute requiredRole={['admin']}>
      <ClubsManagement />
    </ProtectedRoute>
  );
}

function ClubsManagement() {
  const { toast } = useToast();
  const [clubs, setClubs] = useState<AdminClub[]>([]);
  const [filteredClubs, setFilteredClubs] = useState<AdminClub[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchClubs();
  }, []);

  useEffect(() => {
    filterClubs();
  }, [clubs, searchQuery]);

  const fetchClubs = async () => {
    try {
      setLoading(true);
      const data = await adminApi.clubs.getAll();
      setClubs(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        message: error.message || 'Failed to fetch clubs',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterClubs = () => {
    let filtered = [...(clubs || [])];

    if (searchQuery) {
      filtered = filtered.filter(
        (club) =>
          club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          club.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredClubs(filtered);
  };

  const handleDeleteClub = async (clubId: string) => {
    try {
      await adminApi.clubs.delete(clubId);
      toast({
        title: 'Success',
        message: 'Club deleted successfully',
        type: 'success',
      });
      setClubs(clubs.filter((c) => c._id !== clubId));
      setDeleteConfirm(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        message: error.message || 'Failed to delete club',
        type: 'error',
      });
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

  return (
    <RoleBasedDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Club Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage all clubs in the system
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/admin/clubs/create">
              <Plus className="w-4 h-4 mr-2" />
              Create Club
            </Link>
          </Button>
        </div>

        {/* Search */}
        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search clubs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </Card>

        {/* Clubs List */}
        {filteredClubs.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No clubs found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? 'Try adjusting your search'
                  : 'Create your first club to get started'}
              </p>
              {!searchQuery && (
                <Button asChild>
                  <Link href="/dashboard/admin/clubs/create">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Club
                  </Link>
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredClubs.map((club) => (
              <Card key={club._id} className="overflow-hidden">
                {/* Club Logo */}
                {club.logo && (
                  <div className="aspect-video bg-muted relative">
                    <img
                      src={club.logo}
                      alt={club.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="p-4 space-y-3">
                  {/* Status Badge */}
                  <div className="flex items-center justify-between">
                    <Badge variant={club.isActive ? 'default' : 'secondary'}>
                      {club.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  {/* Club Name */}
                  <h3 className="font-semibold text-lg line-clamp-1">
                    {club.name}
                  </h3>

                  {/* Club Description */}
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {club.description}
                  </p>

                  {/* Club Stats */}
                  <div className="space-y-2 text-sm text-muted-foreground pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{club.memberCount} members</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      <span>{club.moderators?.length || 0} moderators</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      asChild
                    >
                      <Link href={`/clubs/${club._id}`}>View</Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      asChild
                    >
                      <Link href={`/dashboard/admin/clubs/${club._id}/edit`}>
                        <Edit3 className="w-4 h-4 mr-1" />
                        Edit
                      </Link>
                    </Button>
                    {deleteConfirm === club._id ? (
                      <div className="flex gap-1">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClub(club._id)}
                        >
                          Confirm
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteConfirm(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteConfirm(club._id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Summary */}
        {filteredClubs.length > 0 && (
          <Card className="p-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Total clubs: {filteredClubs.length}</span>
              <span>
                Active: {filteredClubs.filter((c) => c.isActive).length} |
                Inactive: {filteredClubs.filter((c) => !c.isActive).length}
              </span>
            </div>
          </Card>
        )}
      </div>
    </RoleBasedDashboardLayout>
  );
}
