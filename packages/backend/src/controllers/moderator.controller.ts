import { Request, Response } from 'express';
import { Types } from 'mongoose';
import UserModel from '../models/user.model';
import EventModel from '../models/event.model';
import { AuditLogModel } from '../models/auditLog.model';

// Get all clubs moderated by the current user
export const getModeratedClubs = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // If admin, return all clubs
    if (req.user.role === 'admin') {
      // Import Club model dynamically to avoid circular dependencies
      const ClubModel = (await import('../models/club.model')).default;
      const clubs = await ClubModel.find({ isDeleted: false });

      return res.status(200).json({
        success: true,
        data: clubs,
      });
    }

    // For moderators, return only their clubs
    const user = await UserModel.findById(req.user._id).populate(
      'moderatorClubs'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: user.moderatorClubs,
    });
  } catch (error) {
    console.error('Get moderated clubs error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch moderated clubs',
    });
  }
};

// Get club analytics
export const getClubAnalytics = async (req: Request, res: Response) => {
  try {
    const { clubId } = req.params;

    const ClubModel = (await import('../models/club.model')).default;
    const club = await ClubModel.findById(clubId);

    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found',
      });
    }

    // Get club events
    const events = await EventModel.find({ club: clubId });

    // Calculate analytics
    const totalEvents = events.length;
    const upcomingEvents = events.filter(
      (e) => new Date(e.startDate) > new Date()
    ).length;
    const pastEvents = totalEvents - upcomingEvents;
    const totalRegistrations = events.reduce(
      (sum, e) => sum + (e.registeredUsers || 0),
      0
    );

    // Get member count
    const members = await UserModel.find({
      'clubs.id': clubId,
      isDeleted: false,
    });

    const analytics = {
      totalMembers: members.length,
      totalEvents,
      upcomingEvents,
      pastEvents,
      totalRegistrations,
      averageRegistrationsPerEvent:
        totalEvents > 0 ? totalRegistrations / totalEvents : 0,
    };

    return res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('Get club analytics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch club analytics',
    });
  }
};

// Get club members
export const getClubMembers = async (req: Request, res: Response) => {
  try {
    const { clubId } = req.params;

    const members = await UserModel.find({
      'clubs.id': clubId,
      isDeleted: false,
    }).select('name email avatar clubs');

    return res.status(200).json({
      success: true,
      data: members,
    });
  } catch (error) {
    console.error('Get club members error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch club members',
    });
  }
};

// Add club member
export const addClubMember = async (req: Request, res: Response) => {
  try {
    const { clubId } = req.params;
    const { userId, designation } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if user is already a member
    const existingMember = user.clubs.find(
      (club) => club.id.toString() === clubId.toString()
    );

    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this club',
      });
    }

    // Add user to club
    user.clubs.push({
      id: clubId as any, // Types.ObjectId will be serialized to string
      designation: designation || 'Member',
    });

    await user.save();

    // Log action
    await AuditLogModel.logAction(
      req.user!._id,
      'create',
      'club',
      new Types.ObjectId(clubId),
      { action: 'add_member', userId, designation },
      { ipAddress: req.ip, userAgent: req.headers['user-agent'] }
    );

    return res.status(200).json({
      success: true,
      message: 'Member added successfully',
      data: user,
    });
  } catch (error) {
    console.error('Add club member error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add club member',
    });
  }
};

// Remove club member
export const removeClubMember = async (req: Request, res: Response) => {
  try {
    const { clubId, memberId } = req.params;

    const user = await UserModel.findById(memberId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Remove user from club
    user.clubs = user.clubs.filter((club) => club.id.toString() !== clubId);

    await user.save();

    // Log action
    await AuditLogModel.logAction(
      req.user!._id,
      'delete',
      'club',
      new Types.ObjectId(clubId),
      { action: 'remove_member', memberId },
      { ipAddress: req.ip, userAgent: req.headers['user-agent'] }
    );

    return res.status(200).json({
      success: true,
      message: 'Member removed successfully',
    });
  } catch (error) {
    console.error('Remove club member error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to remove club member',
    });
  }
};

