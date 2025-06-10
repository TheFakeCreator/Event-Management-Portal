# Route Endpoints and Permission Levels

## Overview

This document outlines all route endpoints in the Event Management Portal application, their required permission levels, and who can access them. The application has four main permission levels:

### Permission Levels

1. **Public** - No authentication required
2. **Authenticated** - Requires user login
3. **Moderator/Admin** - Requires moderator or admin role
4. **Club Moderator** - Requires club-specific moderator permissions
5. **Admin Only** - Requires admin role

---

## Authentication Routes (`/auth`)

### GET Routes

| Endpoint                      | Permission | Access Level | Description                                    |
| ----------------------------- | ---------- | ------------ | ---------------------------------------------- |
| `/auth/login`                 | Public\*   | Any user     | Login page (redirects if authenticated)        |
| `/auth/signup`                | Public\*   | Any user     | Registration page (redirects if authenticated) |
| `/auth/verify/:token`         | Public     | Any user     | Email verification                             |
| `/auth/forgot-password`       | Public\*   | Any user     | Forgot password page                           |
| `/auth/reset-password/:token` | Public\*   | Any user     | Reset password page                            |
| `/auth/google`                | Public     | Any user     | Google OAuth login initiation                  |
| `/auth/google/secrets`        | Public     | Any user     | Google OAuth callback (legacy)                 |
| `/auth/google/callback`       | Public     | Any user     | Google OAuth callback                          |

### POST Routes

| Endpoint                      | Permission | Access Level | Description             |
| ----------------------------- | ---------- | ------------ | ----------------------- |
| `/auth/signup`                | Public     | Any user     | User registration       |
| `/auth/login`                 | Public     | Any user     | User login              |
| `/auth/logout`                | Public     | Any user     | User logout             |
| `/auth/forgot-password`       | Public     | Any user     | Forgot password request |
| `/auth/reset-password/:token` | Public     | Any user     | Reset password          |

\*Uses `isAuthenticatedLineant` - shows different content based on auth status

---

## Admin Routes (`/admin`)

**All admin routes require authentication + admin role**

### GET Routes

| Endpoint                 | Permission | Access Level | Description        |
| ------------------------ | ---------- | ------------ | ------------------ |
| `/admin/dashboard`       | Admin Only | Admin users  | Admin dashboard    |
| `/admin/roles`           | Admin Only | Admin users  | Manage user roles  |
| `/admin/roles/requests`  | Admin Only | Admin users  | View role requests |
| `/admin/clubs`           | Admin Only | Admin users  | Manage clubs       |
| `/admin/clubs/edit/:id`  | Admin Only | Admin users  | Edit club page     |
| `/admin/users`           | Admin Only | Admin users  | Manage users       |
| `/admin/events`          | Admin Only | Admin users  | Manage events      |
| `/admin/events/edit/:id` | Admin Only | Admin users  | Edit event page    |
| `/admin/settings`        | Admin Only | Admin users  | Admin settings     |
| `/admin/logs`            | Admin Only | Admin users  | System logs        |

### POST Routes

| Endpoint                            | Permission | Access Level | Description           |
| ----------------------------------- | ---------- | ------------ | --------------------- |
| `/admin/clubs/create`               | Admin Only | Admin users  | Create new club       |
| `/admin/clubs/update/:id`           | Admin Only | Admin users  | Update club           |
| `/admin/clubs/delete/:id`           | Admin Only | Admin users  | Delete club           |
| `/admin/roles/assign`               | Admin Only | Admin users  | Assign role to user   |
| `/admin/roles/approve/:userId`      | Admin Only | Admin users  | Approve role request  |
| `/admin/roles/deny/:userId`         | Admin Only | Admin users  | Reject role request   |
| `/admin/users/delete/:userId`       | Admin Only | Admin users  | Delete user           |
| `/admin/events/delete/:id`          | Admin Only | Admin users  | Delete event          |
| `/admin/events/edit/:id`            | Admin Only | Admin users  | Edit event            |
| `/admin/clubs/:id/add-moderator`    | Admin Only | Admin users  | Add club moderator    |
| `/admin/clubs/:id/remove-moderator` | Admin Only | Admin users  | Remove club moderator |

---

## User Routes (`/user`)

### GET Routes

| Endpoint                       | Permission      | Access Level    | Description        |
| ------------------------------ | --------------- | --------------- | ------------------ |
| `/user/test-error`             | Authenticated\* | Logged-in users | Test error handler |
| `/user/:username/edit`         | Authenticated   | Profile owner   | Edit user profile  |
| `/user/:username`              | Authenticated   | Logged-in users | View user profile  |
| `/user/:username/request-role` | Authenticated   | Logged-in users | Request role page  |

### POST Routes

| Endpoint                       | Permission    | Access Level    | Description         |
| ------------------------------ | ------------- | --------------- | ------------------- |
| `/user/:username/edit`         | Authenticated | Profile owner   | Update user profile |
| `/user/:username/request-role` | Authenticated | Logged-in users | Submit role request |

\*Uses `isAuthenticatedLineant` - shows different content based on auth status

---

## Event Routes (`/event`)

### GET Routes

