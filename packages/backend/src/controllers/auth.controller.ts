import { Request, Response, NextFunction } from 'express';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import User from '../models/user.model.js';
import {
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  AuthResponse,
  TokenPayload,
  buildUrl,
} from '@event-management/shared';
import { AuthenticatedRequest } from '../types/express.js';

// Import utilities (these will need to be converted too)
import transporter from '../configs/nodemailer.js';
import {
  generateAccessToken,
  generateVerificationToken,
  verifyToken,
  blacklistToken,
  getSecureCookieOptions,
  getClearCookieOptions,
} from '../utils/jwtManager.js';
import {
  logSecurityEvent,
  SECURITY_EVENTS,
  trackFailedLogin,
  clearFailedAttempts,
} from '../utils/securityLogger.js';
import {
  validatePasswordStrength,
  hashPassword,
  comparePassword,
} from '../utils/passwordSecurity.js';

// Type for requests with flash but no authentication
interface FlashRequest extends Request {
  flash: (type: string, message?: string) => string[];
}

// Standardized API response format
interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

// These SSR functions will be removed in full API migration - keeping for backward compatibility
export const getLoginUser = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    if (req.isUserAuthenticated) {
      res.redirect(`/user/${req.userInfo?.username}`);
      return;
    }

    // Get the redirect URL from query parameters
    const redirectUrl = (req.query.redirect as string) || '';

    res.render('login', {
      success: req.flash?.('success') || [],
      error: req.flash?.('error') || [],
      redirectUrl, // Pass redirect URL to the login form
    });
  } catch (err) {
    next(err);
  }
};

