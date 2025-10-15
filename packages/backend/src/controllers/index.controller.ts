import { Request, Response, NextFunction } from 'express';
import { User } from '@event-management/shared';
import Event from '../models/event.model.js';
import { AuthenticatedRequest } from '../types/express.js';

// Standardized API response format
interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export const getIndex = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const now = new Date();

    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const todayEnd = new Date(now.setHours(23, 59, 59, 999));

    const ongoingEvents = await Event.find({
      startDate: { $lte: todayEnd },
      endDate: { $gte: todayStart },
      $and: [
        {
          $or: [
            { startDate: { $lt: todayStart } },
            { startTime: { $lte: now.toISOString().split('T')[1] } },
          ],
        },
        {
          $or: [
            { endDate: { $gt: todayEnd } },
            { endTime: { $gte: now.toISOString().split('T')[1] } },
          ],
        },
      ],
    }).populate('club');

    const upcomingEvents = await Event.find({
      $or: [
        { startDate: { $gt: todayEnd } }, // Future date
        {
          startDate: { $eq: todayStart }, // Today but after current time
          startTime: { $gt: now.toISOString().split('T')[1] },
        },
      ],
    }).populate('club');

    const response: ApiResponse<{
      ongoingEvents: any[];
      upcomingEvents: any[];
    }> = {
      success: true,
      message: 'Dashboard data retrieved successfully',
      data: {
        ongoingEvents: ongoingEvents as any[],
        upcomingEvents: upcomingEvents as any[],
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching events:', error);
    next(error);
  }
};

export const getAbout = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const user = (req as unknown as AuthenticatedRequest).user;
    const isAuthenticated = (req as unknown as AuthenticatedRequest)
      .isAuthenticated;

    const response: ApiResponse<{
      pageInfo: {
        title: string;
        type: string;
      };
    }> = {
      success: true,
      message: 'About page data retrieved successfully',
      data: {
        pageInfo: {
          title: 'About',
          type: 'static-page',
        },
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error loading about page:', error);
    next(error);
  }
};

export const getPrivacy = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const user = (req as unknown as AuthenticatedRequest).user;
    const isAuthenticated = (req as unknown as AuthenticatedRequest)
      .isAuthenticated;

    const response: ApiResponse<{
      pageInfo: {
        title: string;
        type: string;
      };
    }> = {
      success: true,
      message: 'Privacy policy page data retrieved successfully',
      data: {
        pageInfo: {
          title: 'Privacy Policy',
          type: 'static-page',
        },
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error loading privacy page:', error);
    next(error);
  }
};
