import { Request, Response, NextFunction } from 'express';
import { User as UserType } from '@event-management/shared';
import Club from '../models/club.model.js';
import UserModel from '../models/user.model.js';
import Event from '../models/event.model.js';
import Log from '../models/log.model.js';
import { AuthenticatedRequest } from '../types/express.js';
// import cloudinary from '../configs/cloudinary.js';

// API Response interface
interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

// Temporary cloudinary stub
const cloudinary = {
  uploader: {
    destroy: async (publicId: string) => ({ result: 'ok' }),
  },
};

interface FlashRequest extends Request {
  flash(type: string, message?: string): string[] | void;
}

// Request interfaces for admin operations
interface AssignRoleRequest {
  userId: string;
  role: string;
}

interface AdminClubCreateRequest {
  name: string;
  description: string;
  image: string;
}

interface AdminClubEditRequest {
  name: string;
  description: string;
  about: string;
  image: string;
  banner: string;
  domains: string[] | string;
  social: {
    email?: string;
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    discord?: string;
  };
}

interface ModeratorRequest {
  userId: string;
}

// Helper function to extract public_id from Cloudinary URL
const extractPublicId = (cloudinaryUrl: string): string | null => {
  try {
    if (!cloudinaryUrl || typeof cloudinaryUrl !== 'string') {
      return null;
    }

    // Handle different Cloudinary URL formats
    const urlParts = cloudinaryUrl.split('/');
    const uploadIndex = urlParts.indexOf('upload');

    if (uploadIndex === -1) {
      return null;
    }

    // Get everything after 'upload', skipping version if present
    let pathAfterUpload = urlParts.slice(uploadIndex + 1);

    // Remove version if it starts with 'v' followed by numbers
    if (pathAfterUpload.length > 0 && /^v\d+$/.test(pathAfterUpload[0])) {
      pathAfterUpload = pathAfterUpload.slice(1);
    }

    // Join the remaining parts and remove file extension
    const fullPath = pathAfterUpload.join('/');
    const publicId = fullPath.replace(/\.[^.]+$/, ''); // Remove file extension

    return publicId || null;
  } catch (error) {
    console.error('Error extracting public_id from Cloudinary URL:', error);
    return null;
  }
};

// API Routes - Admin Management

export const getManageRoles = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const users = await UserModel.find(
      {},
      'name email role roleRequest createdAt'
    );

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: {
        users: users.map((user) => ({
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          roleRequest: user.roleRequest,
          createdAt: user.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching users for role management:', error);
    next(error);
  }
};

export const getRoleRequests = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const users = await UserModel.find(
      { roleRequest: 'admin' },
      'name email roleRequest createdAt'
    );

    res.status(200).json({
      success: true,
      message: 'Role requests retrieved successfully',
      data: {
        requests: users.map((user) => ({
          id: user._id,
          name: user.name,
          email: user.email,
          roleRequest: user.roleRequest,
          createdAt: user.createdAt,
        })),
        count: users.length,
      },
    });
  } catch (error) {
    console.error('Error fetching role requests:', error);
    next(error);
  }
};

export const getManageClubs = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const clubs = await Club.find(
      {},
      'name description image currentMembers moderators createdAt'
    );

    res.status(200).json({
      success: true,
      message: 'Clubs retrieved successfully',
      data: {
        clubs: clubs.map((club) => ({
          id: club._id,
          name: club.name,
          description: club.description,
          image: club.image,
          memberCount: club.currentMembers?.length || 0,
          moderatorCount: club.moderators?.length || 0,
          createdAt: club.createdAt,
        })),
        count: clubs.length,
      },
    });
  } catch (error) {
    console.error('Error fetching clubs for management:', error);
    next(error);
  }
};