// Update member role
export const updateMemberRole = async (req: Request, res: Response) => {
  try {
    const { clubId, memberId } = req.params;
    const { designation } = req.body;

    if (!designation) {
      return res.status(400).json({
        success: false,
        message: 'Designation is required',
      });
    }

    const user = await UserModel.findById(memberId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update designation
    const clubIndex = user.clubs.findIndex(
      (club) => club.id.toString() === clubId
    );

    if (clubIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'User is not a member of this club',
      });
    }

    user.clubs[clubIndex].designation = designation;
    await user.save();

    // Log action
    await AuditLogModel.logAction(
      req.user!._id,
      'update',
      'club',
      new Types.ObjectId(clubId),
      { action: 'update_member_role', memberId, designation },
      { ipAddress: req.ip, userAgent: req.headers['user-agent'] }
    );

    return res.status(200).json({
      success: true,
      message: 'Member role updated successfully',
      data: user,
    });
  } catch (error) {
    console.error('Update member role error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update member role',
    });
  }
};

// Create event
export const createEvent = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const eventData = {
      ...req.body,
      createdBy: req.user._id,
    };

    const event = await EventModel.create(eventData);

    // Log action
    await AuditLogModel.logAction(
      req.user._id,
      'create',
      'event',
      event._id as Types.ObjectId,
      eventData,
      { ipAddress: req.ip, userAgent: req.headers['user-agent'] }
    );

    return res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event,
    });
  } catch (error) {
    console.error('Create event error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create event',
    });
  }
};

// Update event
export const updateEvent = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    const event = await EventModel.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Check ownership (admins can edit any event)
    if (
      req.user!.role !== 'admin' &&
      event.createdBy.toString() !== req.user!._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit events you created',
      });
    }

    const oldData = event.toObject();
    Object.assign(event, req.body);
    await event.save();

    // Log action
    await AuditLogModel.logAction(
      req.user!._id,
      'update',
      'event',
      event._id as Types.ObjectId,
      { old: oldData, new: event.toObject() },
      { ipAddress: req.ip, userAgent: req.headers['user-agent'] }
    );

    return res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: event,
    });
  } catch (error) {
    console.error('Update event error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update event',
    });
  }
};

// Delete event
export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    const event = await EventModel.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Check ownership (admins can delete any event)
    if (
      req.user!.role !== 'admin' &&
      event.createdBy.toString() !== req.user!._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete events you created',
      });
    }

    await event.deleteOne();

    // Log action
    await AuditLogModel.logAction(
      req.user!._id,
      'delete',
      'event',
      event._id as Types.ObjectId,
      event.toObject(),
      { ipAddress: req.ip, userAgent: req.headers['user-agent'] }
    );

    return res.status(200).json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error) {
    console.error('Delete event error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete event',
    });
  }
};

// Get pending registrations (stub - needs Registration model)
export const getPendingRegistrations = async (req: Request, res: Response) => {
  try {
    // TODO: Implement when Registration model is available
    return res.status(200).json({
      success: true,
      data: [],
      message: 'Registration management coming soon',
    });
  } catch (error) {
    console.error('Get pending registrations error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch pending registrations',
    });
  }
};

// Approve registration (stub)
export const approveRegistration = async (req: Request, res: Response) => {
  try {
    // TODO: Implement when Registration model is available
    return res.status(200).json({
      success: true,
      message: 'Registration management coming soon',
    });
  } catch (error) {
    console.error('Approve registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to approve registration',
    });
  }
};

// Reject registration (stub)
export const rejectRegistration = async (req: Request, res: Response) => {
  try {
    // TODO: Implement when Registration model is available
    return res.status(200).json({
      success: true,
      message: 'Registration management coming soon',
    });
  } catch (error) {
    console.error('Reject registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reject registration',
    });
  }
};

// Create club announcement (stub)
export const createClubAnnouncement = async (req: Request, res: Response) => {
  try {
    // TODO: Implement when Announcement model is available
    return res.status(200).json({
      success: true,
      message: 'Announcement system coming soon',
    });
  } catch (error) {
    console.error('Create club announcement error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create announcement',
    });
  }
};

// Export club data
export const exportClubData = async (req: Request, res: Response) => {
  try {
    const { clubId } = req.params;

    const members = await UserModel.find({
      'clubs.id': clubId,
      isDeleted: false,
    }).select('name email phone');

    const events = await EventModel.find({ club: clubId }).select(
      'title startDate endDate registeredUsers'
    );

    return res.status(200).json({
      success: true,
      data: {
        members,
        events,
      },
    });
  } catch (error) {
    console.error('Export club data error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to export club data',
    });
  }
};

// Get club events
export const getClubEvents = async (req: Request, res: Response) => {
  try {
    const { clubId } = req.params;

    const events = await EventModel.find({ club: clubId })
      .populate('createdBy', 'name email')
      .sort({ startDate: -1 });

    return res.status(200).json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error('Get club events error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch club events',
    });
  }
};
