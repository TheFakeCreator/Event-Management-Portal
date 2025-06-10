# Event Management Portal - API Documentation

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Error Handling](#error-handling)
4. [Rate Limiting](#rate-limiting)
5. [Data Models](#data-models)
6. [API Endpoints](#api-endpoints)
   - [Authentication Routes](#authentication-routes)
   - [User Routes](#user-routes)
   - [Event Routes](#event-routes)
   - [Club Routes](#club-routes)
   - [Admin Routes](#admin-routes)
   - [Recruitment Routes](#recruitment-routes)
   - [Upload Routes](#upload-routes)
   - [Public Routes](#public-routes)

## Overview

The Event Management Portal API provides RESTful endpoints for managing events, clubs, users, and recruitment processes. The API uses JWT-based authentication and role-based authorization.

**Base URL:** `http://localhost:3000` (development)
**API Version:** v1
**Content-Type:** `application/json`

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Most endpoints require authentication.

### Authentication Headers

```
Authorization: Bearer <jwt_token>
```

### Authentication Flow

1. User registers or logs in via `/auth/signup` or `/auth/login`
2. Server returns JWT token
3. Client includes token in Authorization header for subsequent requests
4. Token expires after 7 days (configurable)

### User Roles

- **Student**: Basic user with limited permissions
- **Moderator**: Can manage specific clubs and their events
- **Admin**: Full system access
- **Super Admin**: Complete administrative control

## Error Handling

The API uses standard HTTP status codes and returns error responses in JSON format:

```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": "Additional error details"
  }
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Unprocessable Entity
- `429` - Too Many Requests
- `500` - Internal Server Error

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **General requests**: 100 requests per 15 minutes per IP
- **Authentication requests**: 5 requests per 15 minutes per IP
- **File uploads**: 10 requests per hour per user

## Data Models

### User Model

```json
{
  "_id": "ObjectId",
  "name": "string",
  "email": "string",
  "password": "string (hashed)",
  "role": "string (Student|Moderator|Admin|Super Admin)",
  "profilePicture": "string (URL)",
  "clubs": ["ObjectId"],
  "registeredEvents": ["ObjectId"],
  "isVerified": "boolean",
  "verificationToken": "string",
  "resetPasswordToken": "string",
  "resetPasswordExpires": "Date",
  "googleId": "string",
  "githubId": "string",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Event Model

```json
{
  "_id": "ObjectId",
  "name": "string",
  "description": "string",
  "date": "Date",
  "time": "string",
  "venue": "string",
  "image": "string (URL)",
  "organizer": "ObjectId (User)",
  "club": "ObjectId (Club)",
  "collaborators": ["ObjectId (Club)"],
  "registrationRequired": "boolean",
  "registrationLimit": "number",
  "registrationDeadline": "Date",
  "registeredUsers": ["ObjectId (User)"],
  "status": "string (upcoming|ongoing|completed|cancelled)",
  "tags": ["string"],
  "isPublic": "boolean",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Club Model

```json
{
  "_id": "ObjectId",
  "name": "string",
  "description": "string",
  "logo": "string (URL)",
  "coverImage": "string (URL)",
  "moderators": ["ObjectId (User)"],
  "members": ["ObjectId (User)"],
  "events": ["ObjectId (Event)"],
  "gallery": ["string (URLs)"],
  "socialLinks": {
    "website": "string",
    "instagram": "string",
    "linkedin": "string",
    "twitter": "string"
  },
  "isActive": "boolean",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Recruitment Model

```json
{
  "_id": "ObjectId",
  "title": "string",
  "description": "string",
  "club": "ObjectId (Club)",
  "positions": ["string"],
  "requirements": ["string"],
  "deadline": "Date",
  "isActive": "boolean",
  "applications": [
    {
      "user": "ObjectId (User)",
      "position": "string",
      "coverLetter": "string",
      "resume": "string (URL)",
      "status": "string (pending|accepted|rejected)",
      "appliedAt": "Date"
    }
  ],
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

## API Endpoints

### Authentication Routes

#### POST /auth/signup

Register a new user account.

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "Student"
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "Student"
    },
    "token": "jwt_token"
  }
}
```

#### POST /auth/login

Authenticate user and get JWT token.

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "Student"
    },
    "token": "jwt_token"
  }
}
```

#### POST /auth/logout

Logout user (client-side token removal).

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "success": true,
  "message": "Logout successful"
}
```

#### POST /auth/forgot-password

Request password reset token.

**Request Body:**

```json
{
  "email": "john@example.com"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

#### POST /auth/reset-password

Reset password using token.

**Request Body:**

```json
{
  "token": "reset_token",
  "password": "new_password123"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Password reset successful"
}
```

#### GET /auth/google

Initiate Google OAuth authentication.

**Response:** Redirects to Google OAuth

#### GET /auth/google/callback

Handle Google OAuth callback.

**Response:** Redirects to dashboard with JWT token

#### GET /auth/github

Initiate GitHub OAuth authentication.

**Response:** Redirects to GitHub OAuth

#### GET /auth/github/callback

Handle GitHub OAuth callback.

**Response:** Redirects to dashboard with JWT token

#### GET /auth/verify-email/:token

Verify email address using verification token.

**Parameters:**

- `token` (string): Email verification token

**Response (200):**

```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

### User Routes

#### GET /user/profile

Get current user profile.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "Student",
      "profilePicture": "image_url",
      "clubs": ["club_id1", "club_id2"],
      "registeredEvents": ["event_id1", "event_id2"]
    }
  }
}
```

#### PUT /user/profile

Update user profile.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "name": "John Updated",
  "profilePicture": "new_image_url"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Updated",
      "email": "john@example.com",
      "profilePicture": "new_image_url"
    }
  }
}
```

#### POST /user/request-role

Request role change (Student to Moderator).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "requestedRole": "Moderator",
  "reason": "I want to manage club events"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Role change request submitted"
}
```

#### GET /user/registered-events

Get user's registered events.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "success": true,
  "data": {
    "events": [
      {
        "_id": "event_id",
        "name": "Tech Conference 2024",
        "date": "2024-12-15T00:00:00.000Z",
        "venue": "Main Auditorium"
      }
    ]
  }
}
```

### Event Routes

#### GET /events

Get all public events with pagination and filtering.

**Query Parameters:**

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `status` (string): Filter by status (upcoming|ongoing|completed)
- `club` (string): Filter by club ID
- `search` (string): Search in event name/description

**Response (200):**

```json
{
  "success": true,
  "data": {
    "events": [
      {
        "_id": "event_id",
        "name": "Tech Conference 2024",
        "description": "Annual technology conference",
        "date": "2024-12-15T00:00:00.000Z",
        "time": "10:00 AM",
        "venue": "Main Auditorium",
        "image": "event_image_url",
        "organizer": {
          "_id": "user_id",
          "name": "John Doe"
        },
        "club": {
          "_id": "club_id",
          "name": "Tech Club"
        },
        "registrationRequired": true,
        "registrationLimit": 100,
        "registeredCount": 45
      }
    ],
    "pagination": {
      "current": 1,
      "pages": 5,
      "total": 50
    }
  }
}
```

#### GET /events/:id

Get specific event details.

**Parameters:**

- `id` (string): Event ID

**Response (200):**

```json
{
  "success": true,
  "data": {
    "event": {
      "_id": "event_id",
      "name": "Tech Conference 2024",
      "description": "Annual technology conference",
      "date": "2024-12-15T00:00:00.000Z",
      "time": "10:00 AM",
      "venue": "Main Auditorium",
      "image": "event_image_url",
      "organizer": {
        "_id": "user_id",
        "name": "John Doe"
      },
      "club": {
        "_id": "club_id",
        "name": "Tech Club"
      },
      "collaborators": [
        {
          "_id": "club_id2",
          "name": "Innovation Club"
        }
      ],
      "registrationRequired": true,
      "registrationLimit": 100,
      "registrationDeadline": "2024-12-10T00:00:00.000Z",
      "registeredUsers": ["user_id1", "user_id2"],
      "status": "upcoming",
      "tags": ["technology", "conference"],
      "isPublic": true
    }
  }
}
```

#### POST /events

Create a new event.

**Headers:** `Authorization: Bearer <token>`
**Permission:** Moderator/Admin

**Request Body:**

```json
{
  "name": "Tech Conference 2024",
  "description": "Annual technology conference",
  "date": "2024-12-15",
  "time": "10:00 AM",
  "venue": "Main Auditorium",
  "image": "event_image_url",
  "club": "club_id",
  "collaborators": ["club_id2"],
  "registrationRequired": true,
  "registrationLimit": 100,
  "registrationDeadline": "2024-12-10",
  "tags": ["technology", "conference"],
  "isPublic": true
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Event created successfully",
  "data": {
    "event": {
      "_id": "new_event_id",
      "name": "Tech Conference 2024",
      "description": "Annual technology conference",
      "organizer": "user_id"
    }
  }
}
```

#### PUT /events/:id

Update an existing event.

**Headers:** `Authorization: Bearer <token>`
**Permission:** Event organizer/Club moderator/Admin

**Parameters:**

- `id` (string): Event ID

**Request Body:**

```json
{
  "name": "Updated Tech Conference 2024",
  "description": "Updated description",
  "venue": "Updated venue"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Event updated successfully",
  "data": {
    "event": {
      "_id": "event_id",
      "name": "Updated Tech Conference 2024"
    }
  }
}
```

#### DELETE /events/:id

Delete an event.

**Headers:** `Authorization: Bearer <token>`
**Permission:** Event organizer/Club moderator/Admin

**Parameters:**

- `id` (string): Event ID

**Response (200):**

```json
{
  "success": true,
  "message": "Event deleted successfully"
}
```

#### POST /events/:id/register

Register for an event.

**Headers:** `Authorization: Bearer <token>`

**Parameters:**

- `id` (string): Event ID

**Response (200):**

```json
{
  "success": true,
  "message": "Successfully registered for event"
}
```

#### DELETE /events/:id/register

Unregister from an event.

**Headers:** `Authorization: Bearer <token>`

**Parameters:**

- `id` (string): Event ID

**Response (200):**

```json
{
  "success": true,
  "message": "Successfully unregistered from event"
}
```

#### GET /events/:id/registrations

Get event registrations (organizers/moderators/admins only).

**Headers:** `Authorization: Bearer <token>`
**Permission:** Event organizer/Club moderator/Admin

**Parameters:**

- `id` (string): Event ID

**Response (200):**

```json
{
  "success": true,
  "data": {
    "registrations": [
      {
        "_id": "user_id1",
        "name": "John Doe",
        "email": "john@example.com",
        "registeredAt": "2024-12-01T10:00:00.000Z"
      }
    ],
    "count": 45
  }
}
```

### Club Routes

#### GET /clubs

Get all active clubs with pagination.

**Query Parameters:**

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `search` (string): Search in club name/description

**Response (200):**

```json
{
  "success": true,
  "data": {
    "clubs": [
      {
        "_id": "club_id",
        "name": "Tech Club",
        "description": "Technology enthusiasts club",
        "logo": "club_logo_url",
        "coverImage": "club_cover_url",
        "memberCount": 150,
        "eventCount": 25,
        "isActive": true
      }
    ],
    "pagination": {
      "current": 1,
      "pages": 3,
      "total": 25
    }
  }
}
```

#### GET /clubs/:id

Get specific club details.

**Parameters:**

- `id` (string): Club ID

**Response (200):**

```json
{
  "success": true,
  "data": {
    "club": {
      "_id": "club_id",
      "name": "Tech Club",
      "description": "Technology enthusiasts club",
      "logo": "club_logo_url",
      "coverImage": "club_cover_url",
      "moderators": [
        {
          "_id": "user_id1",
          "name": "Jane Doe",
          "email": "jane@example.com"
        }
      ],
      "members": ["user_id1", "user_id2"],
      "events": [
        {
          "_id": "event_id1",
          "name": "Tech Workshop",
          "date": "2024-12-15T00:00:00.000Z"
        }
      ],
      "gallery": ["image1_url", "image2_url"],
      "socialLinks": {
        "website": "https://techclub.com",
        "instagram": "@techclub",
        "linkedin": "tech-club",
        "twitter": "@techclub"
      },
      "isActive": true
    }
  }
}
```

#### POST /clubs

Create a new club.

**Headers:** `Authorization: Bearer <token>`
**Permission:** Admin

**Request Body:**

```json
{
  "name": "New Tech Club",
  "description": "A club for technology enthusiasts",
  "logo": "club_logo_url",
  "coverImage": "club_cover_url",
  "moderators": ["user_id1"],
  "socialLinks": {
    "website": "https://newtechclub.com",
    "instagram": "@newtechclub"
  }
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Club created successfully",
  "data": {
    "club": {
      "_id": "new_club_id",
      "name": "New Tech Club",
      "description": "A club for technology enthusiasts"
    }
  }
}
```

#### PUT /clubs/:id

Update club details.

**Headers:** `Authorization: Bearer <token>`
**Permission:** Club moderator/Admin

**Parameters:**

- `id` (string): Club ID

**Request Body:**

```json
{
  "description": "Updated club description",
  "socialLinks": {
    "website": "https://updated-website.com"
  }
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Club updated successfully",
  "data": {
    "club": {
      "_id": "club_id",
      "name": "Tech Club",
      "description": "Updated club description"
    }
  }
}
```

#### DELETE /clubs/:id

Delete a club.

**Headers:** `Authorization: Bearer <token>`
**Permission:** Admin

**Parameters:**

- `id` (string): Club ID

**Response (200):**

```json
{
  "success": true,
  "message": "Club deleted successfully"
}
```

#### POST /clubs/:id/join

Join a club.

**Headers:** `Authorization: Bearer <token>`

**Parameters:**

- `id` (string): Club ID

**Response (200):**

```json
{
  "success": true,
  "message": "Successfully joined the club"
}
```

#### DELETE /clubs/:id/leave

Leave a club.

**Headers:** `Authorization: Bearer <token>`

**Parameters:**

- `id` (string): Club ID

**Response (200):**

```json
{
  "success": true,
  "message": "Successfully left the club"
}
```

#### POST /clubs/:id/moderators

Add club moderator.

**Headers:** `Authorization: Bearer <token>`
**Permission:** Admin

**Parameters:**

- `id` (string): Club ID

**Request Body:**

```json
{
  "userId": "user_id"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Moderator added successfully"
}
```

#### DELETE /clubs/:id/moderators/:userId

Remove club moderator.

**Headers:** `Authorization: Bearer <token>`
**Permission:** Admin

**Parameters:**

- `id` (string): Club ID
- `userId` (string): User ID

**Response (200):**

```json
{
  "success": true,
  "message": "Moderator removed successfully"
}
```

#### POST /clubs/:id/gallery

Add images to club gallery.

**Headers:** `Authorization: Bearer <token>`
**Permission:** Club moderator/Admin

**Parameters:**

- `id` (string): Club ID

**Request Body:**

```json
{
  "images": ["image1_url", "image2_url"]
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Images added to gallery"
}
```

#### DELETE /clubs/:id/gallery

Remove image from club gallery.

**Headers:** `Authorization: Bearer <token>`
**Permission:** Club moderator/Admin

**Parameters:**

- `id` (string): Club ID

**Request Body:**

```json
{
  "imageUrl": "image_url_to_remove"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Image removed from gallery"
}
```

### Admin Routes

#### GET /admin/dashboard

Get admin dashboard statistics.

**Headers:** `Authorization: Bearer <token>`
**Permission:** Admin

**Response (200):**

```json
{
  "success": true,
  "data": {
    "statistics": {
      "totalUsers": 1250,
      "totalEvents": 85,
      "totalClubs": 15,
      "totalRecruitments": 12,
      "upcomingEvents": 25,
      "ongoingEvents": 3,
      "activeRecruitments": 5
    },
    "recentActivities": [
      {
        "type": "user_registered",
        "description": "New user John Doe registered",
        "timestamp": "2024-12-01T10:00:00.000Z"
      }
    ]
  }
}
```

#### GET /admin/users

Get all users with pagination and filtering.

**Headers:** `Authorization: Bearer <token>`
**Permission:** Admin

**Query Parameters:**

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `role` (string): Filter by role
- `search` (string): Search in name/email
- `verified` (boolean): Filter by verification status

**Response (200):**

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "_id": "user_id",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "Student",
        "isVerified": true,
        "clubs": ["club_id1"],
        "registeredEvents": ["event_id1", "event_id2"],
        "createdAt": "2024-01-15T10:00:00.000Z"
      }
    ],
    "pagination": {
      "current": 1,
      "pages": 25,
      "total": 1250
    }
  }
}
```

#### PUT /admin/users/:id/role

Update user role.

**Headers:** `Authorization: Bearer <token>`
**Permission:** Admin

**Parameters:**

- `id` (string): User ID

**Request Body:**

```json
{
  "role": "Moderator"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "User role updated successfully"
}
```

#### DELETE /admin/users/:id

Delete user account.

**Headers:** `Authorization: Bearer <token>`
**Permission:** Admin

**Parameters:**

- `id` (string): User ID

**Response (200):**

```json
{
  "success": true,
  "message": "User account deleted successfully"
}
```

#### GET /admin/events

Get all events (including private ones).

**Headers:** `Authorization: Bearer <token>`
**Permission:** Admin

**Query Parameters:**

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `status` (string): Filter by status
- `club` (string): Filter by club ID

**Response (200):**

```json
{
  "success": true,
  "data": {
    "events": [
      {
        "_id": "event_id",
        "name": "Tech Conference 2024",
        "organizer": {
          "_id": "user_id",
          "name": "John Doe"
        },
        "club": {
          "_id": "club_id",
          "name": "Tech Club"
        },
        "status": "upcoming",
        "registrationCount": 45,
        "isPublic": true
      }
    ],
    "pagination": {
      "current": 1,
      "pages": 5,
      "total": 85
    }
  }
}
```

#### GET /admin/clubs

Get all clubs (including inactive ones).

**Headers:** `Authorization: Bearer <token>`
**Permission:** Admin

**Query Parameters:**

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `active` (boolean): Filter by active status

**Response (200):**

```json
{
  "success": true,
  "data": {
    "clubs": [
      {
        "_id": "club_id",
        "name": "Tech Club",
        "moderators": [
          {
            "_id": "user_id",
            "name": "Jane Doe"
          }
        ],
        "memberCount": 150,
        "eventCount": 25,
        "isActive": true
      }
    ],
    "pagination": {
      "current": 1,
      "pages": 2,
      "total": 15
    }
  }
}
```

#### GET /admin/logs

Get system activity logs.

**Headers:** `Authorization: Bearer <token>`
**Permission:** Admin

**Query Parameters:**

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 50)
- `type` (string): Filter by log type
- `user` (string): Filter by user ID
- `startDate` (string): Filter from date (ISO format)
- `endDate` (string): Filter to date (ISO format)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "_id": "log_id",
        "type": "event_created",
        "description": "Event 'Tech Conference 2024' created",
        "user": {
          "_id": "user_id",
          "name": "John Doe"
        },
        "metadata": {
          "eventId": "event_id",
          "eventName": "Tech Conference 2024"
        },
        "timestamp": "2024-12-01T10:00:00.000Z"
      }
    ],
    "pagination": {
      "current": 1,
      "pages": 10,
      "total": 500
    }
  }
}
```

#### GET /admin/role-requests

Get pending role change requests.

**Headers:** `Authorization: Bearer <token>`
**Permission:** Admin

**Response (200):**

```json
{
  "success": true,
  "data": {
    "requests": [
      {
        "_id": "request_id",
        "user": {
          "_id": "user_id",
          "name": "John Doe",
          "email": "john@example.com",
          "currentRole": "Student"
        },
        "requestedRole": "Moderator",
        "reason": "I want to manage club events",
        "status": "pending",
        "requestedAt": "2024-12-01T10:00:00.000Z"
      }
    ]
  }
}
```

#### PUT /admin/role-requests/:id

Approve or reject role change request.

**Headers:** `Authorization: Bearer <token>`
**Permission:** Admin

**Parameters:**

- `id` (string): Request ID

**Request Body:**

```json
{
  "status": "approved",
  "reason": "User demonstrates leadership qualities"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Role request processed successfully"
}
```

### Recruitment Routes

#### GET /recruitments

Get all active recruitments.

**Query Parameters:**

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `club` (string): Filter by club ID
- `position` (string): Filter by position

**Response (200):**

```json
{
  "success": true,
  "data": {
    "recruitments": [
      {
        "_id": "recruitment_id",
        "title": "Tech Club Recruitment 2024",
        "description": "Join our tech community",
        "club": {
          "_id": "club_id",
          "name": "Tech Club",
          "logo": "club_logo_url"
        },
        "positions": ["Developer", "Designer", "Manager"],
        "deadline": "2024-12-31T23:59:59.000Z",
        "applicationCount": 25,
        "isActive": true
      }
    ],
    "pagination": {
      "current": 1,
      "pages": 2,
      "total": 12
    }
  }
}
```

#### GET /recruitments/:id

Get specific recruitment details.

**Parameters:**

- `id` (string): Recruitment ID

**Response (200):**

```json
{
  "success": true,
  "data": {
    "recruitment": {
      "_id": "recruitment_id",
      "title": "Tech Club Recruitment 2024",
      "description": "Join our tech community and work on exciting projects",
      "club": {
        "_id": "club_id",
        "name": "Tech Club",
        "logo": "club_logo_url"
      },
      "positions": ["Developer", "Designer", "Manager"],
      "requirements": [
        "Passionate about technology",
        "Good communication skills",
        "Team player"
      ],
      "deadline": "2024-12-31T23:59:59.000Z",
      "isActive": true,
      "createdAt": "2024-12-01T10:00:00.000Z"
    }
  }
}
```

#### POST /recruitments

Create a new recruitment.

**Headers:** `Authorization: Bearer <token>`
**Permission:** Club moderator/Admin

**Request Body:**

```json
{
  "title": "Tech Club Recruitment 2024",
  "description": "Join our tech community",
  "club": "club_id",
  "positions": ["Developer", "Designer", "Manager"],
  "requirements": ["Passionate about technology", "Good communication skills"],
  "deadline": "2024-12-31T23:59:59.000Z"
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Recruitment created successfully",
  "data": {
    "recruitment": {
      "_id": "new_recruitment_id",
      "title": "Tech Club Recruitment 2024",
      "club": "club_id"
    }
  }
}
```

#### PUT /recruitments/:id

Update recruitment details.

**Headers:** `Authorization: Bearer <token>`
**Permission:** Club moderator/Admin

**Parameters:**

- `id` (string): Recruitment ID

**Request Body:**

```json
{
  "description": "Updated recruitment description",
  "deadline": "2025-01-15T23:59:59.000Z"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Recruitment updated successfully"
}
```

#### DELETE /recruitments/:id

Delete a recruitment.

**Headers:** `Authorization: Bearer <token>`
**Permission:** Club moderator/Admin

**Parameters:**

- `id` (string): Recruitment ID

**Response (200):**

```json
{
  "success": true,
  "message": "Recruitment deleted successfully"
}
```

#### POST /recruitments/:id/apply

Apply for a recruitment.

**Headers:** `Authorization: Bearer <token>`

**Parameters:**

- `id` (string): Recruitment ID

**Request Body:**

```json
{
  "position": "Developer",
  "coverLetter": "I am passionate about technology...",
  "resume": "resume_file_url"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Application submitted successfully"
}
```

#### GET /recruitments/:id/applications

Get recruitment applications (moderators/admins only).

**Headers:** `Authorization: Bearer <token>`
**Permission:** Club moderator/Admin

**Parameters:**

- `id` (string): Recruitment ID

**Query Parameters:**

- `status` (string): Filter by application status
- `position` (string): Filter by position

**Response (200):**

```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "_id": "application_id",
        "user": {
          "_id": "user_id",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "position": "Developer",
        "coverLetter": "I am passionate about technology...",
        "resume": "resume_file_url",
        "status": "pending",
        "appliedAt": "2024-12-01T10:00:00.000Z"
      }
    ]
  }
}
```

#### PUT /recruitments/:id/applications/:applicationId

Update application status.

**Headers:** `Authorization: Bearer <token>`
**Permission:** Club moderator/Admin

**Parameters:**

- `id` (string): Recruitment ID
- `applicationId` (string): Application ID

**Request Body:**

```json
{
  "status": "accepted",
  "feedback": "Great application! Welcome to the team."
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Application status updated successfully"
}
```

### Upload Routes

#### POST /upload/image

Upload an image file.

**Headers:**

- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Request Body (Form Data):**

- `image`: Image file (JPG, PNG, GIF, WebP)
- `type`: Upload type (profile|event|club|gallery) - optional

**Response (200):**

```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "url": "https://cloudinary.com/image_url",
    "publicId": "image_public_id",
    "format": "jpg",
    "size": 1024576
  }
}
```

#### POST /upload/document

Upload a document file.

**Headers:**

- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Request Body (Form Data):**

- `document`: Document file (PDF, DOC, DOCX)
- `type`: Document type (resume|proposal) - optional

**Response (200):**

```json
{
  "success": true,
  "message": "Document uploaded successfully",
  "data": {
    "url": "https://cloudinary.com/document_url",
    "publicId": "document_public_id",
    "format": "pdf",
    "size": 2048576
  }
}
```

#### DELETE /upload/:publicId

Delete an uploaded file.

**Headers:** `Authorization: Bearer <token>`

**Parameters:**

- `publicId` (string): Cloudinary public ID of the file

**Response (200):**

```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

### Public Routes

#### GET /

Home page.

**Response:** HTML page

#### GET /about

About page.

**Response:** HTML page

#### GET /privacy

Privacy policy page.

**Response:** HTML page

#### GET /terms

Terms of service page.

**Response:** HTML page

#### GET /contact

Contact page.

**Response:** HTML page

#### POST /contact

Submit contact form.

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Question about events",
  "message": "I have a question about upcoming events..."
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Contact form submitted successfully"
}
```

## Webhooks

### Email Verification Webhook

Handles email verification status updates from the email service.

**Endpoint:** `POST /webhooks/email-verification`
**Headers:** `X-Webhook-Secret: <webhook_secret>`

**Request Body:**

```json
{
  "email": "user@example.com",
  "status": "verified",
  "timestamp": "2024-12-01T10:00:00.000Z"
}
```

### Payment Webhook (Future Implementation)

For handling payment confirmations for paid events.

**Endpoint:** `POST /webhooks/payment`
**Headers:** `X-Webhook-Secret: <webhook_secret>`

## API Response Examples

### Success Response Format

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data
  }
}
```

### Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": "Additional error information",
    "field": "fieldName" // For validation errors
  }
}
```

### Validation Error Response

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Valid email is required"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ]
}
```

## Status Codes Reference

| Code | Description                              |
| ---- | ---------------------------------------- |
| 200  | OK - Request successful                  |
| 201  | Created - Resource created successfully  |
| 400  | Bad Request - Invalid request data       |
| 401  | Unauthorized - Authentication required   |
| 403  | Forbidden - Insufficient permissions     |
| 404  | Not Found - Resource not found           |
| 409  | Conflict - Resource already exists       |
| 422  | Unprocessable Entity - Validation failed |
| 429  | Too Many Requests - Rate limit exceeded  |
| 500  | Internal Server Error - Server error     |

## Rate Limiting Details

### Authentication Endpoints

- **Limit:** 5 requests per 15 minutes per IP
- **Endpoints:** `/auth/login`, `/auth/signup`, `/auth/forgot-password`

### General API Endpoints

- **Limit:** 100 requests per 15 minutes per IP
- **Applies to:** All other endpoints

### File Upload Endpoints

- **Limit:** 10 requests per hour per authenticated user
- **Endpoints:** `/upload/*`

### File Size Limits

- **Images:** 5MB maximum
- **Documents:** 10MB maximum
- **Supported formats:**
  - Images: JPG, PNG, GIF, WebP
  - Documents: PDF, DOC, DOCX

## Security Considerations

1. **Authentication:** All sensitive endpoints require JWT authentication
2. **Authorization:** Role-based access control (RBAC) implemented
3. **Input Validation:** All inputs are validated and sanitized
4. **Rate Limiting:** Prevents abuse and DoS attacks
5. **CORS:** Configured for specific origins only
6. **HTTPS:** Required in production environment
7. **Password Security:** Passwords are hashed using bcrypt
8. **JWT Security:** Tokens expire after 7 days
9. **File Upload Security:** File type and size validation
10. **SQL Injection Prevention:** Using parameterized queries with Mongoose

## Environment Variables

Required environment variables for API functionality:

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/event-management

# JWT
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=7d

# Email Service
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Cloudinary (File Upload)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Application
NODE_ENV=production
PORT=3000
SESSION_SECRET=your-session-secret
```

## SDK and Client Libraries

### JavaScript/TypeScript SDK Example

```javascript
class EventManagementAPI {
  constructor(baseURL, token) {
    this.baseURL = baseURL;
    this.token = token;
  }

  async request(method, endpoint, data = null) {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.token}`,
    };

    const config = {
      method,
      headers,
      body: data ? JSON.stringify(data) : null,
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, config);
    return await response.json();
  }

  // Authentication
  async login(email, password) {
    return this.request("POST", "/auth/login", { email, password });
  }

  async signup(name, email, password, role) {
    return this.request("POST", "/auth/signup", {
      name,
      email,
      password,
      role,
    });
  }

  // Events
  async getEvents(page = 1, limit = 10) {
    return this.request("GET", `/events?page=${page}&limit=${limit}`);
  }

  async createEvent(eventData) {
    return this.request("POST", "/events", eventData);
  }

  async registerForEvent(eventId) {
    return this.request("POST", `/events/${eventId}/register`);
  }

  // Clubs
  async getClubs(page = 1, limit = 10) {
    return this.request("GET", `/clubs?page=${page}&limit=${limit}`);
  }

  async joinClub(clubId) {
    return this.request("POST", `/clubs/${clubId}/join`);
  }
}

// Usage
const api = new EventManagementAPI("http://localhost:3000", "your-jwt-token");
const events = await api.getEvents();
```

## Testing the API

### Using cURL

```bash
# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Get events (with token)
curl -X GET http://localhost:3000/events \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Create event
curl -X POST http://localhost:3000/events \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"New Event","description":"Event description","date":"2024-12-15","time":"10:00 AM","venue":"Main Hall","club":"club_id"}'
```

### Using Postman

1. Import the API collection (available in `/docs/postman-collection.json`)
2. Set up environment variables:
   - `baseURL`: `http://localhost:3000`
   - `token`: Your JWT token after login
3. Test endpoints with proper authentication headers

---

**Last Updated:** December 6, 2024
**API Version:** 1.0.0
**Contact:** For API support, please contact the development team.