export const getEditClub = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const club = await Club.findById(id).populate('moderators', 'name email');

    if (!club) {
      res.status(404).json({
        success: false,
        message: 'Club not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Club details retrieved successfully',
      data: {
        club: {
          id: club._id,
          name: club.name,
          description: club.description,
          about: club.about,
          image: club.image,
          banner: club.banner,
          domains: club.domains,
          social: club.social,
          moderators: club.moderators,
          currentMembers: club.currentMembers,
          pastMembers: club.pastMembers,
          sponsors: club.sponsors,
          createdAt: club.createdAt,
          updatedAt: club.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching club for editing:', error);
    next(error);
  }
};

export const getManageUsers = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const users = await UserModel.find(
      {},
      'name email role isVerified createdAt lastLoginAt'
    );

    console.log(`[Admin] Fetched ${users.length} users from database`);

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: {
        users: users.map((user) => ({
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
        })),
        count: users.length,
      },
    });
  } catch (error) {
    console.error('Error fetching users for management:', error);
    next(error);
  }
};

export const getManageEvents = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const events = await Event.find(
      {},
      'title description image startDate Type club createdAt'
    ).populate('club', 'name');

    res.status(200).json({
      success: true,
      message: 'Events retrieved successfully',
      data: {
        events: events.map((event) => ({
          id: event._id,
          title: event.title,
          description: event.description,
          image: event.image,
          startDate: event.startDate,
          Type: event.Type,
          club: event.club
            ? {
                id: (event.club as any)._id,
                name: (event.club as any).name,
              }
            : null,
          createdAt: event.createdAt,
        })),
        count: events.length,
      },
    });
  } catch (error) {
    console.error('Error fetching events for management:', error);
    next(error);
  }
};

