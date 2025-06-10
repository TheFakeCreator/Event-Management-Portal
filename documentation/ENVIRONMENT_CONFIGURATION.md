# Environment Configuration Guide

## Overview

This document explains all environment variables required for the Event Management Portal application, including setup instructions for third-party services.

## Required Environment Variables

Create a `.env` file in the root directory with the following variables:

### Database Configuration

```env
MONGO_URI=mongodb://localhost:27017/event-management
# OR for MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/event-management?retryWrites=true&w=majority
```

**Required**: MongoDB connection string for your database.

### JWT & Session Security

```env
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
SESSION_SECRET=your_session_secret_key_here_also_long_and_random
```

**Required**: Use strong, random strings for production. Generate with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Email Configuration (Nodemailer)

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your_app_password_here
```

**Required**: For email verification and notifications.

#### Gmail Setup:

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password: Google Account → Security → App passwords
3. Use the generated 16-character password as `EMAIL_PASS`

#### Other Email Providers:

- **Outlook**: Use your regular password with `smtp.live.com`
- **Yahoo**: Generate app password, use `smtp.mail.yahoo.com`
- **Custom SMTP**: Configure additional SMTP settings in `configs/nodemailer.js`

### Google OAuth Configuration

```env
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

**Optional**: For Google OAuth login functionality.

#### Google OAuth Setup:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/auth/google/callback` (development)
   - `https://yourdomain.com/auth/google/callback` (production)

### Cloudinary Configuration

```env
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

**Required**: For image uploads (profile pictures, event banners, club galleries).

#### Cloudinary Setup:

1. Sign up at [Cloudinary](https://cloudinary.com/)
2. Go to Dashboard
3. Copy Cloud Name, API Key, and API Secret
4. Configure upload presets if needed

### Application Environment

```env
NODE_ENV=development
# Set to 'production' for production deployment
DEBUG=development:*
# Remove or set to empty for production
```

**Optional**: Controls development features and debug output.

## Environment-Specific Configurations

### Development Environment

```env
NODE_ENV=development
DEBUG=development:*
MONGO_URI=mongodb://localhost:27017/event-management-dev
```

### Production Environment

```env
NODE_ENV=production
# Remove DEBUG or set to empty
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/event-management-prod
```

## Validation and Testing

### Check Configuration

Create a test script to validate your environment:

```javascript
// test-env.js
import dotenv from 'dotenv';
dotenv.config();

const requiredVars = [
  'MONGO_URI',
  'JWT_SECRET',
  'SESSION_SECRET',
  'EMAIL_USER',
  'EMAIL_PASS',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
];

const missingVars = requiredVars.filter(var => !process.env[var]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(var => console.error(`  - ${var}`));
  process.exit(1);
} else {
  console.log('✅ All required environment variables are set!');
}
```

Run with: `node test-env.js`

## Security Best Practices

### 1. Environment Variable Security

- **Never commit `.env` files** to version control
- Use different values for development and production
- Generate strong, random secrets
- Rotate secrets regularly in production

### 2. Production Considerations

- Use environment variable management service (AWS Secrets Manager, Azure Key Vault)
- Set `NODE_ENV=production`
- Remove or disable debug logging
- Use HTTPS in production
- Configure secure cookie settings

### 3. Database Security

- Use MongoDB Atlas with IP whitelisting
- Create dedicated database users with minimal permissions
- Enable authentication on local MongoDB instances
- Use connection string with authentication

## Common Issues and Solutions

### Database Connection Issues

**Problem**: `MongoNetworkError` or connection timeouts
**Solutions**:

- Check MongoDB is running: `sudo systemctl status mongod`
- Verify connection string format
- Check firewall settings for MongoDB Atlas
- Ensure IP address is whitelisted in Atlas

### Email Issues

**Problem**: Email sending fails
**Solutions**:

- Verify Gmail app password is correct
- Check 2FA is enabled for Gmail
- Try different SMTP settings for other providers
- Test with a simple email script

### Cloudinary Upload Issues

**Problem**: Image uploads fail
**Solutions**:

- Verify API credentials are correct
- Check Cloudinary upload limits
- Ensure proper file types are being uploaded
- Check network connectivity

### OAuth Issues

**Problem**: Google OAuth login fails
**Solutions**:

- Verify redirect URIs match exactly
- Check client ID and secret are correct
- Ensure Google+ API is enabled
- Test with different Google account

## Environment Templates

### Local Development (.env.example)

```env
# Database
MONGO_URI=mongodb://localhost:27017/event-management

# Security
JWT_SECRET=generate_random_32_char_string
SESSION_SECRET=generate_random_32_char_string

# Email (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your_16_character_app_password

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Development
NODE_ENV=development
DEBUG=development:*
```

### Production (.env.production)

```env
# Database
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/event-management

# Security
JWT_SECRET=production_jwt_secret_32_chars_minimum
SESSION_SECRET=production_session_secret_32_chars_minimum

# Email
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASS=production_email_password

# Google OAuth
GOOGLE_CLIENT_ID=prod_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=prod_client_secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=prod_cloud_name
CLOUDINARY_API_KEY=prod_api_key
CLOUDINARY_API_SECRET=prod_api_secret

# Production
NODE_ENV=production
```

## Support

If you encounter issues with environment configuration:

1. Check the [Troubleshooting Guide](TROUBLESHOOTING.md)
2. Verify all third-party service credentials
3. Test each service independently
4. Check application logs for specific error messages

---

**Next Steps**: After configuring your environment, see [DEVELOPER_SETUP.md](DEVELOPER_SETUP.md) for installation and running instructions.
