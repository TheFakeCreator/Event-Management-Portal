import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Event from '../models/event.model.js';
import Club from '../models/club.model.js';
import EventRegistration from '../models/eventRegistration.model.js';
import Log from '../models/log.model.js';
import User from '../models/user.model.js';
import { AuthenticatedRequest } from '../types/express.js';
// import sendEmail from '../utils/sendEmail.js'; // TODO: Convert
// import cloudinary from '../configs/cloudinary.js'; // TODO: Convert

import {
  CreateEventRequest,
  UpdateEventRequest,
  EventSponsor,
  EventWinner,
  EventReport,
} from '@event-management/shared';

// Standardized API response interface
interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

// Helper function to extract public_id from Cloudinary URL
const extractPublicId = (
  cloudinaryUrl: string | undefined | null
): string | null => {
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

// Extended interfaces for requests
interface EventCreateRequest {
  title: string;
  description: string;
  Type: string; // Note: matches the model field name
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  location: string;
  image: string;
  club: string;
  collaborators?: string; // JSON string
  eventLeads?: string; // JSON string
  sponsors?: string; // JSON string
}

interface EventEditRequest extends EventCreateRequest {
  winners?: string; // JSON string
}

interface EventRegistrationRequest {
  name: string;
  email: string;
  phone: string;
}

interface EventReportRequest {
  reason: string;
  description: string;
}

interface EventWinnersRequest {
  winners: string; // JSON string
}

// Get all events with pagination and filtering
export const getAllEvents = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      clubId,
      search,
      sortBy = 'startDate',
      sortOrder = 'asc',
    } = req.query;

    const filter: any = {};

    // Add filters based on query parameters
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (clubId) filter.club = clubId;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    const [events, totalEvents] = await Promise.all([
      Event.find(filter)
        .populate({
          path: 'club',
          select: 'name slug avatar',
        })
        .populate({
          path: 'createdBy',
          select: 'name username',
        })
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Event.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalEvents / Number(limit));

    const response: ApiResponse = {
      success: true,
      message: 'Events retrieved successfully',
      data: {
        events,
        pagination: {
          currentPage: Number(page),
          totalPages,
          totalEvents,
          hasNextPage: Number(page) < totalPages,
          hasPrevPage: Number(page) > 1,
        },
      },
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Get event details by ID
export const getEventById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid event ID',
      };
      return res.status(400).json(response);
    }

    const event = await Event.findById(id)
      .populate('club', 'name description image slug')
      .populate('collaborators', 'name description image slug')
      .populate('eventLeads', 'name email username')
      .populate('createdBy', 'name username');

    if (!event) {
      const response: ApiResponse = {
        success: false,
        message: 'Event not found',
      };
      return res.status(404).json(response);
    }

    // Get registration count
    const registrationCount = await EventRegistration.countDocuments({
      event: id,
    });

    const response: ApiResponse = {
      success: true,
      message: 'Event details retrieved successfully',
      data: {
        event,
        registrationCount,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const createEvent = async (
  req: Request<{}, any, EventCreateRequest>,
  res: Response,
  next: NextFunction
) => {
  try {
    const authReq = req as any; // Use any to bypass type checking for now
    const user = authReq.userInfo;
    const {
      title,
      description,
      Type,
      startDate,
      endDate,
      startTime,
      endTime,
      location,
      image,
      club,
      collaborators,
      eventLeads,
      sponsors,
    } = req.body;

    // Input validation
    if (
      !title ||
      !description ||
      !Type ||
      !startDate ||
      !endDate ||
      !startTime ||
      !endTime ||
      !location ||
      !image ||
      !club
    ) {
      const response: ApiResponse = {
        success: false,
        message: 'All required fields must be provided',
        errors: {
          required: [
            'title',
            'description',
            'Type',
            'startDate',
            'endDate',
            'startTime',
            'endTime',
            'location',
            'image',
            'club',
          ],
        },
      };
      return res.status(400).json(response);
    }

    let collaboratorsArray: mongoose.Types.ObjectId[] = [];
    if (collaborators) {
      try {
        const parsedCollaborators = JSON.parse(collaborators);
        if (Array.isArray(parsedCollaborators)) {
          collaboratorsArray = parsedCollaborators.map(
            (id: string) => new mongoose.Types.ObjectId(id)
          );
        }
      } catch (error) {
        const response: ApiResponse = {
          success: false,
          message: 'Invalid collaborators format. Must be a valid JSON array.',
        };
        return res.status(400).json(response);
      }
    }

    // Handle event leads
    let eventLeadsArray: mongoose.Types.ObjectId[] = [];
    if (eventLeads) {
      try {
        const parsedEventLeads = JSON.parse(eventLeads);
        if (Array.isArray(parsedEventLeads)) {
          eventLeadsArray = parsedEventLeads.map(
            (id: string) => new mongoose.Types.ObjectId(id)
          );
        }
      } catch (error) {
        console.log('Error parsing event leads:', error);
        // Continue without event leads if there's an error
      }
    }

    // Handle sponsors
    let sponsorsArray: EventSponsor[] = [];
    if (sponsors) {
      try {
        const parsedSponsors = JSON.parse(sponsors);
        if (Array.isArray(parsedSponsors)) {
          sponsorsArray = parsedSponsors.filter(
            (sponsor: EventSponsor) => sponsor.name && sponsor.name.trim()
          );
        }
      } catch (error) {
        console.log('Error parsing sponsors:', error);
        // Continue without sponsors if there's an error
      }
    }

    const event = await Event.create({
      title,
      description,
      Type,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      startTime,
      endTime,
      location,
      image,
      club: new mongoose.Types.ObjectId(club),
      createdBy: new mongoose.Types.ObjectId(authReq.userInfo!._id),
      collaborators: collaboratorsArray,
      eventLeads: eventLeadsArray,
      sponsors: sponsorsArray,
    });

    await Log.create({
      user: new mongoose.Types.ObjectId(authReq.userInfo!._id),
      action: 'CREATE',
      targetType: 'EVENT',
      targetId: event._id,
      details: `Event ${event.title} created by ${authReq.userInfo!.name}`,
    });

    // Populate the created event for response
    const populatedEvent = await Event.findById(event._id)
      .populate('club', 'name slug')
      .populate('createdBy', 'name username')
      .populate('collaborators', 'name slug')
      .populate('eventLeads', 'name email');

    const response: ApiResponse = {
      success: true,
      message: 'Event created successfully',
      data: {
        event: populatedEvent,
      },
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

export const deleteEvent = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid event ID',
      };
      return res.status(400).json(response);
    }

    const event = await Event.findById(id);
    if (!event) {
      const response: ApiResponse = {
        success: false,
        message: 'Event not found',
      };
      return res.status(404).json(response);
    }

    // Check if the user is authorized to delete the event
    if (
      event.createdBy.toString() !== authReq.userInfo!._id.toString() &&
      authReq.userInfo!.role !== 'admin'
    ) {
      const response: ApiResponse = {
        success: false,
        message: 'You are not authorized to delete this event',
      };
      return res.status(403).json(response);
    }

    // Extract public_id from the image URL for Cloudinary
    const publicId = extractPublicId(event.image);
    if (publicId) {
      try {
        // TODO: Delete the image from Cloudinary
        // await cloudinary.uploader.destroy(publicId);
        console.log('Would delete image from Cloudinary:', publicId);
      } catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
      }
    }

    await Event.findByIdAndDelete(event._id);

    await Log.create({
      user: new mongoose.Types.ObjectId(authReq.userInfo!._id),
      action: 'DELETE',
      targetType: 'EVENT',
      targetId: new mongoose.Types.ObjectId(id),
      details: `Event ${event.title} deleted by ${authReq.userInfo!.name}`,
    });

    const response: ApiResponse = {
      success: true,
      message: 'Event deleted successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const registerEvent = async (
  req: Request<{ id: string }, any, EventRegistrationRequest>,
  res: Response,
  next: NextFunction
) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const { id } = req.params;
    const { name, email, phone } = req.body;

    // Input validation
    if (!name || !email || !phone) {
      const response: ApiResponse = {
        success: false,
        message: 'Name, email, and phone are required for registration',
        errors: {
          required: ['name', 'email', 'phone'],
        },
      };
      return res.status(400).json(response);
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid event ID',
      };
      return res.status(400).json(response);
    }

    const event = await Event.findById(id);
    if (!event) {
      const response: ApiResponse = {
        success: false,
        message: 'Event not found',
      };
      return res.status(404).json(response);
    }

    // Check if user is already registered
    const existingRegistration = await EventRegistration.findOne({
      event: id,
      email,
    });

    if (existingRegistration) {
      const response: ApiResponse = {
        success: false,
        message: 'You are already registered for this event',
      };
      return res.status(400).json(response);
    }

    // Create registration
    const registration = await EventRegistration.create({
      event: new mongoose.Types.ObjectId(id),
      name,
      email,
      phone,
      user: authReq.userInfo
        ? new mongoose.Types.ObjectId(authReq.userInfo._id)
        : undefined,
    });

    // Update event registration count
    event.registeredUsers = (event.registeredUsers || 0) + 1;
    await event.save();

    // TODO: Send confirmation email
    // await sendEmail({
    //     to: email,
    //     subject: `Registration Confirmation - ${event.title}`,
    //     html: `Registration confirmation email content`
    // });

    const response: ApiResponse = {
      success: true,
      message: 'Successfully registered for the event',
      data: {
        registration: {
          id: registration._id,
          eventId: event._id,
          eventTitle: event.title,
          name: registration.name,
          email: registration.email,
          phone: registration.phone,
          registeredAt: registration.createdAt,
        },
      },
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

export const editEvent = async (
  req: Request<{ id: string }, any, EventEditRequest>,
  res: Response,
  next: NextFunction
) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const { id } = req.params;
    const {
      title,
      description,
      Type,
      startDate,
      endDate,
      startTime,
      endTime,
      location,
      image,
      club,
      collaborators,
      eventLeads,
      sponsors,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid event ID',
      };
      return res.status(400).json(response);
    }

    // Only allow the creator or admin to edit
    const event = await Event.findById(id);
    if (!event) {
      const response: ApiResponse = {
        success: false,
        message: 'Event not found',
      };
      return res.status(404).json(response);
    }

    if (
      event.createdBy.toString() !== authReq.userInfo!._id.toString() &&
      authReq.userInfo!.role !== 'admin'
    ) {
      const response: ApiResponse = {
        success: false,
        message: 'You are not authorized to edit this event',
      };
      return res.status(403).json(response);
    }

    let collaboratorsArray: mongoose.Types.ObjectId[] = [];
    if (collaborators) {
      try {
        const parsedCollaborators = JSON.parse(collaborators);
        if (Array.isArray(parsedCollaborators)) {
          collaboratorsArray = parsedCollaborators.map(
            (id: string) => new mongoose.Types.ObjectId(id)
          );
        }
      } catch (error) {
        const response: ApiResponse = {
          success: false,
          message: 'Invalid collaborators format. Must be a valid JSON array.',
        };
        return res.status(400).json(response);
      }
    }

    // Handle event leads
    let eventLeadsArray: mongoose.Types.ObjectId[] = [];
    if (eventLeads) {
      try {
        if (typeof eventLeads === 'string' && eventLeads.startsWith('[')) {
          // New format: JSON array of user IDs
          const parsedEventLeads = JSON.parse(eventLeads);
          if (Array.isArray(parsedEventLeads)) {
            eventLeadsArray = parsedEventLeads.map(
              (id: string) => new mongoose.Types.ObjectId(id)
            );
          }
        } else {
          // Legacy format: array of emails
          const emailsArray = Array.isArray(eventLeads)
            ? eventLeads
            : [eventLeads];

          const users = await User.find({
            email: {
              $in: emailsArray.filter((email: string) => email && email.trim()),
            },
          });

          eventLeadsArray = users.map((user) => user._id);
        }
      } catch (error) {
        console.error('Error processing event leads:', error);
        const response: ApiResponse = {
          success: false,
          message: 'Invalid event leads format',
        };
        return res.status(400).json(response);
      }
    }

    // Handle sponsors
    let sponsorsArray: EventSponsor[] = [];
    if (sponsors) {
      try {
        const parsedSponsors = JSON.parse(sponsors);
        if (Array.isArray(parsedSponsors)) {
          sponsorsArray = parsedSponsors.filter(
            (sponsor: EventSponsor) => sponsor.name && sponsor.name.trim()
          );
        }
      } catch (error) {
        console.error('Error processing sponsors:', error);
        // Continue without sponsors if there's an error
      }
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      {
        title,
        description,
        Type,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        startTime,
        endTime,
        location,
        image,
        club: new mongoose.Types.ObjectId(club),
        collaborators: collaboratorsArray,
        eventLeads: eventLeadsArray,
        sponsors: sponsorsArray,
      },
      { new: true }
    )
      .populate('club', 'name slug')
      .populate('collaborators', 'name slug')
      .populate('eventLeads', 'name email')
      .populate('createdBy', 'name username');

    if (!updatedEvent) {
      const response: ApiResponse = {
        success: false,
        message: 'Failed to update event',
      };
      return res.status(500).json(response);
    }

    await Log.create({
      user: new mongoose.Types.ObjectId(authReq.userInfo!._id),
      action: 'EDIT',
      targetType: 'EVENT',
      targetId: new mongoose.Types.ObjectId(id),
      details: `Event ${updatedEvent.title} edited by ${authReq.userInfo!.name}`,
    });

    const response: ApiResponse = {
      success: true,
      message: 'Event updated successfully',
      data: {
        event: updatedEvent,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getEventParticipants = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid event ID',
      };
      return res.status(400).json(response);
    }

    const event = await Event.findById(id)
      .populate('club', 'name slug')
      .populate('collaborators', 'name slug')
      .populate('eventLeads', 'name email');

    if (!event) {
      const response: ApiResponse = {
        success: false,
        message: 'Event not found',
      };
      return res.status(404).json(response);
    }

    // Check if user is authorized to view participants
    if (
      event.createdBy.toString() !== authReq.userInfo!._id.toString() &&
      authReq.userInfo!.role !== 'admin' &&
      !event.eventLeads.some(
        (lead: any) => lead._id.toString() === authReq.userInfo!._id.toString()
      )
    ) {
      const response: ApiResponse = {
        success: false,
        message: 'You are not authorized to view participants',
      };
      return res.status(403).json(response);
    }

    // Get event registrations with pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [registrations, totalCount] = await Promise.all([
      EventRegistration.find({ event: id })
        .populate('user', 'name email username')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      EventRegistration.countDocuments({ event: id }),
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'Event participants retrieved successfully',
      data: {
        event: {
          id: event._id,
          title: event.title,
          club: event.club,
          eventLeads: event.eventLeads,
        },
        participants: registrations,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPrevPage: page > 1,
        },
      },
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const reportEvent = async (
  req: Request<{ id: string }, any, EventReportRequest>,
  res: Response,
  next: NextFunction
) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const { id } = req.params;
    const { reason, description } = req.body;

    // Input validation
    if (!reason || !description) {
      const response: ApiResponse = {
        success: false,
        message: 'Reason and description are required',
        errors: {
          required: ['reason', 'description'],
        },
      };
      return res.status(400).json(response);
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid event ID',
      };
      return res.status(400).json(response);
    }

    const event = await Event.findById(id);
    if (!event) {
      const response: ApiResponse = {
        success: false,
        message: 'Event not found',
      };
      return res.status(404).json(response);
    }

    // Check if user already reported this event
    const existingReport = event.reports.find(
      (report: any) =>
        report.reportedBy.toString() === authReq.userInfo!._id.toString()
    );

    if (existingReport) {
      const response: ApiResponse = {
        success: false,
        message: 'You have already reported this event',
      };
      return res.status(400).json(response);
    }

    // Add report to event
    event.reports.push({
      reportedBy: new mongoose.Types.ObjectId(authReq.userInfo!._id),
      reason: reason as any,
      description,
      reportedAt: new Date(),
      status: 'pending',
    } as any);

    await event.save();

    // Log the report
    await Log.create({
      user: new mongoose.Types.ObjectId(authReq.userInfo!._id),
      action: 'OTHER' as any,
      targetType: 'EVENT',
      targetId: new mongoose.Types.ObjectId(id),
      details: `Event ${event.title} reported by ${authReq.userInfo!.name} for ${reason}`,
    });

    const response: ApiResponse = {
      success: true,
      message: 'Event reported successfully. Admin will review it.',
      data: {
        eventId: event._id,
        eventTitle: event.title,
        reportReason: reason,
      },
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

export const addEventWinners = async (
  req: Request<{ id: string }, any, EventWinnersRequest>,
  res: Response,
  next: NextFunction
) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const { id } = req.params;
    const { winners } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid event ID',
      };
      return res.status(400).json(response);
    }

    const event = await Event.findById(id);
    if (!event) {
      const response: ApiResponse = {
        success: false,
        message: 'Event not found',
      };
      return res.status(404).json(response);
    }

    // Check if user is authorized to add winners
    if (
      event.createdBy.toString() !== authReq.userInfo!._id.toString() &&
      authReq.userInfo!.role !== 'admin' &&
      !event.eventLeads.some(
        (lead: any) => lead.toString() === authReq.userInfo!._id.toString()
      )
    ) {
      const response: ApiResponse = {
        success: false,
        message: 'You are not authorized to add winners',
      };
      return res.status(403).json(response);
    }

    let winnersArray: EventWinner[] = [];
    if (winners) {
      try {
        winnersArray = JSON.parse(winners);
        if (!Array.isArray(winnersArray)) {
          throw new Error('Winners must be an array');
        }
      } catch (error) {
        const response: ApiResponse = {
          success: false,
          message: 'Invalid winners format. Must be a valid JSON array.',
        };
        return res.status(400).json(response);
      }
    }

    // Update event with winners
    event.winners = winnersArray;
    await event.save();

    // Log the action
    await Log.create({
      user: new mongoose.Types.ObjectId(authReq.userInfo!._id),
      action: 'EDIT',
      targetType: 'EVENT',
      targetId: new mongoose.Types.ObjectId(id),
      details: `Winners added to event ${event.title} by ${authReq.userInfo!.name}`,
    });

    // Populate the updated event for response
    const updatedEvent = await Event.findById(id)
      .populate('club', 'name slug')
      .populate('createdBy', 'name username');

    const response: ApiResponse = {
      success: true,
      message: 'Winners added successfully',
      data: {
        event: {
          id: updatedEvent!._id,
          title: updatedEvent!.title,
          winners: updatedEvent!.winners,
          club: updatedEvent!.club,
          createdBy: updatedEvent!.createdBy,
        },
      },
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