export const getEditEvent = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id).populate('club', 'name');

    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Event not found',
      });
      return;
    }

    const clubs = await Club.find({}, 'name');

    res.status(200).json({
      success: true,
      message: 'Event details retrieved successfully',
      data: {
        event: {
          id: event._id,
          title: event.title,
          description: event.description,
          image: event.image,
          startDate: event.startDate,
          endDate: event.endDate,
          startTime: event.startTime,
          endTime: event.endTime,
          location: event.location,
          Type: event.Type,
          club: event.club,
          createdAt: event.createdAt,
          updatedAt: event.updatedAt,
        },
        clubs: clubs.map((club) => ({
          id: club._id,
          name: club.name,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching event for editing:', error);
    next(error);
  }
};

export const getLogs = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const logs = await Log.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalLogs = await Log.countDocuments();

    res.status(200).json({
      success: true,
      message: 'Logs retrieved successfully',
      data: {
        logs: logs.map((log) => ({
          id: log._id,
          action: log.action,
          user: log.user
            ? {
                id: (log.user as any)._id,
                name: (log.user as any).name,
                email: (log.user as any).email,
              }
            : null,
          details: log.details,
          timestamp: log.createdAt,
        })),
        pagination: {
          page,
          limit,
          total: totalLogs,
          pages: Math.ceil(totalLogs / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    next(error);
  }
};

// Action Functions
export const assignRole = async (
  req: Request<{}, {}, AssignRoleRequest>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId, role } = req.body;
    const authReq = req as unknown as AuthenticatedRequest;

    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Validate role
    if (!['admin', 'moderator', 'user'].includes(role)) {
      res.status(400).json({
        success: false,
        message: 'Invalid role specified',
      });
      return;
    }

    const oldRole = user.role;
    user.role = role as any;

    await Log.create({
      user: authReq.userInfo._id,
      affectedUser: userId,
      action: 'EDIT',
      targetType: 'USER',
      targetId: userId,
      details: `Role of ${user.name} updated from ${oldRole} to ${role} by ${authReq.userInfo.name}`,
    });

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Role updated successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error('Error assigning role:', error);
    next(error);
  }
};

export const approveRoleRequest = async (
  req: Request<{ userId: string }>,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { userId } = req.params;
    const user = await UserModel.findById(userId);
    if (!user) {
      (req as unknown as FlashRequest).flash('error', 'User not found');
      return res.redirect('/admin/roles/requests');
    }

    user.role = 'admin';
    user.roleRequest = null;
    await Log.create({
      user: authReq.userInfo._id,
      affectedUser: userId,
      action: 'EDIT',
      targetType: 'USER',
      targetId: userId,
      details: `Role request approved for ${user.name} by ${authReq.userInfo.name}`,
    });
    await user.save();
    (req as unknown as FlashRequest).flash(
      'success',
      'Role request approved successfully'
    );
    res.redirect('/admin/roles/requests');
  } catch (error) {
    (req as unknown as FlashRequest).flash('error', 'Server error');
    res.redirect('/admin/roles/requests');
  }
};

export const rejectRoleRequest = async (
  req: Request<{ userId: string }>,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { userId } = req.params;
    const user = await UserModel.findById(userId);
    if (!user) {
      (req as unknown as FlashRequest).flash('error', 'User not found');
      return res.redirect('/admin/roles/requests');
    }

    user.roleRequest = null;
    await Log.create({
      user: authReq.userInfo._id,
      affectedUser: userId,
      action: 'EDIT',
      targetType: 'USER',
      targetId: userId,
      details: `Role request rejected for ${user.name} by ${authReq.userInfo.name}`,
    });
    await user.save();
    (req as unknown as FlashRequest).flash(
      'success',
      'Role request rejected successfully'
    );
    res.redirect('/admin/roles/requests');
  } catch (error) {
    (req as unknown as FlashRequest).flash('error', 'Server error');
    res.redirect('/admin/roles/requests');
  }
};

export const createClub = async (
  req: Request<{}, {}, AdminClubCreateRequest>,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { name, description, image } = req.body;
    const club = await Club.create({ name, description, image });
    await Log.create({
      user: authReq.userInfo._id,
      action: 'CREATE',
      targetType: 'CLUB',
      targetId: club._id,
      details: `Club ${club.name} created by ${authReq.userInfo.name}`,
    });
    (req as unknown as FlashRequest).flash(
      'success',
      'Club created successfully'
    );
    res.redirect('/admin/clubs');
  } catch (error) {
    (req as unknown as FlashRequest).flash('error', 'Server error');
    res.redirect('/admin/clubs');
  }
};

export const editClub = async (
  req: Request<{ id: string }, {}, AdminClubEditRequest>,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;
    const {
      name,
      description,
      about,
      image,
      banner,
      domains,
      social = {},
    } = req.body;

    // Ensure domains is always an array
    let domainsArray: string[] = [];
    if (Array.isArray(domains)) {
      domainsArray = domains.filter(Boolean);
    } else if (typeof domains === 'string' && domains.trim() !== '') {
      domainsArray = [domains.trim()];
    }

    // Social fields: ensure all keys exist
    const socialObj = {
      email: social.email || '',
      instagram: social.instagram || '',
      facebook: social.facebook || '',
      linkedin: social.linkedin || '',
      discord: social.discord || '',
    };

    const club = await Club.findByIdAndUpdate(
      id,
      {
        name,
        description,
        about,
        image,
        banner,
        domains: domainsArray,
        social: socialObj,
      },
      { new: true }
    );

    if (!club) {
      (req as unknown as FlashRequest).flash('error', 'Club not found');
      return res.redirect('/admin/clubs');
    }

    await Log.create({
      user: authReq.userInfo._id,
      action: 'EDIT',
      targetType: 'CLUB',
      targetId: id,
      details: `Club ${club.name} updated by ${authReq.userInfo.name}`,
    });

    (req as unknown as FlashRequest).flash(
      'success',
      'Club updated successfully'
    );
    res.redirect('/admin/clubs');
  } catch (error) {
    (req as unknown as FlashRequest).flash('error', 'Server error');
    res.redirect('/admin/clubs');
  }
};

export const deleteClub = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;
    const club = await Club.findById(id);
    if (!club) {
      (req as unknown as FlashRequest).flash('error', 'Club not found');
      return res.redirect('/admin/clubs');
    }

    // Delete gallery images from Cloudinary
    if (club.gallery && club.gallery.length > 0) {
      for (const item of club.gallery) {
        if (item.url) {
          const publicId = extractPublicId(item.url);
          if (publicId) {
            try {
              await cloudinary.uploader.destroy(publicId);
            } catch (cloudinaryError) {
              console.error(
                'Error deleting image from Cloudinary:',
                cloudinaryError
              );
            }
          }
        }
      }
    }

    // Delete other images
    const imagesToDelete = [club.image, club.banner].filter(
      (url): url is string => Boolean(url)
    );
    for (const imageUrl of imagesToDelete) {
      const publicId = extractPublicId(imageUrl);
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (cloudinaryError) {
          console.error(
            'Error deleting image from Cloudinary:',
            cloudinaryError
          );
        }
      }
    }

    await Club.findByIdAndDelete(id);
    await Log.create({
      user: authReq.userInfo._id,
      action: 'DELETE',
      targetType: 'CLUB',
      targetId: id,
      details: `Club ${club.name} deleted by ${authReq.userInfo.name}`,
    });

    (req as unknown as FlashRequest).flash(
      'success',
      'Club deleted successfully'
    );
    res.redirect('/admin/clubs');
  } catch (error) {
    (req as unknown as FlashRequest).flash('error', 'Server error');
    res.redirect('/admin/clubs');
  }
};

