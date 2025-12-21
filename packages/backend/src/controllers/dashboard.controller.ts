import { Request, Response } from 'express';
import mongoose from 'mongoose';
import EventModel from '../models/event.model.js';
import UserModel from '../models/user.model.js';
import RegistrationModel from '../models/registration.model.js';
import ClubModel from '../models/club.model.js';
import AuditLogModel from '../models/auditLog.model.js';

/**
 * Get user dashboard statistics
 * @route GET /api/v1/dashboard/user/stats
 * @access Private (User)
 */
export const getUserDashboardStats = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }
    const userId = req.user._id;

    // Get user's event registrations
    const registrations = await RegistrationModel.find({
      userId,
      status: { $in: ['approved', 'pending'] },
    });

    const registeredEventIds = registrations.map((r: any) => r.eventId);

    // Get events statistics
    const now = new Date();
    const eventsAttended = await EventModel.countDocuments({
      _id: { $in: registeredEventIds },
      endDate: { $lt: now },
    });

    const upcomingEvents = await EventModel.countDocuments({
      _id: { $in: registeredEventIds },
      startDate: { $gte: now },
    });

    // Get clubs the user is part of
    const clubsJoined = await ClubModel.countDocuments({
      members: userId,
    });

    // Get pending registrations
    const pendingRegistrations = await RegistrationModel.countDocuments({
      userId,
      status: 'pending',
    });

    res.json({
      success: true,
      data: {
        eventsAttended,
        upcomingEvents,
        clubsJoined,
        pendingRegistrations,
      },
    });
  } catch (error) {
    console.error('Error fetching user dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
    });
  }
};

/**
 * Get user's upcoming events
 * @route GET /api/v1/dashboard/user/events
 * @access Private (User)
 */
export const getUserUpcomingEvents = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }
    const userId = req.user._id;
    const limit = parseInt(req.query.limit as string) || 5;

    // Get user's approved registrations
    const registrations = await RegistrationModel.find({
      userId,
      status: 'approved',
    }).select('eventId');

    const registeredEventIds = registrations.map((r: any) => r.eventId);

    // Get upcoming events
    const events = await EventModel.find({
      _id: { $in: registeredEventIds },
      startDate: { $gte: new Date() },
    })
      .sort({ startDate: 1 })
      .limit(limit)
      .populate('organizerId', 'name')
      .select(
        'title description startDate endDate venue thumbnail registrationCount capacity'
      );

    res.json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error('Error fetching user upcoming events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch upcoming events',
    });
  }
};

/**
 * Get user's clubs
 * @route GET /api/v1/dashboard/user/clubs
 * @access Private (User)
 */
export const getUserClubs = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }
    const userId = req.user._id;
    const limit = parseInt(req.query.limit as string) || 5;

    const clubs = await ClubModel.find({
      members: userId,
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('name description logo memberCount');

    res.json({
      success: true,
      data: clubs,
    });
  } catch (error) {
    console.error('Error fetching user clubs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch clubs',
    });
  }
};

/**
 * Get moderator dashboard statistics
 * @route GET /api/v1/dashboard/moderator/stats
 * @access Private (Moderator/Admin)
 */
export const getModeratorDashboardStats = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }
    const userId = req.user._id;
    const isAdmin = req.user.role === 'admin';

    // Get clubs moderated by user (admins can see all)
    const clubQuery = isAdmin ? {} : { moderators: userId };
    const clubs = await ClubModel.find(clubQuery).select('_id memberCount');
    const clubIds = clubs.map((c: any) => c._id);

    const totalClubs = clubs.length;
    const totalMembers = clubs.reduce(
      (sum: number, club: any) => sum + (club.memberCount || 0),
      0
    );

    // Get events for these clubs
    const totalEvents = await EventModel.countDocuments({
      clubId: { $in: clubIds },
    });

    // Get pending registrations for events of these clubs
    const events = await EventModel.find({
      clubId: { $in: clubIds },
    }).select('_id');
    const eventIds = events.map((e: any) => e._id);

    const pendingRegistrations = await RegistrationModel.countDocuments({
      eventId: { $in: eventIds },
      status: 'pending',
    });

    res.json({
      success: true,
      data: {
        totalClubs,
        totalEvents,
        totalMembers,
        pendingRegistrations,
      },
    });
  } catch (error) {
    console.error('Error fetching moderator dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
    });
  }
};

/**
 * Get moderator's recent events
 * @route GET /api/v1/dashboard/moderator/events
 * @access Private (Moderator/Admin)
 */
