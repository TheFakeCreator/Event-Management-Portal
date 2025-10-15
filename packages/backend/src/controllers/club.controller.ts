import { Request, Response, NextFunction } from 'express';
import { User } from '@event-management/shared';
import {
  ClubCreateRequest,
  ClubEditRequest,
  ClubAboutEditRequest,
  ClubSponsorRequest,
  ClubWithData,
} from '@event-management/shared';
import Club from '../models/club.model.js';
import Event from '../models/event.model.js';
import Recruitment from '../models/recruitment.model.js';
import { AuthenticatedRequest } from '../types/express.js';
// import { marked } from 'marked';

// Standardized API response interface
interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

// Simple markdown parser fallback
const marked = {
  parse: (text: string) => text, // Simple fallback
};

interface FlashRequest extends Request {
  flash(type: string, message?: string): string[] | void;
}

// Club sub-pages mapping
const clubSubPages: Record<string, string> = {
  about: 'clubDetailsAbout',
  recruitments: 'clubDetailsRecruitments',
  gallery: 'clubDetailsGallery',
  socials: 'clubDetailsSocials',
  events: 'clubDetailsEvents',
  members: 'clubDetailsMembers',
  sponsors: 'clubDetailsSponsors',
};

// Get all clubs with pagination and filtering
export const getAllClubs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      search,
      sortBy = 'name',
      sortOrder = 'asc',
    } = req.query;

    const filter: any = {};

    // Add filters based on query parameters
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    const [clubs, totalClubs] = await Promise.all([
      Club.find(filter)
        .populate('currentMembers', 'name username avatar')
        .populate('moderators', 'name username avatar')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Club.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalClubs / Number(limit));

    const response: ApiResponse = {
      success: true,
      message: 'Clubs retrieved successfully',
      data: {
        clubs,
        pagination: {
          currentPage: Number(page),
          totalPages,
          totalClubs,
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

// Get club details by ID with additional data based on section
export const getClubById = async (
  req: Request<{ id: string; section?: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id, section } = req.params;

    // Validate ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid club ID format',
      };
      return res.status(400).json(response);
    }

    const club = await Club.findById(id)
      .populate('currentMembers', 'name username avatar email')
      .populate('moderators', 'name username avatar email')
      .populate('pastMembers', 'name username avatar')
      .lean();

    if (!club) {
      const response: ApiResponse = {
        success: false,
        message: 'Club not found',
      };
      return res.status(404).json(response);
    }

    const additionalData: any = {};

    // Load section-specific data based on the section parameter
    if (section === 'recruitments' || !section) {
      const now = new Date();
      const [activeRecruitments, pastRecruitments] = await Promise.all([
        Recruitment.find({
          club: id,
          deadline: { $gte: now },
        })
          .sort({ deadline: 1 })
          .lean(),
        Recruitment.find({
          club: id,
          deadline: { $lt: now },
        })
          .sort({ deadline: -1 })
          .lean(),
      ]);
      additionalData.activeRecruitments = activeRecruitments;
      additionalData.pastRecruitments = pastRecruitments;
    }

    if (section === 'events' || !section) {
      const now = new Date();
      const [activeEvents, pastEvents] = await Promise.all([
        Event.find({
          club: id,
          endDate: { $gte: now },
        })
          .sort({ startDate: 1 })
          .lean(),
        Event.find({
          club: id,
          endDate: { $lt: now },
        })
          .sort({ endDate: -1 })
          .lean(),
      ]);
      additionalData.activeEvents = activeEvents;
      additionalData.pastEvents = pastEvents;
    }

    const response: ApiResponse = {
      success: true,
      message: 'Club details retrieved successfully',
      data: {
        club: {
          ...club,
          ...additionalData,
        },
      },
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const createClub = async (
  req: Request<{}, {}, ClubCreateRequest>,
  res: Response,
  next: NextFunction
) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const { name, description, image, oc } = req.body;

    // Input validation
    if (!name || !description || !image) {
      const response: ApiResponse = {
        success: false,
        message: 'All required fields must be provided',
        errors: {
          required: ['name', 'description', 'image'],
        },
      };
      return res.status(400).json(response);
    }

    // Check if club name already exists
    const existingClub = await Club.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
    });

    if (existingClub) {
      const response: ApiResponse = {
        success: false,
        message: 'A club with this name already exists',
      };
      return res.status(400).json(response);
    }

    const newClub = await Club.create({
      name,
      description,
      image,
      createdBy: authReq.userInfo._id,
      moderators: [authReq.userInfo._id], // Creator becomes the first moderator
    });

    // Populate the created club for response
    const populatedClub = await Club.findById(newClub._id)
      .populate('moderators', 'name username avatar')
      .populate('createdBy', 'name username');

    const response: ApiResponse = {
      success: true,
      message: 'Club created successfully',
      data: {
        club: populatedClub,
      },
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

export const updateClub = async (
  req: Request<{ id: string }, {}, ClubEditRequest>,
  res: Response,
  next: NextFunction
) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const { id } = req.params;

    // Validate ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid club ID format',
      };
      return res.status(400).json(response);
    }

    const club = await Club.findById(id);
    if (!club) {
      const response: ApiResponse = {
        success: false,
        message: 'Club not found',
      };
      return res.status(404).json(response);
    }

    // Authorization check: Only allow admin or moderator
    const isAuthorized =
      authReq.userInfo.role === 'admin' ||
      (club.moderators &&
        club.moderators
          .map((m) => m.toString())
          .includes(authReq.userInfo._id.toString()));

    if (!isAuthorized) {
      const response: ApiResponse = {
        success: false,
        message: 'You are not authorized to edit this club',
      };
      return res.status(403).json(response);
    }

    // Update club with provided fields
    const updateFields: any = { ...req.body };

    // Remove undefined/null fields
    Object.keys(updateFields).forEach((key) => {
      if (updateFields[key] === undefined || updateFields[key] === null) {
        delete updateFields[key];
      }
    });

    const updatedClub = await Club.findByIdAndUpdate(id, updateFields, {
      new: true,
      runValidators: true,
    })
      .populate('moderators', 'name username avatar')
      .populate('currentMembers', 'name username avatar')
      .populate('createdBy', 'name username');

    const response: ApiResponse = {
      success: true,
      message: 'Club updated successfully',
      data: {
        club: updatedClub,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const editAboutClub = async (
  req: Request<{ id: string }, {}, ClubAboutEditRequest>,
  res: Response,
  next: NextFunction
) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const { id } = req.params;
    const { about } = req.body;

    // Validate ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid club ID format',
      };
      return res.status(400).json(response);
    }

    const club = await Club.findById(id);
    if (!club) {
      const response: ApiResponse = {
        success: false,
        message: 'Club not found',
      };
      return res.status(404).json(response);
    }

    // Check permission - only admin or club moderator can edit
    const isClubMod =
      authReq.userInfo.role === 'admin' ||
      (club.moderators &&
        club.moderators
          .map((m) => m.toString())
          .includes(authReq.userInfo._id.toString()));

    if (!isClubMod) {
      const response: ApiResponse = {
        success: false,
        message: 'You are not authorized to edit this club',
      };
      return res.status(403).json(response);
    }

    // Update the about field
    club.about = about;
    await club.save();

    // Return the updated content
    const response: ApiResponse = {
      success: true,
      message: 'About section updated successfully',
      data: {
        club: {
          id: club._id,
          name: club.name,
          about: club.about,
        },
      },
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Add sponsor to club
export const addClubSponsor = async (
  req: Request<{ id: string }, {}, ClubSponsorRequest>,
  res: Response,
  next: NextFunction
) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const { id } = req.params;
    const { name, logo, description, website } = req.body;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid club ID format',
      };
      return res.status(400).json(response);
    }

    if (!name || !logo) {
      const response: ApiResponse = {
        success: false,
        message: 'Name and logo are required',
        errors: {
          required: ['name', 'logo'],
        },
      };
      return res.status(400).json(response);
    }

    const club = await Club.findById(id);
    if (!club) {
      const response: ApiResponse = {
        success: false,
        message: 'Club not found',
      };
      return res.status(404).json(response);
    }

    // Check permission - only admin or club moderator can add sponsors
    const isClubMod =
      authReq.userInfo.role === 'admin' ||
      (club.moderators &&
        club.moderators
          .map((m) => m.toString())
          .includes(authReq.userInfo._id.toString()));

    if (!isClubMod) {
      const response: ApiResponse = {
        success: false,
        message: 'You are not authorized to manage sponsors for this club',
      };
      return res.status(403).json(response);
    }

    club.sponsors.push({
      name,
      logo,
      description,
      website,
    });

    await club.save();

    const response: ApiResponse = {
      success: true,
      message: 'Sponsor added successfully',
      data: {
        club: {
          id: club._id,
          name: club.name,
          sponsors: club.sponsors,
        },
      },
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

export const editClubSponsor = async (
  req: Request<{ id: string; sponsorId: string }, {}, ClubSponsorRequest>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, logo, description, website } = req.body;
    const { id: clubId, sponsorId } = req.params;
    const authReq = req as unknown as AuthenticatedRequest;

    const club = await Club.findById(clubId);
    if (!club) {
      res.status(404).json({
        success: false,
        message: 'Club not found',
      });
      return;
    }

    // Check permission
    const isClubMod =
      authReq.userInfo.role === 'admin' ||
      (club.moderators &&
        club.moderators
          .map((m) => m.toString())
          .includes(authReq.userInfo._id.toString()));

    if (!isClubMod) {
      res.status(403).json({
        success: false,
        message: 'You are not authorized to edit sponsors for this club',
      });
      return;
    }

    const sponsorIndex = club.sponsors.findIndex(
      (s) => s._id?.toString() === sponsorId
    );

    if (sponsorIndex === -1) {
      res.status(404).json({
        success: false,
        message: 'Sponsor not found',
      });
      return;
    }

    club.sponsors[sponsorIndex] = {
      ...club.sponsors[sponsorIndex],
      name,
      logo,
      description,
      website,
    };

    await club.save();

    res.status(200).json({
      success: true,
      message: 'Sponsor updated successfully',
      data: {
        sponsor: club.sponsors[sponsorIndex],
      },
    });
  } catch (error) {
    console.error('Error updating club sponsor:', error);
    next(error);
  }
};

