import { Request, Response, NextFunction } from 'express';
import User from '../models/user.model.js';
import Club from '../models/club.model.js';
import { comparePassword } from '../utils/passwordSecurity.js';
import { AuthenticatedRequest } from '../types/express.js';
// import cloudinary from '../configs/cloudinary.js'; // TODO: Convert cloudinary config

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

interface UserEditRequest {
  name: string;
  bio: string;
  phone: string;
  gender: string;
  socials: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    instagram?: string;
    website?: string;
  };
}

interface RoleRequestBody {
  role: string;
}

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface FileUploadRequest extends Request {
  file?: Express.Multer.File;
  files?: Express.Multer.File[];
}

// getUserProfile - Get current user's profile data
export const getUserProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findById(req.userInfo?._id)
      .populate('clubs', 'name slug')
      .populate('moderatorClubs', 'name slug')
      .populate('createdEvents', 'title slug startDate')
      .populate('participatedEvents', 'title slug startDate');

    if (!user) {
      const response: ApiResponse = {
        success: false,
        message: 'User not found',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse = {
      success: true,
      message: 'User profile retrieved successfully',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          bio: user.bio,
          phone: user.phone,
          gender: user.gender,
          socials: user.socials,
          role: user.role,
          isVerified: user.isVerified,
          clubs: user.clubs,
          moderatorClubs: user.moderatorClubs,
          createdEvents: user.createdEvents,
          participatedEvents: user.participatedEvents,
          roleRequest: user.roleRequest,
          createdAt: user.createdAt,
        },
      },
    };

    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (
  req: FileUploadRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authReq = req as AuthenticatedRequest & FileUploadRequest;
    const { name, bio, phone, gender, socials } = req.body;

    const user = await User.findById(authReq.userInfo?._id);
    if (!user) {
      const response: ApiResponse = {
        success: false,
        message: 'User not found',
      };
      return res.status(404).json(response);
    }

    // Handle avatar upload if file is present
    const avatarUrl = user.avatar;
    if (authReq.file) {
      try {
        // TODO: Implement cloudinary upload
        // const result = await cloudinary.uploader.upload(req.file.path, {
        //     folder: 'user_avatars',
        //     use_filename: true,
        //     unique_filename: false,
        // });

        // Delete old avatar from cloudinary if it exists
        // if (user.avatar && user.avatar.includes('cloudinary.com')) {
        //     const oldPublicId = extractPublicId(user.avatar);
        //     if (oldPublicId) {
        //         await cloudinary.uploader.destroy(oldPublicId);
        //     }
        // }

        // avatarUrl = result.secure_url;
        console.log('Avatar upload would be processed here');
      } catch (uploadError) {
        console.error('Avatar upload error:', uploadError);
        const response: ApiResponse = {
          success: false,
          message: 'Error uploading avatar. Please try again.',
        };
        return res.status(400).json(response);
      }
    }

    // Update user data
    user.name = name || user.name;
    user.bio = bio || user.bio;
    user.phone = phone || user.phone;
    user.gender = (gender as any) || user.gender;
    user.avatar = avatarUrl;
    user.socials = {
      ...user.socials,
      ...socials,
    };

    await user.save();

    const response: ApiResponse = {
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          bio: user.bio,
          phone: user.phone,
          gender: user.gender,
          socials: user.socials,
          role: user.role,
          isVerified: user.isVerified,
        },
      },
    };

    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

export const requestRole = async (
  req: Request<{}, any, RoleRequestBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { role } = req.body;

    if (!role || !['organizer', 'moderator'].includes(role)) {
      const response: ApiResponse = {
        success: false,
        message:
          'Invalid role request. Role must be either "organizer" or "moderator".',
      };
      return res.status(400).json(response);
    }

    const user = await User.findById(authReq.userInfo?._id);
    if (!user) {
      const response: ApiResponse = {
        success: false,
        message: 'User not found',
      };
      return res.status(404).json(response);
    }

    if (user.roleRequest) {
      const response: ApiResponse = {
        success: false,
        message:
          'You already have a pending role request. Please wait for admin approval.',
      };
      return res.status(400).json(response);
    }

    user.roleRequest = role as any;
    await user.save();

    const response: ApiResponse = {
      success: true,
      message: `Role request for ${role} submitted successfully. Please wait for admin approval.`,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          name: user.name,
          role: user.role,
          roleRequest: user.roleRequest,
        },
      },
    };

    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
};

// Change user password
export const changePassword = async (
  req: Request<{}, any, ChangePasswordRequest>,
  res: Response,
  next: NextFunction
) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      const response: ApiResponse = {
        success: false,
        message: 'All password fields are required',
      };
      return res.status(400).json(response);
    }

    if (newPassword !== confirmPassword) {
      const response: ApiResponse = {
        success: false,
        message: 'New password and confirmation do not match',
      };
      return res.status(400).json(response);
    }

    const user = await User.findById(authReq.userInfo?._id).select('+password');
    if (!user) {
      const response: ApiResponse = {
        success: false,
        message: 'User not found',
      };
      return res.status(404).json(response);
    }

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(
      currentPassword,
      user.password!,
      req
    );
    if (!isCurrentPasswordValid) {
      const response: ApiResponse = {
        success: false,
        message: 'Current password is incorrect',
      };
      return res.status(400).json(response);
    }

    // TODO: Add password strength validation
    // const passwordValidation = validatePasswordStrength(newPassword);
    // if (!passwordValidation.isValid) {
    //     const response: ApiResponse = {
    //         success: false,
    //         message: 'Password does not meet security requirements',
    //         errors: { password: passwordValidation.errors }
    //     };
    //     return res.status(400).json(response);
    // }

    // Update password
    user.password = newPassword; // This will be hashed by the pre-save middleware
    user.lastPasswordChange = new Date();
    await user.save();

    const response: ApiResponse = {
      success: true,
      message: 'Password changed successfully',
    };

    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};
