import nodemailer, { Transporter, SendMailOptions } from 'nodemailer';

interface EmailConfig {
  user: string;
  pass: string;
}

interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

/**
 * Validates email configuration environment variables
 */
const validateEmailConfig = (): EmailConfig => {
  const config = {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  };

  if (!config.user || !config.pass) {
    throw new Error(
      'Missing required email environment variables. Please ensure EMAIL_USER and EMAIL_PASS are set.'
    );
  }

  return config as EmailConfig;
};

// Validate configuration
const config = validateEmailConfig();

// Create transporter
const transporter: Transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: config.user,
    pass: config.pass,
  },
  // Additional security and reliability options
  pool: true, // Use connection pool
  maxConnections: 5, // Limit concurrent connections
  maxMessages: 100, // Limit messages per connection
  rateLimit: 14, // Limit messages per second
});

/**
 * Email utility functions
 */
export const emailUtils = {
  /**
   * Send an email
   */
  sendMail: async (options: EmailOptions): Promise<any> => {
    try {
      const mailOptions: SendMailOptions = {
        from: options.from || config.user,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return result;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  },

  /**
   * Verify transporter configuration
   */
  verifyConnection: async (): Promise<boolean> => {
    try {
      await transporter.verify();
      console.log('Email transporter verified successfully');
      return true;
    } catch (error) {
      console.error('Email transporter verification failed:', error);
      return false;
    }
  },

  /**
   * Send verification email
   */
  sendVerificationEmail: async (
    to: string,
    username: string,
    verificationToken: string
  ): Promise<any> => {
    const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;

    const html = `
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
                <h2 style="color: #333; text-align: center;">Email Verification</h2>
                <p>Hello ${username},</p>
                <p>Thank you for registering with Event Management Portal. Please click the button below to verify your email address:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationUrl}" 
                       style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                        Verify Email
                    </a>
                </div>
                <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
                <p style="color: #666; font-size: 14px; margin-top: 30px;">
                    This verification link will expire in 24 hours. If you didn't create an account, please ignore this email.
                </p>
            </div>
        `;

    return emailUtils.sendMail({
      to,
      subject: 'Verify Your Email - Event Management Portal',
      html,
    });
  },

  /**
   * Send password reset email
   */
  sendPasswordResetEmail: async (
    to: string,
    username: string,
    resetToken: string
  ): Promise<any> => {
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    const html = `
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
                <h2 style="color: #333; text-align: center;">Password Reset</h2>
                <p>Hello ${username},</p>
                <p>You requested a password reset for your Event Management Portal account. Click the button below to reset your password:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" 
                       style="background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                        Reset Password
                    </a>
                </div>
                <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #666;">${resetUrl}</p>
                <p style="color: #666; font-size: 14px; margin-top: 30px;">
                    This reset link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
                </p>
            </div>
        `;

    return emailUtils.sendMail({
      to,
      subject: 'Reset Your Password - Event Management Portal',
      html,
    });
  },
};

export default transporter;