export const deleteUser = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;
    const user = await UserModel.findById(id);
    if (!user) {
      (req as unknown as FlashRequest).flash('error', 'User not found');
      return res.redirect('/admin/users');
    }

    // Delete user avatar from Cloudinary if it exists
    if (user.avatar) {
      const publicId = extractPublicId(user.avatar);
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (cloudinaryError) {
          console.error(
            'Error deleting avatar from Cloudinary:',
            cloudinaryError
          );
        }
      }
    }

    await UserModel.findByIdAndDelete(id);
    await Log.create({
      user: authReq.userInfo._id,
      affectedUser: id,
      action: 'DELETE',
      targetType: 'USER',
      targetId: id,
      details: `User ${user.name} deleted by ${authReq.userInfo.name}`,
    });

    (req as unknown as FlashRequest).flash(
      'success',
      'User deleted successfully'
    );
    res.redirect('/admin/users');
  } catch (error) {
    (req as unknown as FlashRequest).flash('error', 'Server error');
    res.redirect('/admin/users');
  }
};

export const deleteEvent = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;
    const event = await Event.findById(id);
    if (!event) {
      (req as unknown as FlashRequest).flash('error', 'Event not found');
      return res.redirect('/admin/events');
    }

    // Delete event images from Cloudinary
    const imagesToDelete = [event.image, (event as any).banner].filter(
      (url): url is string => Boolean(url)
    );
    for (const imageUrl of imagesToDelete) {
      const publicId = extractPublicId(imageUrl);
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (cloudinaryError) {
          console.error(
            'Error deleting image from Cloudinary:',
            cloudinaryError
          );
        }
      }
    }

    await Event.findByIdAndDelete(id);
    await Log.create({
      user: authReq.userInfo._id,
      action: 'DELETE',
      targetType: 'EVENT',
      targetId: id,
      details: `Event ${event.title} deleted by ${authReq.userInfo.name}`,
    });

    (req as unknown as FlashRequest).flash(
      'success',
      'Event deleted successfully'
    );
    res.redirect('/admin/events');
  } catch (error) {
    (req as unknown as FlashRequest).flash('error', 'Server error');
    res.redirect('/admin/events');
  }
};

