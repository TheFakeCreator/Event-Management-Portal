import { Request, Response, NextFunction } from 'express';
import { User } from '@event-management/shared';
import Recruitment from '../models/recruitment.model.js';
import Registration from '../models/registration.model.js';
import Club from '../models/club.model.js';
import { AuthenticatedRequest } from '../types/express.js';

// Request interfaces for recruitment operations
interface RecruitmentCreateRequest {
  title: string;
  description: string;
  deadline: string;
  clubId: string;
  applicationForm?: string; // JSON string of FormField[]
}

interface RecruitmentApplicationRequest {
  name: string;
  email: string;
  [key: string]: any; // For custom form fields
}

// Standardized API response format
interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Form field interface
interface FormField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export const getRecruitments = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;

    // Fetch all recruitments and populate club
    const recruitments = await Recruitment.find({})
      .populate('club')
      .sort({ deadline: 1 });

    // For each recruitment, count total applicants
    const recruitmentsWithCounts = await Promise.all(
      recruitments.map(async (rec) => {
        const totalApplicants = await Registration.countDocuments({
          recruitment: rec._id,
        });
        return { ...rec.toObject(), totalApplicants };
      })
    );

    // Filter out expired recruitments (deadline + 1 day < now)
    const now = new Date();
    const recruitmentsFiltered = recruitmentsWithCounts.filter((rec) => {
      const deadline = new Date(rec.deadline);
      // Add 1 day (in ms)
      return now <= new Date(deadline.getTime() + 24 * 60 * 60 * 1000);
    });

    const response: ApiResponse<any[]> = {
      success: true,
      message: 'Recruitments retrieved successfully',
      data: recruitmentsFiltered,
    };

    res.status(200).json(response);
  } catch (err) {
    console.error(err);
    next(err);
  }
};

export const getNewRecruitments = async (
  req: Request<{}, {}, {}, { club?: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = (req as unknown as AuthenticatedRequest).user;
    const clubId = req.query.club;

    const response: ApiResponse<{ clubId?: string }> = {
      success: true,
      message: 'Create recruitment form data retrieved',
      data: { clubId },
    };

    res.status(200).json(response);
  } catch (err) {
    console.error(err);
    next(err);
  }
};

export const postNewRecruitment = async (
  req: Request<{}, {}, RecruitmentCreateRequest>,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const user = (req as unknown as AuthenticatedRequest).user;
    const { title, description, deadline, clubId, applicationForm } = req.body;

    if (!title || !description || !deadline || !clubId) {
      const response: ApiResponse = {
        success: false,
        message: 'Title, description, deadline, and club are required',
      };
      return res.status(400).json(response);
    }

    // Parse applicationForm JSON if present
    let formFields: FormField[] = [];
    if (applicationForm) {
      try {
        formFields = JSON.parse(applicationForm);
      } catch (e) {
        formFields = [];
      }
    }

    // Create the recruitment
    const newRecruitment = await Recruitment.create({
      title,
      description,
      deadline: new Date(deadline),
      club: clubId,
      applicationForm: formFields,
    });

    // Push the recruitment's _id into the club's recruitments array
    await Club.findByIdAndUpdate(
      clubId,
      { $push: { recruitments: newRecruitment._id } },
      { new: true }
    );

    // Populate the created recruitment for response
    const populatedRecruitment = await Recruitment.findById(
      newRecruitment._id
    ).populate('club', 'name');

    const response: ApiResponse<any> = {
      success: true,
      message: 'Recruitment created successfully',
      data: populatedRecruitment,
    };

    res.status(201).json(response);
  } catch (err) {
    console.error(err);
    next(err);
  }
};

export const postApplyRecruitment = async (
  req: Request<{ id: string }, {}, RecruitmentApplicationRequest>,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const recruitmentId = req.params.id;
    const { name, email, ...customData } = req.body;

    if (!name || !email) {
      const response: ApiResponse = {
        success: false,
        message: 'Name and email are required',
      };
      return res.status(400).json(response);
    }

    const recruitment =
      await Recruitment.findById(recruitmentId).populate('club');

    if (!recruitment) {
      const response: ApiResponse = {
        success: false,
        message: 'Recruitment not found',
      };
      return res.status(404).json(response);
    }

    // Check deadline
    const now = new Date();
    if (now > recruitment.deadline) {
      const response: ApiResponse = {
        success: false,
        message: 'Application deadline has passed',
      };
      return res.status(400).json(response);
    }

    // Check if user already applied
    const existingApplication = await Registration.findOne({
      recruitment: recruitmentId,
      email: email.trim().toLowerCase(),
    });

    if (existingApplication) {
      const response: ApiResponse = {
        success: false,
        message: 'You have already applied for this recruitment',
      };
      return res.status(400).json(response);
    }

    // Process custom fields
    const customFields: Record<string, any> = {};
    if (recruitment.applicationForm && recruitment.applicationForm.length > 0) {
      recruitment.applicationForm.forEach((field: any) => {
        const key = `custom_${field.label.replace(/\s+/g, '_').toLowerCase()}`;
        customFields[field.label] = customData[key] || '';
      });
    }

    // Save registration
    const newRegistration = await Registration.create({
      recruitment: recruitmentId,
      name,
      email: email.trim().toLowerCase(),
      customFields,
    });

    const response: ApiResponse<any> = {
      success: true,
      message: 'Application submitted successfully',
      data: newRegistration,
    };

    res.status(201).json(response);
  } catch (err) {
    console.error('Recruitment application error:', err);
    next(err);
  }
};

export const getRecruitmentDetails = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const recruitment = await Recruitment.findById(req.params.id).populate(
      'club'
    );

    if (!recruitment) {
      const response: ApiResponse = {
        success: false,
        message: 'Recruitment not found',
      };
      return res.status(404).json(response);
    }

    // Get total applicants count
    const totalApplicants = await Registration.countDocuments({
      recruitment: req.params.id,
    });

    const recruitmentWithCounts = {
      ...recruitment.toObject(),
      totalApplicants,
    };

    const response: ApiResponse<any> = {
      success: true,
      message: 'Recruitment details retrieved successfully',
      data: recruitmentWithCounts,
    };

    res.status(200).json(response);
  } catch (err) {
    console.error(err);
    next(err);
  }
};