| Endpoint              | Permission      | Access Level        | Description             |
| --------------------- | --------------- | ------------------- | ----------------------- |
| `/event/`             | Authenticated\* | Any user            | View all events         |
| `/event/create`       | Moderator/Admin | Moderators & Admins | Create event page       |
| `/event/:id`          | Authenticated   | Logged-in users     | View event details      |
| `/event/:id/register` | Authenticated   | Logged-in users     | Event registration page |
| `/event/:id/edit`     | Authenticated   | Event creator/Admin | Edit event page         |

### POST Routes

| Endpoint              | Permission      | Access Level        | Description        |
| --------------------- | --------------- | ------------------- | ------------------ |
| `/event/create`       | Moderator/Admin | Moderators & Admins | Create new event   |
| `/event/:id/register` | Authenticated   | Logged-in users     | Register for event |
| `/event/:id/delete`   | Moderator/Admin | Event creator/Admin | Delete event       |
| `/event/:id/edit`     | Moderator/Admin | Event creator/Admin | Update event       |

---

## Club Routes (`/club`)

### GET Routes

| Endpoint                           | Permission      | Access Level             | Description                |
| ---------------------------------- | --------------- | ------------------------ | -------------------------- |
| `/club/`                           | Authenticated\* | Any user                 | View all clubs             |
| `/club/add`                        | Admin Only      | Admin users              | Create club page           |
| `/club/:id/edit`                   | Club Moderator  | Club moderators & Admins | Edit club page             |
| `/club/:id/:subPage`               | Authenticated\* | Any user                 | View club sub-pages        |
| `/club/:id/mod-section`            | Club Moderator  | Club moderators & Admins | Moderator test section     |
| `/club/:id/recruitments/responses` | Club Moderator  | Club moderators & Admins | View recruitment responses |

### POST Routes

| Endpoint                            | Permission     | Access Level             | Description               |
| ----------------------------------- | -------------- | ------------------------ | ------------------------- |
| `/club/add`                         | Admin Only     | Admin users              | Create new club           |
| `/club/:id/edit`                    | Club Moderator | Club moderators & Admins | Update club               |
| `/club/:id/edit-about`              | Club Moderator | Club moderators & Admins | Update club about section |
| `/club/:id/gallery/upload`          | Club Moderator | Club moderators & Admins | Upload gallery image      |
| `/club/:id/image/upload`            | Club Moderator | Club moderators & Admins | Upload club display image |
| `/club/:id/gallery/:imageId/delete` | Club Moderator | Club moderators & Admins | Delete gallery image      |
| `/club/:id/image/delete`            | Club Moderator | Club moderators & Admins | Delete club display image |

---

## Recruitment Routes (`/recruitment`)

### GET Routes

| Endpoint           | Permission      | Access Level             | Description              |
| ------------------ | --------------- | ------------------------ | ------------------------ |
| `/recruitment/`    | Authenticated\* | Any user                 | View all recruitments    |
| `/recruitment/new` | Club Moderator  | Club moderators & Admins | Create recruitment page  |
| `/recruitment/:id` | Authenticated\* | Any user                 | View recruitment details |

### POST Routes

| Endpoint           | Permission      | Access Level             | Description            |
| ------------------ | --------------- | ------------------------ | ---------------------- |
| `/recruitment/new` | Club Moderator  | Club moderators & Admins | Create new recruitment |
| `/recruitment/:id` | Authenticated\* | Any user                 | Apply to recruitment   |

---

## Index Routes (`/`)

### GET Routes

| Endpoint   | Permission      | Access Level | Description    |
| ---------- | --------------- | ------------ | -------------- |
| `/`        | Authenticated\* | Any user     | Home page      |
| `/about`   | Authenticated\* | Any user     | About page     |
| `/privacy` | Authenticated\* | Any user     | Privacy policy |
| `/test`    | Authenticated\* | Any user     | Test page      |

---

## Upload Routes (`/upload`)

### GET Routes

| Endpoint  | Permission | Access Level | Description      |
| --------- | ---------- | ------------ | ---------------- |
| `/upload` | Public     | Any user     | Upload test page |

### POST Routes

| Endpoint         | Permission | Access Level | Description          |
| ---------------- | ---------- | ------------ | -------------------- |
| `/upload/upload` | Public     | Any user     | File upload endpoint |

---

## Permission Middleware Details

### Authentication Middleware

- **`isAuthenticated`**: Requires valid JWT token, redirects to login if not authenticated
- **`isAuthenticatedLineant`**: Checks authentication but allows access regardless, sets `req.isAuthenticated` flag

### Authorization Middleware

- **`isAdmin`**: Requires user role to be "admin"
- **`isModeratorOrAdmin`**: Requires user role to be "admin" or "moderator"
- **`isClubModerator`**: Requires user to be admin OR moderator of the specific club

### Access Control Logic

1. **Public Routes**: No authentication required
2. **Authenticated Routes**: Must have valid JWT token
3. **Admin Routes**: Must be authenticated + have admin role
4. **Club Moderator Routes**: Must be authenticated + (admin OR club moderator)
5. **Moderator/Admin Routes**: Must be authenticated + (admin OR moderator role)

### Special Notes

- Routes marked with `*` use `isAuthenticatedLineant` which shows different content based on authentication status
- Club moderator permissions are specific to each club - users can moderate only clubs they're assigned to
- Admin users have access to all club moderator routes regardless of specific club assignment
- Some routes have additional business logic checks within controllers for ownership/permissions