export const editEvent = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;

    // Check if this is a JSON API request (for status update)
    const isJsonRequest =
      req.headers['content-type']?.includes('application/json');

    if (isJsonRequest && req.body.status) {
      // Handle status update via JSON API
      const { status } = req.body;

      const updatedEvent = await Event.findByIdAndUpdate(
        id,
        { $set: { status } },
        { new: true }
      );

      if (!updatedEvent) {
        res.status(404).json({
          success: false,
          message: 'Event not found',
        });
        return;
      }

      await Log.create({
        user: authReq.userInfo._id,
        action: 'UPDATE',
        targetType: 'EVENT',
        targetId: id,
        details: `Event ${updatedEvent.title} status changed to ${status} by ${authReq.userInfo.name}`,
      });

      res.status(200).json({
        success: true,
        message: 'Event status updated successfully',
        data: {
          event: {
            id: updatedEvent._id,
            title: updatedEvent.title,
            status,
          },
        },
      });
      return;
    }

    // Original form-based update logic
    const {
      title,
      description,
      image,
      banner,
      venue,
      startDate,
      endDate,
      maxParticipants,
      club,
      sponsors,
      collaborators,
    } = req.body;

    // Parse sponsors and collaborators
    let sponsorsArray: string[] = [];
    let collaboratorsArray: string[] = [];

    if (sponsors) {
      if (typeof sponsors === 'string') {
        sponsorsArray = sponsors
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean);
      } else if (Array.isArray(sponsors)) {
        sponsorsArray = sponsors.filter(Boolean);
      }
    }

    if (collaborators) {
      if (typeof collaborators === 'string') {
        collaboratorsArray = collaborators
          .split(',')
          .map((c: string) => c.trim())
          .filter(Boolean);
      } else if (Array.isArray(collaborators)) {
        collaboratorsArray = collaborators.filter(Boolean);
      }
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      {
        title,
        description,
        image,
        banner,
        venue,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        maxParticipants: parseInt(maxParticipants) || 0,
        club,
        sponsors: sponsorsArray,
        collaborators: collaboratorsArray,
      },
      { new: true }
    );

    if (!updatedEvent) {
      (req as unknown as FlashRequest).flash('error', 'Event not found');
      return res.redirect('/admin/events');
    }

    await Log.create({
      user: authReq.userInfo._id,
      action: 'EDIT',
      targetType: 'EVENT',
      targetId: id,
      details: `Event ${updatedEvent.title} updated by ${authReq.userInfo.name}`,
    });

    (req as unknown as FlashRequest).flash(
      'success',
      'Event updated successfully'
    );
    res.redirect('/admin/events');
  } catch (error) {
    const isJsonRequest =
      req.headers['content-type']?.includes('application/json');
    if (isJsonRequest) {
      res.status(500).json({
        success: false,
        message: 'Failed to update event',
      });
    } else {
      (req as unknown as FlashRequest).flash('error', 'Server error');
      res.redirect('/admin/events');
    }
  }
};

export const addModeratorToClub = async (
  req: Request<{ id: string }, {}, ModeratorRequest>,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;
    const { userId } = req.body;

    const club = await Club.findById(id);
    const user = await UserModel.findById(userId);

    if (!club || !user) {
      (req as unknown as FlashRequest).flash('error', 'Club or User not found');
      return res.redirect('/admin/clubs');
    }

    if (!club.moderators.includes(userId as any)) {
      club.moderators.push(userId as any);
      await club.save();

      await Log.create({
        user: authReq.userInfo._id,
        affectedUser: userId,
        action: 'EDIT',
        targetType: 'CLUB',
        targetId: id,
        details: `${user.name} added as moderator to ${club.name} by ${authReq.userInfo.name}`,
      });

      (req as unknown as FlashRequest).flash(
        'success',
        'Moderator added successfully'
      );
    } else {
      (req as unknown as FlashRequest).flash(
        'error',
        'User is already a moderator'
      );
    }

    res.redirect('/admin/clubs');
  } catch (error) {
    (req as unknown as FlashRequest).flash('error', 'Server error');
    res.redirect('/admin/clubs');
  }
};

export const removeModeratorFromClub = async (
  req: Request<{ id: string; userId: string }>,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id, userId } = req.params;

    const club = await Club.findById(id);
    const user = await UserModel.findById(userId);

    if (!club || !user) {
      (req as unknown as FlashRequest).flash('error', 'Club or User not found');
      return res.redirect('/admin/clubs');
    }

    club.moderators = club.moderators.filter(
      (moderatorId: any) => moderatorId.toString() !== userId
    );
    await club.save();

    await Log.create({
      user: authReq.userInfo._id,
      affectedUser: userId,
      action: 'EDIT',
      targetType: 'CLUB',
      targetId: id,
      details: `${user.name} removed as moderator from ${club.name} by ${authReq.userInfo.name}`,
    });

    (req as unknown as FlashRequest).flash(
      'success',
      'Moderator removed successfully'
    );
    res.redirect('/admin/clubs');
  } catch (error) {
    (req as unknown as FlashRequest).flash('error', 'Server error');
    res.redirect('/admin/clubs');
  }
};
