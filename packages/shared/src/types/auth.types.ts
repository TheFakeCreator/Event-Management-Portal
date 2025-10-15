// Authentication related types and interfaces

export interface LoginRequest {
  email: string;
  password: string;
  redirectUrl?: string;
}

export interface RegisterRequest {
  name: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    name: string;
    username: string;
    email: string;
    role: string;
    isVerified: boolean;
  };
  redirectUrl?: string;
}

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface JWTSecrets {
  accessTokenSecret: string;
  refreshTokenSecret: string;
  verificationTokenSecret: string;
  resetTokenSecret: string;
}

export interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  maxAge: number;
  path: string;
}

export interface SecurityEvent {
  type: string;
  data: Record<string, any>;
  ip: string;
  userAgent: string;
  timestamp: Date;
}