export const getRegisterUser = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void | Response => {
  try {
    if (req.isUserAuthenticated) {
      const response: ApiResponse = {
        success: false,
        message: 'User already authenticated',
      };
      return res.status(400).json(response);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Register endpoint ready',
    };
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

export const getForgotPass = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void | Response => {
  try {
    if (req.isUserAuthenticated) {
      const response: ApiResponse = {
        success: false,
        message: 'User already authenticated',
      };
      return res.status(400).json(response);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Forgot password endpoint ready',
    };
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

export const getResetPass = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void | Response => {
  try {
    if (req.isUserAuthenticated) {
      const response: ApiResponse = {
        success: false,
        message: 'User already authenticated',
      };
      return res.status(400).json(response);
    }

    const response: ApiResponse<{ token: string }> = {
      success: true,
      message: 'Reset password endpoint ready',
      data: { token: req.params.token },
    };
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

export const registerUser = async (
  req: Request<{}, {}, RegisterRequest>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, username, email, password, confirmPassword } = req.body;

    // Check if passwords match
    if (password !== confirmPassword) {
      const response: ApiResponse = {
        success: false,
        message: 'Passwords do not match',
      };
      res.status(400).json(response);
      return;
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      const response: ApiResponse = {
        success: false,
        message: 'Password does not meet security requirements',
        errors: {
          password: passwordValidation.errors.map((err) => err.message),
        },
      };
      res.status(400).json(response);
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const response: ApiResponse = {
        success: false,
        message: 'User already exists with this email',
      };
      res.status(400).json(response);
      return;
    }

    // Hash the password using secure method
    const hashedPassword = await hashPassword(password);

    // Create a new user but don't activate it yet
    const newUser = await User.create({
      name,
      username,
      email,
      password: hashedPassword,
      isVerified: false, // User is not verified yet
      lastPasswordChange: new Date(),
    });

    // Generate a verification token with enhanced security
    const token = generateVerificationToken(newUser);

    // Create a verification link using configured client URL
    // prefer validated env variable from env.config
    import('../configs/env.config.js')
      .then(({ env: appEnv }) => {
        /* noop import to ensure types and env are available for runtime; actual value used below synchronously */
      })
      .catch(() => {});

    const clientUrl =
      (process.env.CLIENT_URL as string) || 'http://localhost:3000';
    const verificationUrl = buildUrl({
      base: clientUrl,
      path: `auth/verify/${token}`,
    });

    // Send the verification email. Failures here should not break user registration
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Verify your Email',
        html: `
                <h4>Hello ${name},</h4>
                <p>Thank you for registering. Please verify your email by clicking the link below:</p>
                <a href="${verificationUrl}" target="_blank">Verify Email</a>
            `,
      });
    } catch (emailError) {
      // Log the error and continue — user is created, but verification email couldn't be sent
      console.error(
        'Failed to send verification email for user',
        email,
        emailError
      );
      logSecurityEvent(
        SECURITY_EVENTS.ACCOUNT_CREATED,
        {
          email,
          username,
          userId: newUser._id.toString(),
          emailError: (emailError as Error).message,
        },
        req
      );
    }

    // Log security event
    logSecurityEvent(
      SECURITY_EVENTS.ACCOUNT_CREATED,
      {
        email,
        username,
        userId: newUser._id.toString(),
      },
      req
    );

    const response: ApiResponse = {
      success: true,
      message:
        'Registration successful! Please check your email to verify your account.',
      data: {
        user: {
          id: newUser._id,
          name: newUser.name,
          username: newUser.username,
          email: newUser.email,
          isVerified: newUser.isVerified,
        },
      },
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (
  req: Request<{}, {}, LoginRequest>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      // Log failed login attempt
      logSecurityEvent(
        SECURITY_EVENTS.LOGIN_FAILED,
        {
          email,
          reason: 'User not found',
        },
        req
      );

      trackFailedLogin(req.ip || 'unknown');

      const response: ApiResponse = {
        success: false,
        message: 'Invalid credentials',
      };
      res.status(401).json(response);
      return;
    }

    // Check if account is locked
    if (user.isLocked) {
      // Log account lockout attempt
      logSecurityEvent(
        SECURITY_EVENTS.LOGIN_FAILED,
        {
          email,
          userId: user._id.toString(),
          reason: 'Account locked',
          lockUntil: user.accountLockUntil,
        },
        req
      );

      const response: ApiResponse = {
        success: false,
        message:
          'Account temporarily locked due to too many failed login attempts. Please try again later.',
      };
      res.status(423).json(response);
      return;
    }

    // Use secure password comparison
    const isMatch = await comparePassword(password, user.password || '', req);
    if (!isMatch) {
      // Increment failed login attempts
      await user.incFailedAttempts();

      // Log failed login attempt
      logSecurityEvent(
        SECURITY_EVENTS.LOGIN_FAILED,
        {
          email,
          userId: user._id.toString(),
          reason: 'Invalid password',
          attemptCount: user.failedLoginAttempts + 1,
        },
        req
      );

      trackFailedLogin(req.ip || 'unknown');

      const response: ApiResponse = {
        success: false,
        message: 'Invalid credentials',
      };
      res.status(401).json(response);
      return;
    }

    if (!user.isVerified) {
      // Log failed login attempt
      logSecurityEvent(
        SECURITY_EVENTS.LOGIN_FAILED,
        {
          email,
          userId: user._id.toString(),
          reason: 'Email not verified',
        },
        req
      );

      const response: ApiResponse = {
        success: false,
        message:
          'Email not verified. Please check your email and verify your account.',
      };
      res.status(401).json(response);
      return;
    }

    // Reset failed login attempts on successful login
    if (user.failedLoginAttempts > 0) {
      await user.resetFailedAttempts();
    }

    // Clear failed attempts on successful login
    clearFailedAttempts(req.ip || 'unknown');

    // Update last login time
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token with enhanced security
    const token = generateAccessToken(user);

    // Set secure cookie with enhanced security options
    res.cookie('token', token, getSecureCookieOptions());

    // Log successful login
    logSecurityEvent(
      SECURITY_EVENTS.LOGIN_SUCCESS,
      {
        email,
        userId: user._id.toString(),
        username: user.username,
      },
      req
    );

    const response: ApiResponse = {
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          avatar: user.avatar,
        },
        token,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const logoutUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies.token;

    if (token) {
      // Blacklist the token to prevent reuse
      await blacklistToken(token);
    }

    // Clear the cookie
    res.clearCookie('token', getClearCookieOptions());

    // Log successful logout
    if (req.userInfo) {
      logSecurityEvent(
        SECURITY_EVENTS.LOGOUT_SUCCESS,
        {
          userId: req.userInfo._id,
          username: req.userInfo.username,
        },
        req
      );
    }

    const response: ApiResponse = {
      success: true,
      message: 'Logged out successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const verifyUser = async (
  req: Request<{ token: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token } = req.params;

    try {
      // Verify the token
      const decoded = verifyToken(token, 'verification') as TokenPayload;

      // Find the user and verify them
      const user = await User.findById(decoded.userId);
      if (!user) {
        const response: ApiResponse = {
          success: false,
          message: 'Invalid verification token',
        };
        res.status(400).json(response);
        return;
      }

      if (user.isVerified) {
        const response: ApiResponse = {
          success: true,
          message: 'Email already verified. You can login now.',
        };
        res.status(200).json(response);
        return;
      }

      // Mark user as verified
      user.isVerified = true;
      await user.save();

      // Log successful verification
      logSecurityEvent(
        SECURITY_EVENTS.EMAIL_VERIFIED,
        {
          userId: user._id.toString(),
          email: user.email,
        },
        req
      );

      const response: ApiResponse = {
        success: true,
        message: 'Email verified successfully. You can login now.',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            isVerified: user.isVerified,
          },
        },
      };

      res.status(200).json(response);
    } catch (tokenError) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid or expired verification token',
      };
      res.status(400).json(response);
    }
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (
  req: Request<{}, {}, ForgotPasswordRequest>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal whether the email exists or not for security
      const response: ApiResponse = {
        success: true,
        message: 'If the email exists, a password reset link has been sent.',
      };
      res.status(200).json(response);
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set reset token and expiry
    user.resetToken = hashedResetToken;
    user.expireToken = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    // Create reset URL
    const resetBase =
      (process.env.CLIENT_URL as string) ||
      'https://event-management-portal.onrender.com';
    const resetUrl = buildUrl({
      base: resetBase,
      path: `auth/reset-password/${resetToken}`,
    });

    // Send reset email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Request',
      html: `
                <h4>Hello ${user.name},</h4>
                <p>You requested a password reset. Click the link below to reset your password:</p>
                <a href="${resetUrl}" target="_blank">Reset Password</a>
                <p>This link will expire in 10 minutes.</p>
                <p>If you didn't request this, please ignore this email.</p>
            `,
    });

    // Log security event
    logSecurityEvent(
      SECURITY_EVENTS.PASSWORD_RESET_REQUESTED,
      {
        userId: user._id.toString(),
        email: user.email,
      },
      req
    );

    const response: ApiResponse = {
      success: true,
      message: 'If the email exists, a password reset link has been sent.',
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (
  req: Request<{ token: string }, {}, ResetPasswordRequest>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    // Check if passwords match
    if (password !== confirmPassword) {
      const response: ApiResponse = {
        success: false,
        message: 'Passwords do not match',
      };
      res.status(400).json(response);
      return;
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      const response: ApiResponse = {
        success: false,
        message: 'Password does not meet security requirements',
        errors: {
          password: passwordValidation.errors.map((err) => err.message),
        },
      };
      res.status(400).json(response);
      return;
    }

    // Hash the token and find user
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetToken: hashedToken,
      expireToken: { $gt: new Date() },
    });

    if (!user) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid or expired reset token',
      };
      res.status(400).json(response);
      return;
    }

    // Hash new password
    const hashedPassword = await hashPassword(password);

    // Update user password and clear reset fields
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.expireToken = undefined;
    user.lastPasswordChange = new Date();
    // Clear any account locks since password was reset
    user.failedLoginAttempts = 0;
    user.accountLockUntil = undefined;
    await user.save();

    // Log security event
    logSecurityEvent(
      SECURITY_EVENTS.PASSWORD_RESET_SUCCESS,
      {
        userId: user._id.toString(),
        email: user.email,
      },
      req
    );

    const response: ApiResponse = {
      success: true,
      message: 'Password reset successfully. You can login now.',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
        },
      },
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