export const getModeratorEvents = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }
    const userId = req.user._id;
    const isAdmin = req.user.role === 'admin';
    const limit = parseInt(req.query.limit as string) || 10;

    // Get clubs moderated by user
    const clubQuery = isAdmin ? {} : { moderators: userId };
    const clubs = await ClubModel.find(clubQuery).select('_id name');
    const clubIds = clubs.map((c: any) => c._id);

    const events = await EventModel.find({
      clubId: { $in: clubIds },
    })
      .sort({ startDate: -1 })
      .limit(limit)
      .populate('clubId', 'name')
      .select('title startDate endDate registrationCount capacity status');

    res.json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error('Error fetching moderator events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch events',
    });
  }
};

/**
 * Get moderator's pending registrations
 * @route GET /api/v1/dashboard/moderator/registrations
 * @access Private (Moderator/Admin)
 */
export const getModeratorPendingRegistrations = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }
    const userId = req.user._id;
    const isAdmin = req.user.role === 'admin';
    const limit = parseInt(req.query.limit as string) || 10;

    // Get clubs moderated by user
    const clubQuery = isAdmin ? {} : { moderators: userId };
    const clubs = await ClubModel.find(clubQuery).select('_id');
    const clubIds = clubs.map((c: any) => c._id);

    // Get events for these clubs
    const events = await EventModel.find({
      clubId: { $in: clubIds },
    }).select('_id title');
    const eventIds = events.map((e: any) => e._id);

    const registrations = await RegistrationModel.find({
      eventId: { $in: eventIds },
      status: 'pending',
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('userId', 'name email')
      .populate('eventId', 'title')
      .select('userId eventId createdAt');

    const formattedRegistrations = registrations.map((reg: any) => ({
      _id: reg._id,
      userName: reg.userId?.name || 'Unknown User',
      userEmail: reg.userId?.email || '',
      eventTitle: reg.eventId?.title || 'Unknown Event',
      submittedAt: reg.createdAt,
    }));

    res.json({
      success: true,
      data: formattedRegistrations,
    });
  } catch (error) {
    console.error('Error fetching pending registrations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending registrations',
    });
  }
};

/**
 * Get admin dashboard statistics
 * @route GET /api/v1/dashboard/admin/stats
 * @access Private (Admin)
 */
export const getAdminDashboardStats = async (req: Request, res: Response) => {
  try {
    const [totalUsers, totalEvents, totalClubs, totalRegistrations] =
      await Promise.all([
        UserModel.countDocuments(),
        EventModel.countDocuments(),
        ClubModel.countDocuments(),
        RegistrationModel.countDocuments(),
      ]);

    // Get new users this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const newUsersThisMonth = await UserModel.countDocuments({
      createdAt: { $gte: startOfMonth },
    });

    // Get active events
    const now = new Date();
    const activeEvents = await EventModel.countDocuments({
      startDate: { $lte: now },
      endDate: { $gte: now },
    });

    res.json({
      success: true,
      data: {
        totalUsers,
        totalEvents,
        totalClubs,
        totalRegistrations,
        newUsersThisMonth,
        activeEvents,
      },
    });
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
    });
  }
};

/**
 * Get admin recent activity
 * @route GET /api/v1/dashboard/admin/activity
 * @access Private (Admin)
 */
export const getAdminRecentActivity = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    const activities = await AuditLogModel.find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('userId', 'name email')
      .select('userId action resourceType resourceId timestamp');

    const formattedActivities = activities.map((activity: any) => ({
      _id: activity._id,
      user: activity.userId?.name || 'System',
      action: activity.action,
      resourceType: activity.resource,
      timestamp: activity.timestamp,
    }));

    res.json({
      success: true,
      data: formattedActivities,
    });
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent activity',
    });
  }
};

/**
 * Get system health status
 * @route GET /api/v1/dashboard/admin/health
 * @access Private (Admin)
 */
export const getSystemHealth = async (req: Request, res: Response) => {
  try {
    // Check database connection
    const dbStatus =
      mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy';

    // Check server uptime
    const uptime = process.uptime();
    const serverStatus = uptime > 0 ? 'healthy' : 'unhealthy';

    // Memory usage
    const memoryUsage = process.memoryUsage();
    const memoryUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const memoryTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
    const memoryPercentage = Math.round((memoryUsedMB / memoryTotalMB) * 100);

    res.json({
      success: true,
      data: {
        server: {
          status: serverStatus,
          uptime: Math.floor(uptime),
          memory: {
            used: memoryUsedMB,
            total: memoryTotalMB,
            percentage: memoryPercentage,
          },
        },
        database: {
          status: dbStatus,
          name: mongoose.connection.name,
        },
        cache: {
          status: 'not_configured', // Placeholder for future Redis integration
        },
      },
    });
  } catch (error) {
    console.error('Error fetching system health:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system health',
    });
  }
};