export const deleteClubSponsor = async (
  req: Request<{ id: string; sponsorId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id: clubId, sponsorId } = req.params;
    const authReq = req as unknown as AuthenticatedRequest;

    const club = await Club.findById(clubId);
    if (!club) {
      res.status(404).json({
        success: false,
        message: 'Club not found',
      });
      return;
    }

    // Check permission
    const isClubMod =
      authReq.userInfo.role === 'admin' ||
      (club.moderators &&
        club.moderators
          .map((m) => m.toString())
          .includes(authReq.userInfo._id.toString()));

    if (!isClubMod) {
      res.status(403).json({
        success: false,
        message: 'You are not authorized to delete sponsors for this club',
      });
      return;
    }

    const initialSponsorCount = club.sponsors.length;
    club.sponsors = club.sponsors.filter(
      (s) => s._id?.toString() !== sponsorId
    );

    if (club.sponsors.length === initialSponsorCount) {
      res.status(404).json({
        success: false,
        message: 'Sponsor not found',
      });
      return;
    }

    await club.save();

    res.status(200).json({
      success: true,
      message: 'Sponsor deleted successfully',
      data: {
        clubId: club._id,
        remainingSponsors: club.sponsors.length,
      },
    });
  } catch (error) {
    console.error('Error deleting club sponsor:', error);
    next(error);
  }
};
