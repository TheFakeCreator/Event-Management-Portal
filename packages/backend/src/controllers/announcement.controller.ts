import { Request, Response, NextFunction } from 'express';
import { User } from '@event-management/shared';
import Announcement from '../models/announcement.model.js';
import Club from '../models/club.model.js';
import { AuthenticatedRequest } from '../types/express.js';

// Request interfaces for announcement operations
interface AnnouncementCreateRequest {
  title: string;
  message: string;
  clubId?: string;
}

interface AnnouncementUpdateRequest {
  title: string;
  message: string;
  clubId?: string;
}

// Response interfaces with populated fields
interface AnnouncementWithDetails {
  _id: string;
  title: string;
  message: string;
  postedBy: {
    _id: string;
    name: string;
    email: string;
  };
  club?: {
    _id: string;
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Standardized API response format
interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export const getAllAnnouncements = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const [announcements, clubs] = await Promise.all([
      Announcement.find()
        .populate('postedBy', 'name email')
        .populate('club', 'name')
        .sort({ createdAt: -1 }),
      req.userInfo && req.userInfo.role === 'admin'
        ? Club.find().select('name').sort('name')
        : Promise.resolve(null),
    ]);

    const response: ApiResponse<{
      announcements: any[];
      clubs: any[] | null;
    }> = {
      success: true,
      message: 'Announcements retrieved successfully',
      data: {
        announcements: announcements as any[],
        clubs: clubs as any[] | null,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    next(error);
  }
};

export const createAnnouncement = async (
  req: Request<{}, {}, AnnouncementCreateRequest>,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { title, message, clubId } = req.body;
    const user = (req as unknown as AuthenticatedRequest).userInfo;

    if (!title || !message) {
      const response: ApiResponse = {
        success: false,
        message: 'Title and message are required',
      };
      return res.status(400).json(response);
    }

    const announcement = new Announcement({
      title,
      message,
      postedBy: user._id,
      club: clubId || null,
    });

    await announcement.save();

    // Populate the created announcement for response
    const populatedAnnouncement = await Announcement.findById(announcement._id)
      .populate('postedBy', 'name email')
      .populate('club', 'name');

    const response: ApiResponse<any> = {
      success: true,
      message: 'Announcement created successfully',
      data: populatedAnnouncement,
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating announcement:', error);
    next(error);
  }
};

export const getAnnouncementById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { id } = req.params;

    const announcement = await Announcement.findById(id)
      .populate('postedBy', 'name email')
      .populate('club', 'name');

    if (!announcement) {
      const response: ApiResponse = {
        success: false,
        message: 'Announcement not found',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<any> = {
      success: true,
      message: 'Announcement retrieved successfully',
      data: announcement,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching announcement:', error);
    next(error);
  }
};

export const updateAnnouncement = async (
  req: Request<{ id: string }, {}, AnnouncementUpdateRequest>,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { id } = req.params;
    const { title, message, clubId } = req.body;

    if (!title || !message) {
      const response: ApiResponse = {
        success: false,
        message: 'Title and message are required',
      };
      return res.status(400).json(response);
    }

    const updatedAnnouncement = await Announcement.findByIdAndUpdate(
      id,
      {
        title,
        message,
        club: clubId || null,
        updatedAt: Date.now(),
      },
      { new: true, runValidators: true }
    )
      .populate('postedBy', 'name email')
      .populate('club', 'name');

    if (!updatedAnnouncement) {
      const response: ApiResponse = {
        success: false,
        message: 'Announcement not found',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<any> = {
      success: true,
      message: 'Announcement updated successfully',
      data: updatedAnnouncement,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error updating announcement:', error);

    if ((error as any)?.name === 'ValidationError') {
      const response: ApiResponse = {
        success: false,
        message: 'Validation failed',
        error: (error as any).message,
      };
      return res.status(400).json(response);
    }

    next(error);
  }
};

export const deleteAnnouncement = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { id } = req.params;

    const deletedAnnouncement = await Announcement.findByIdAndDelete(id);

    if (!deletedAnnouncement) {
      const response: ApiResponse = {
        success: false,
        message: 'Announcement not found',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Announcement deleted successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error deleting announcement:', error);
    next(error);
  }
};
