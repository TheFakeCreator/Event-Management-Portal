'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
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
  Plus,
  MoreVertical,
  Mail,
  Shield,
  Trash2,
  UserPlus,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Member {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  designation: string;
  joinedAt: string;
}

export default function ClubMembersPage() {
  return (
    <ProtectedRoute requiredRole={['moderator', 'admin']}>
      <ClubMembersManagement />
    </ProtectedRoute>
  );
}

function ClubMembersManagement() {
  const params = useParams();
  const clubId = params?.clubId as string;
  const { toast } = useToast();

  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [clubName, setClubName] = useState('');

  useEffect(() => {
    fetchClubMembers();
  }, [clubId]);

  useEffect(() => {
    const filtered = members.filter(
      (member) =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredMembers(filtered);
  }, [searchQuery, members]);

  const fetchClubMembers = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/v1/moderator/clubs/${clubId}/members`);
      // const data = await response.json();

      // Mock data
      setClubName('Tech Enthusiasts Club');
      setMembers([
        {
          _id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          designation: 'Member',
          joinedAt: '2025-01-15',
        },
        {
          _id: '2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          designation: 'Lead',
          joinedAt: '2024-09-20',
        },
        {
          _id: '3',
          name: 'Bob Johnson',
          email: 'bob@example.com',
          designation: 'Member',
          joinedAt: '2025-03-10',
        },
      ]);
    } catch (error) {
      console.error('Failed to fetch members:', error);
      toast({
        title: 'Error',
        message: 'Failed to load club members',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      // TODO: API call
      // await fetch(`/api/v1/moderator/clubs/${clubId}/members/${memberId}`, {
      //   method: 'DELETE',
      // });

      setMembers((prev) => prev.filter((m) => m._id !== memberId));
      toast({
        title: 'Success',
        message: 'Member removed successfully',
        type: 'success',
      });
    } catch (error) {
      console.error('Failed to remove member:', error);
      toast({
        title: 'Error',
        message: 'Failed to remove member',
        type: 'error',
      });
    }
  };

  const handleUpdateRole = async (memberId: string, newDesignation: string) => {
    try {
      // TODO: API call
      // await fetch(`/api/v1/moderator/clubs/${clubId}/members/${memberId}/role`, {
      //   method: 'PUT',
      //   body: JSON.stringify({ designation: newDesignation }),
      // });

      setMembers((prev) =>
        prev.map((m) =>
          m._id === memberId ? { ...m, designation: newDesignation } : m
        )
      );
      toast({
        title: 'Success',
        message: 'Member role updated successfully',
        type: 'success',
      });
    } catch (error) {
      console.error('Failed to update role:', error);
      toast({
        title: 'Error',
        message: 'Failed to update member role',
        type: 'error',
      });
    }
  };

  if (loading) {
    return (
      <RoleBasedDashboardLayout title="Club Members" description="Loading...">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-lg" />
          ))}
        </div>
      </RoleBasedDashboardLayout>
    );
  }

  return (
    <RoleBasedDashboardLayout
      title={`${clubName} - Members`}
      description="Manage club members and their roles"
      actions={
        <Button>
          <UserPlus className="w-4 h-4 mr-2" />
          Add Member
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-3">
          <StatCard
            title="Total Members"
            value={members.length}
            icon={<Users className="w-6 h-6 text-primary" />}
          />
          <StatCard
            title="New This Month"
            value={3}
            icon={<UserPlus className="w-6 h-6 text-primary" />}
            trend="up"
            change="+3"
          />
          <StatCard
            title="Active Members"
            value={members.length - 2}
            icon={<Shield className="w-6 h-6 text-primary" />}
          />
        </div>

        {/* Members List */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-3">
            {filteredMembers.length > 0 ? (
              filteredMembers.map((member) => (
                <div
                  key={member._id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-lg font-semibold text-primary">
                        {member.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold">{member.name}</h3>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        <span>{member.email}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Joined: {new Date(member.joinedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Badge variant="secondary">{member.designation}</Badge>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleUpdateRole(member._id, 'Lead')}
                        >
                          <Shield className="w-4 h-4 mr-2" />
                          Make Lead
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleUpdateRole(member._id, 'Member')}
                        >
                          <Users className="w-4 h-4 mr-2" />
                          Make Member
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleRemoveMember(member._id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No members found</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </RoleBasedDashboardLayout>
  );
}
