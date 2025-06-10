# Authentication & Security Documentation

## Overview

This document provides detailed information about the authentication system, security measures, and best practices implemented in the Event Management Portal application.

## Authentication Flow

### 1. Traditional Email/Password Authentication

#### Registration Process

1. User submits registration form with email, username, and password
2. Server validates input and checks for existing users
3. Password is hashed using bcrypt (12 rounds)
4. Email verification token is generated
5. User account created with `emailVerified: false`
6. Verification email sent to user
7. User clicks verification link to activate account

#### Login Process

1. User submits login credentials
2. Server validates email/username and password
3. Password verified against bcrypt hash
4. JWT token generated with user payload
5. Token stored in HTTP-only cookie
6. User redirected to intended destination

#### Email Verification

- Verification tokens expire after 24 hours
- Tokens are cryptographically secure (crypto.randomBytes)
- Verified users have `emailVerified: true` in database
- Unverified users can still login but may have limited access

### 2. Google OAuth Authentication

#### OAuth Flow

1. User clicks "Login with Google"
2. Redirected to Google OAuth consent screen
3. User grants permissions
4. Google redirects back with authorization code
5. Server exchanges code for access token and user profile
6. User account created/updated with Google profile data
7. JWT token generated and stored in cookie
8. User redirected to application

#### OAuth Configuration

```javascript
// Passport Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      // User profile processing logic
    }
  )
);
```

### 3. Password Reset Flow

#### Reset Process

1. User requests password reset with email
2. Server generates secure reset token
3. Reset token stored in database with expiration
4. Password reset email sent with token link
5. User clicks link and submits new password
6. Token validated and password updated
7. Reset token removed from database

## Security Measures

### 1. Password Security

#### Hashing

- Uses bcrypt with salt rounds of 12
- Passwords never stored in plain text
- Secure comparison using bcrypt.compare()

```javascript
// Password hashing
const saltRounds = 12;
const hashedPassword = await bcrypt.hash(password, saltRounds);

// Password verification
const isValid = await bcrypt.compare(password, user.password);
```

#### Password Requirements

- Minimum 8 characters
- Must contain at least one uppercase letter
- Must contain at least one lowercase letter
- Must contain at least one number
- Must contain at least one special character

### 2. JWT Token Security

#### Token Configuration

- Signed with HS256 algorithm
- Expires in 7 days by default
- Stored in HTTP-only cookies
- Includes user ID and role information

```javascript
// JWT token generation
const token = jwt.sign(
  { userId: user._id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: "7d" }
);

// Cookie options
res.cookie("token", token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});
```

#### Token Validation

- Middleware validates token on protected routes
- Invalid/expired tokens result in authentication failure
- Token payload used for user identification and authorization

### 3. Session Management

#### Cookie Security

- HTTP-only cookies prevent XSS attacks
- Secure flag enabled in production (HTTPS only)
- SameSite attribute prevents CSRF attacks
- Appropriate expiration times

#### Session Validation

- Every request validates JWT token
- User existence verified in database
- Role-based access control enforced
- Automatic logout on token expiration

### 4. Input Validation & Sanitization

#### Server-side Validation

- All user inputs validated before processing
- Email format validation
- Username uniqueness checks
- Password strength requirements
- XSS prevention through proper escaping

#### Database Security

- MongoDB injection prevention
- Parameterized queries
- Input sanitization
- Schema validation using Mongoose

### 5. Rate Limiting & Protection

#### Brute Force Protection

- Login attempt rate limiting
- Account lockout after failed attempts
- Progressive delays on repeated failures
- IP-based rate limiting

#### General Rate Limiting

- API endpoint rate limiting
- Per-user request limits
- DDoS protection measures
- Resource usage monitoring

## Authorization Levels

### 1. Permission Hierarchy

```
Public (No authentication required)
└── Authenticated (Valid JWT token)
    ├── Regular User (Default role)
    ├── Moderator (Elevated permissions)
    │   └── Club Moderator (Club-specific permissions)
    └── Admin (Full system access)
```

### 2. Role-Based Access Control (RBAC)

#### User Roles

- **Regular User**: Basic authenticated access
- **Moderator**: Can create/manage events
- **Club Moderator**: Can manage specific clubs
- **Admin**: Full system administration

#### Permission Middleware

