'use client';

import React, { useState } from 'react';
import { MainLayout, PageWrapper } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit3,
  Save,
  X,
  Camera,
  Trophy,
  Users,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

// Mock user data (this would come from API)
const mockUser = {
  _id: 'user123',
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+1 (555) 123-4567',
  bio: 'Passionate developer and tech enthusiast. Love building innovative solutions and learning new technologies.',
  location: 'San Francisco, CA',
  avatar: '',
  dateJoined: '2023-01-15',
  interests: [
    'Technology',
    'Startups',
    'AI/ML',
    'Web Development',
    'Photography',
  ],
  stats: {
    eventsAttended: 23,
    clubsJoined: 4,
    eventsCreated: 7,
  },
  recentActivity: [
    {
      type: 'event_registration',
      title: 'Registered for React Workshop',
      date: '2024-01-10',
    },
    {
      type: 'club_joined',
      title: 'Joined Tech Enthusiasts Club',
      date: '2024-01-05',
    },
    {
      type: 'event_created',
      title: 'Created JavaScript Fundamentals Event',
      date: '2024-01-01',
    },
  ],
};

export default function ProfilePage() {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState(mockUser);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: user.name,
    phone: user.phone,
    bio: user.bio,
    location: user.location,
    interests: user.interests.join(', '),
  });
  const [loading, setLoading] = useState(false);

  const handleEdit = () => {
    setIsEditing(true);
    setEditData({
      name: user.name,
      phone: user.phone,
      bio: user.bio,
      location: user.location,
      interests: user.interests.join(', '),
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({
      name: user.name,
      phone: user.phone,
      bio: user.bio,
      location: user.location,
      interests: user.interests.join(', '),
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // API call to update user profile
      const updatedUser = {
        ...user,
        name: editData.name,
        phone: editData.phone,
        bio: editData.bio,
        location: editData.location,
        interests: editData.interests
          .split(',')
          .map((interest) => interest.trim())
          .filter(Boolean),
      };

      setUser(updatedUser);
      setIsEditing(false);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <MainLayout>
      <PageWrapper>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Profile Header */}
          <Card className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar Section */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-32 h-32 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <User className="w-16 h-16 text-white" />
                    </div>
                  )}
                  {isEditing && (
                    <button className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 hover:bg-primary/90 transition-colors">
                      <Camera className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="text-center">
                  <h1 className="text-2xl font-bold">{user.name}</h1>
                  <p className="text-muted-foreground">{user.email}</p>
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1 space-y-4">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Name</label>
                      <Input
                        value={editData.name}
                        onChange={(e) =>
                          setEditData({ ...editData, name: e.target.value })
                        }
                        placeholder="Your name"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Phone</label>
                      <Input
                        value={editData.phone}
                        onChange={(e) =>
                          setEditData({ ...editData, phone: e.target.value })
                        }
                        placeholder="Your phone number"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Bio</label>
                      <Textarea
                        value={editData.bio}
                        onChange={(e) =>
                          setEditData({ ...editData, bio: e.target.value })
                        }
                        placeholder="Tell us about yourself"
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Location</label>
                      <Input
                        value={editData.location}
                        onChange={(e) =>
                          setEditData({ ...editData, location: e.target.value })
                        }
                        placeholder="Your location"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">
                        Interests (comma-separated)
                      </label>
                      <Input
                        value={editData.interests}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            interests: e.target.value,
                          })
                        }
                        placeholder="Technology, Sports, Music..."
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {user.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        <span>{user.phone}</span>
                      </div>
                    )}

                    {user.location && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{user.location}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>Joined {formatDate(user.dateJoined)}</span>
                    </div>

                    {user.bio && (
                      <p className="text-muted-foreground mt-4">{user.bio}</p>
                    )}

                    {user.interests && user.interests.length > 0 && (
                      <div className="mt-4">
                        <h3 className="text-sm font-medium mb-2">Interests</h3>
                        <div className="flex flex-wrap gap-2">
                          {user.interests.map((interest) => (
                            <Badge key={interest} variant="secondary">
                              {interest}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4">
                  {isEditing ? (
                    <>
                      <Button onClick={handleSave} disabled={loading}>
                        <Save className="w-4 h-4 mr-2" />
                        {loading ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button variant="outline" onClick={handleCancel}>
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button onClick={handleEdit}>
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {user.stats.eventsAttended}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Events Attended
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{user.stats.clubsJoined}</p>
                  <p className="text-sm text-muted-foreground">Clubs Joined</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Trophy className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {user.stats.eventsCreated}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Events Created
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {user.recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                >
                  <div className="bg-primary/10 p-2 rounded-lg">
                    {activity.type === 'event_registration' && (
                      <Calendar className="w-4 h-4 text-primary" />
                    )}
                    {activity.type === 'club_joined' && (
                      <Users className="w-4 h-4 text-primary" />
                    )}
                    {activity.type === 'event_created' && (
                      <Trophy className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{activity.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(activity.date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </PageWrapper>
    </MainLayout>
  );
}
