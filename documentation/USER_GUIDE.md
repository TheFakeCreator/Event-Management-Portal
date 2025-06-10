# User Guide - Event Management Portal

## Table of Contents

1. [Getting Started](#getting-started)
2. [User Roles](#user-roles)
3. [Authentication](#authentication)
4. [User Dashboard](#user-dashboard)
5. [Events](#events)
6. [Clubs](#clubs)
7. [Recruitments](#recruitments)
8. [Admin Functions](#admin-functions)
9. [Moderator Functions](#moderator-functions)
10. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Accessing the Portal

1. Navigate to the application URL (e.g., `http://localhost:3000`)
2. You'll see the landing page with EventX branding
3. Click "Login" or "Sign Up" to get started

### First-Time Setup

1. **Create an Account**: Use the signup form or Google OAuth
2. **Verify Email**: Check your email for verification link
3. **Complete Profile**: Add profile information and avatar
4. **Explore Features**: Browse events, clubs, and available recruitments

---

## User Roles

The system has four distinct user roles with different permissions:

### 👤 Regular User

- View events and club information
- Register for events
- Apply to recruitments
- Manage personal profile
- Request role upgrades

### 🛡️ Moderator

- All user permissions
- Create and manage events
- Create and manage recruitments
- Access to moderator tools

### 👑 Club Moderator

- All user permissions
- Manage specific club(s) they're assigned to
- Create club events and recruitments
- Manage club gallery and information
- View recruitment applications

### 🔧 Admin

- All permissions in the system
- User management
- Club creation and management
- System-wide event management
- Access to admin dashboard and logs
- Role assignment and approval

---

## Authentication

### Sign Up

1. **Using Email**:

   - Click "Sign Up" on the homepage
   - Fill in: Name, Username, Email, Password
   - Submit the form
   - Check email for verification link
   - Click verification link to activate account

2. **Using Google OAuth**:
   - Click "Continue with Google"
   - Select your Google account
   - Grant required permissions
   - Account is automatically verified

### Login

1. **Email/Password**:

   - Enter email and password
   - Click "Login"
   - Redirected to dashboard or requested page

2. **Google OAuth**:
   - Click "Continue with Google"
   - Select account if multiple available

### Password Reset

1. Click "Forgot Password?" on login page
2. Enter your email address
3. Check email for reset link
4. Click link and enter new password
5. Confirm password change

---

## User Dashboard

### Profile Overview

Your dashboard displays:

- Profile picture and basic information
- Current role and status
- Social media links
- Quick access to profile editing

### Profile Management

1. **Edit Profile**:

   - Click username → "Edit Profile"
   - Update personal information
   - Upload new profile picture
   - Add social media links
   - Save changes

2. **Account Settings**:
   - Change password
   - Update email preferences
   - Delete account (if enabled)

### Role Requests

To request a role upgrade:

1. Go to your profile
2. Click "Request Role"
3. Select desired role (Moderator)
4. Provide justification
5. Wait for admin approval

---

## Events

### Browsing Events

1. **View All Events**:

   - Click "Events" in navigation
   - Browse by category or club
   - Use search functionality
   - Filter by date or type

2. **Event Details**:
   - Click on any event card
   - View full description, date, time, location
   - See registration requirements
   - Check registration status

### Event Registration

1. **Register for Event**:

   - Open event details page
   - Click "Register" button
   - Fill in any required information
   - Submit registration
   - Receive confirmation

2. **Manage Registrations**:
   - View registered events in dashboard
   - Cancel registration if allowed
   - Receive event reminders via email

### Creating Events (Moderators/Admins)

1. Navigate to "Events" → "Create Event"
2. Fill in event details:
   - Title and description
   - Date and time
   - Location (physical/virtual)
   - Registration requirements
   - Event category
   - Associated club
3. Upload event banner (optional)
4. Set registration limits
5. Publish event

### Managing Events

**For Event Creators**:

- Edit event details
- View registration list
- Cancel or delete events
- Send updates to registrants

---

## Clubs

### Browsing Clubs

1. **View All Clubs**:

   - Click "Clubs" in navigation
   - Browse club cards
   - Search by name or category

2. **Club Details**:
   - Click on club card
   - View different tabs:
     - **About**: Club description and information
     - **Events**: Club's upcoming and past events
     - **Members**: Club moderators and members
     - **Gallery**: Club photos and media
     - **Socials**: Social media links
     - **Recruitments**: Open positions

### Club Management (Club Moderators/Admins)

1. **Edit Club Information**:

   - Go to club page
   - Click "Edit" (visible to moderators)
   - Update about section using Markdown
   - Save changes

2. **Gallery Management**:

   - Upload new images to gallery
   - Add captions to images
   - Delete unwanted images
   - Set club display image

3. **Member Management**:
   - View current moderators
   - Add/remove moderators (admin only)
   - Manage member list

### Creating Clubs (Admins Only)

1. Navigate to "Admin" → "Clubs" → "Add Club"
2. Fill in club details:
   - Name and description
   - Category and tags
   - Contact information
   - Social media links
3. Assign initial moderators
4. Upload club logo/image
5. Publish club

---

## Recruitments

### Browsing Recruitments

1. **View Available Positions**:

   - Click "Recruitments" in navigation
   - Browse by club or position type
   - Filter by status (open/closed)

2. **Recruitment Details**:
   - Click on recruitment card
   - Read position description
   - Check requirements and qualifications
   - View application deadline

### Applying to Recruitments

1. **Submit Application**:

   - Open recruitment details
   - Click "Apply" button
   - Fill in application form
   - Answer custom questions
   - Upload required documents
   - Submit application

2. **Track Applications**:
   - View application status in dashboard
   - Receive email updates on status changes

### Creating Recruitments (Club Moderators/Admins)

1. Navigate to "Recruitments" → "New"
2. Fill in recruitment details:
   - Position title and description
   - Requirements and qualifications
   - Application deadline
   - Associated club
3. Add custom application questions
4. Set application review process
5. Publish recruitment

### Managing Recruitments (Club Moderators/Admins)

1. **View Applications**:

   - Go to club page → "Recruitments" tab
   - Click "View Responses"
   - Review all submitted applications

2. **Process Applications**:
   - Read application responses
   - Review custom field answers
   - Export application data
   - Contact applicants

---

## Admin Functions

### Admin Dashboard

Admins have access to a comprehensive dashboard with:

- **User Management**: View, edit, delete users
- **Role Management**: Assign roles, approve requests
- **Club Management**: Create, edit, delete clubs
- **Event Management**: Oversee all events
- **System Settings**: Configure application settings
- **Logs**: View system activity logs

### User Management

1. **View All Users**:

   - Navigate to "Admin" → "Users"
   - Search and filter users
   - View user details and roles

2. **Role Assignment**:

   - Go to "Admin" → "Roles"
   - Select user and new role
   - Confirm assignment

3. **Role Requests**:
   - Review pending role requests
   - Approve or deny requests
   - Notify users of decisions

### Club Management

1. **Create New Clubs**:

   - Add club information
   - Assign initial moderators
   - Set up club structure

2. **Manage Existing Clubs**:
   - Edit club details
   - Add/remove moderators
   - Archive inactive clubs

### System Settings

1. **Site Configuration**:

   - Update site name and description
   - Configure contact information
   - Set feature toggles

2. **Email Settings**:
   - Configure email templates
   - Set notification preferences
   - Test email functionality

---

## Moderator Functions

### Content Creation

**Moderators can**:

- Create and manage events
- Create and manage recruitments
- Access moderator-specific features

### Event Management

1. **Create Events**:

   - Use event creation form
   - Set event parameters
   - Manage registrations

2. **Manage Registrations**:
   - View registration lists
   - Export registration data
   - Communicate with registrants

---

## Troubleshooting

### Common Issues

1. **Cannot Login**:

   - Check email and password
   - Try password reset
   - Check email verification status
   - Contact admin if issues persist

2. **Email Not Received**:

   - Check spam/junk folder
   - Verify email address is correct
   - Request new verification email
   - Contact support

3. **Registration Issues**:

   - Check event availability
   - Verify registration requirements
   - Ensure account is verified
   - Try again or contact moderators

4. **Upload Problems**:

   - Check file size limits
   - Verify file format (JPEG, PNG)
   - Try different browser
   - Contact admin if persistent

5. **Permission Denied**:
   - Verify your user role
   - Check if you're logged in
   - Request necessary permissions
   - Contact admin for role issues

### Getting Help

1. **Contact Information**:

   - Check "About" page for contact details
   - Use contact form if available
   - Email administrators directly

2. **Feature Requests**:

   - Submit through proper channels
   - Provide detailed descriptions
   - Include use case examples

3. **Bug Reports**:
   - Document the issue clearly
   - Include browser and OS information
   - Provide steps to reproduce
   - Include screenshots if helpful

---

## Tips for Better Experience

### 🎯 Best Practices

1. **Keep Profile Updated**: Regular profile updates help moderators and admins
2. **Use Clear Descriptions**: When creating events or recruitments, be detailed
3. **Follow Guidelines**: Respect community guidelines and policies
4. **Stay Active**: Regular participation improves overall experience
5. **Provide Feedback**: Help improve the platform with constructive feedback

### 🔐 Security Tips

1. **Strong Passwords**: Use complex, unique passwords
2. **Enable 2FA**: If available, enable two-factor authentication
3. **Regular Updates**: Keep your profile information current
4. **Privacy Awareness**: Be mindful of information you share
5. **Secure Logout**: Always logout from shared computers

### 📱 Mobile Usage

- The platform is responsive and works on mobile devices
- All major features are accessible on mobile
- Upload functionality works on mobile browsers
- Use landscape mode for better table views

---

**Need More Help?**

Check out other documentation:

- [Technical Documentation](DATABASE_SCHEMA.md)
- [Developer Guide](DEVELOPER_SETUP.md)
- [API Documentation](API_DOCUMENTATION.md)