```javascript
// Authentication check
const isAuthenticated = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.redirect("/auth/login");
  // Token validation logic
};

// Admin authorization
const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).render("error", {
      message: "Access denied",
    });
  }
  next();
};

// Club moderator authorization
const isClubModerator = async (req, res, next) => {
  const clubId = req.params.id;
  const userId = req.user.id;

  if (req.user.role === "admin") return next();

  const club = await Club.findById(clubId);
  if (!club.moderators.includes(userId)) {
    return res.status(403).render("error", {
      message: "Access denied",
    });
  }
  next();
};
```

## Security Best Practices

### 1. Environment Variables

#### Required Security Variables

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-min-256-bits

# Database Security
MONGODB_URI=mongodb://localhost:27017/eventmanagement
DB_ENCRYPTION_KEY=your-database-encryption-key

# OAuth Security
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email Security
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password

# Session Security
SESSION_SECRET=your-session-secret-key
```

### 2. Production Security Checklist

#### Server Security

- [ ] HTTPS enabled with valid SSL certificate
- [ ] Security headers configured (CORS, CSP, etc.)
- [ ] Rate limiting implemented
- [ ] Input validation on all endpoints
- [ ] Error handling that doesn't leak sensitive info
- [ ] Regular security updates and patches

#### Database Security

- [ ] MongoDB authentication enabled
- [ ] Database connection encrypted
- [ ] Regular backups with encryption
- [ ] Access control and user permissions
- [ ] Network security (firewall, VPN)

#### Application Security

- [ ] JWT secret is cryptographically secure
- [ ] Environment variables properly configured
- [ ] File upload validation and limits
- [ ] CSRF protection enabled
- [ ] XSS prevention measures

### 3. Security Monitoring

#### Logging

- Authentication attempts (success/failure)
- Authorization failures
- Suspicious activity patterns
- System errors and exceptions
- Admin actions and changes

#### Alerts

- Multiple failed login attempts
- Unusual access patterns
- System errors and downtime
- Security policy violations
- Database connection issues

## Troubleshooting

### Common Authentication Issues

#### JWT Token Problems

```javascript
// Token validation error
Error: JsonWebTokenError: invalid signature
// Solution: Check JWT_SECRET environment variable

// Token expiration
Error: TokenExpiredError: jwt expired
// Solution: User needs to login again

// Missing token
Error: No token provided
// Solution: Check cookie configuration and HTTPS settings
```

#### OAuth Issues

```javascript
// Google OAuth error
Error: OAuth2Strategy requires a clientID option
// Solution: Set GOOGLE_CLIENT_ID environment variable

// Callback URL mismatch
Error: redirect_uri_mismatch
// Solution: Update callback URL in Google Console
```

#### Database Connection

```javascript
// MongoDB connection error
Error: MongoServerError: Authentication failed
// Solution: Check MongoDB credentials and connection string

// User not found
Error: User not found in database
// Solution: Verify user existence and database connection
```

### Security Incident Response

#### Suspected Breach

1. Immediately invalidate all JWT tokens
2. Force password reset for all users
3. Review access logs for suspicious activity
4. Update JWT secret and restart application
5. Notify users of security incident

#### Account Compromise

1. Disable affected user account
2. Reset password and invalidate sessions
3. Review account activity logs
4. Check for unauthorized changes
5. Re-enable account after verification

## API Security

### Endpoint Protection

#### Authentication Required

- All `/user/*` routes
- All `/event/*` routes (except public listing)
- All `/club/*` routes (except public listing)
- All `/recruitment/*` routes (except public listing)

#### Admin Only

- All `/admin/*` routes
- User role management
- System configuration
- Data export/import

#### Rate Limited Endpoints

- `/auth/login` - Maximum 5 attempts per 15 minutes
- `/auth/signup` - Maximum 3 attempts per hour
- `/auth/forgot-password` - Maximum 3 attempts per hour
- File upload endpoints - Maximum 10 uploads per minute

### CORS Configuration

```javascript
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(",") || "http://localhost:3000",
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
```

## Compliance & Standards

### Data Protection

- User data encrypted at rest and in transit
- GDPR compliance for EU users
- Data retention policies implemented
- User consent management
- Right to data deletion

### Security Standards

- OWASP Top 10 protection measures
- Regular security audits and penetration testing
- Secure coding practices
- Dependency vulnerability scanning
- Security headers implementation

---

## Related Documentation

- [Environment Configuration](ENVIRONMENT_CONFIGURATION.md)
- [Route Permissions](ROUTE_PERMISSIONS.md)
- [Deployment Guide](DEPLOYMENT_GUIDE.md)
- [User Guide](USER_GUIDE.md)
