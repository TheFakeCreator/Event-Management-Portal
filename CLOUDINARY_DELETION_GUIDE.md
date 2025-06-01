# Cloudinary Image Deletion Implementation

## Overview

This implementation adds comprehensive Cloudinary image deletion functionality across the Event Management Portal. When images are deleted from the database, they are also removed from Cloudinary to prevent orphaned files and optimize storage costs.

## Modified Files

### `routes/club.routes.js`

- **Added**: Cloudinary import
- **Added**: `extractPublicId()` helper function to extract public_id from Cloudinary URLs
- **Modified**: Gallery image deletion route (`/:id/gallery/:imageId/delete`)
- **Modified**: Club display image deletion route (`/:id/image/delete`)

### `controllers/admin.controller.js`

- **Added**: Cloudinary import and `extractPublicId()` helper function
- **Enhanced**: `deleteClub()` - Cleans up club display image, banner, and all gallery images
- **Enhanced**: `deleteEvent()` - Cleans up event images
- **Enhanced**: `deleteUser()` - Cleans up user avatars

### `controllers/event.controller.js`

- **Added**: Cloudinary import and `extractPublicId()` helper function
- **Enhanced**: `deleteEvent()` - Cleans up event images before database deletion

### `controllers/user.controller.js`

- **Added**: Cloudinary import and `extractPublicId()` helper function
- **Enhanced**: `postUserEdit()` - Cleans up old avatars when users update profile pictures

## Key Features

### 1. Smart Public ID Extraction

The `extractPublicId()` function handles different Cloudinary URL formats:

- With version: `https://res.cloudinary.com/cloud/image/upload/v1234567890/folder/image.jpg`
- Without version: `https://res.cloudinary.com/cloud/image/upload/folder/image.jpg`
- Removes file extensions automatically
- Returns null for invalid URLs

### 2. Graceful Error Handling

- Cloudinary deletion failures don't prevent database deletion
- Errors are logged to console for debugging
- Users see success messages even if Cloudinary deletion fails

### 3. Gallery Image Deletion

**Route**: `POST /:id/gallery/:imageId/delete`

- Finds the specific image in the club's gallery array
- Extracts public_id from the image URL
- Deletes from Cloudinary using `cloudinary.uploader.destroy()`
- Removes from database gallery array
- Redirects with appropriate flash messages

### 4. Club Display Image Deletion

**Route**: `POST /:id/image/delete`

- Extracts public_id from club's main image URL
- Deletes from Cloudinary
- Sets club.image to undefined in database
- Maintains existing UI flow

### 5. Complete Club Deletion (Admin)

**Route**: `POST /admin/clubs/delete/:id`

- Finds club before deletion to access all image URLs
- Extracts public_ids from display image, banner, and all gallery images
- Deletes all images from Cloudinary in sequence
- Logs count of images cleaned up
- Proceeds with database deletion

### 6. Event Image Cleanup

**Routes**:

- `POST /admin/events/delete/:id` (Admin deletion)
- `POST /event/:id/delete` (Creator/Admin deletion)
- Extracts public_id from event image URL
- Deletes from Cloudinary before database deletion
- Handles both admin and user-initiated deletions

### 7. User Avatar Cleanup

**Features**:

- **Profile Updates**: When users change avatars, old images are cleaned from Cloudinary
- **User Deletion**: When admins delete users, their avatars are cleaned up
- Prevents accumulation of orphaned profile pictures

## Testing the Implementation

### Prerequisites

1. Ensure Cloudinary credentials are properly configured in `.env`
2. Have test data with uploaded images (clubs, events, users with avatars)
3. Login as appropriate user type for each test

### Test Gallery Image Deletion

1. Navigate to `/club/{clubId}/gallery`
2. Click "Delete" on any gallery image
3. Confirm deletion
4. Verify:
   - Image removed from gallery UI
   - Image deleted from Cloudinary (check Cloudinary dashboard)
   - Success message displayed

### Test Club Display Image Deletion

1. Navigate to `/club/{clubId}/gallery`
2. Click "Delete Club Display Image" (if moderator)
3. Confirm deletion
4. Verify:
   - Club display image removed from club pages
   - Image deleted from Cloudinary
   - Success message displayed

### Test Complete Club Deletion (Admin)

1. Login as admin
2. Navigate to `/admin/clubs`
3. Delete a club with multiple images (display + banner + gallery)
4. Verify:
   - All club images removed from Cloudinary
   - Success message shows count of cleaned images
   - Club removed from database

### Test Event Deletion

1. Create or find an event with an image
2. Delete event (as creator or admin)
3. Verify:
   - Event image deleted from Cloudinary
   - Event removed from database

### Test User Avatar Cleanup

1. **Profile Update Test**:
   - Upload a profile picture
   - Upload a different profile picture
   - Verify old avatar was deleted from Cloudinary
2. **User Deletion Test** (Admin):
   - Delete a user with an avatar
   - Verify avatar deleted from Cloudinary

## Error Scenarios Handled

1. **Invalid Cloudinary URL**: Gracefully skips Cloudinary deletion, proceeds with database cleanup
2. **Cloudinary API errors**: Logs error, continues with database deletion
3. **Missing public_id**: Safely handles URLs that don't contain extractable public_ids
4. **Network failures**: Cloudinary timeouts don't block database operations

## Security Considerations

- Routes protected by authentication and moderator middleware
- Confirmation dialogs prevent accidental deletions
- Database deletion always proceeds even if Cloudinary fails
- No sensitive Cloudinary credentials exposed to client

## Future Enhancements

The current implementation covers all major image deletion scenarios. Potential future improvements:

### 1. Batch Cleanup Operations

- Admin tool to scan and clean orphaned images from Cloudinary
- Scheduled cleanup jobs to remove unused images periodically

### 2. Image Usage Analytics

- Track which images are being deleted most frequently
- Monitor Cloudinary storage savings from cleanup operations

### 3. Enhanced Error Recovery

- Retry mechanism for failed Cloudinary deletions
- Queue system for bulk image deletions

### 4. Additional Image Types

- Club recruitment banners
- Event gallery images (if implemented)
- System/admin uploaded images

### 5. Performance Optimizations

- Parallel deletion of multiple images
- Background job processing for large cleanup operations

## Monitoring

Monitor these logs for Cloudinary operations:

- `Successfully deleted image from Cloudinary: {publicId}`
- `Successfully deleted club display image from Cloudinary: {publicId}`
- `Successfully deleted event image from Cloudinary: {publicId}`
- `Successfully deleted user avatar from Cloudinary: {publicId}`
- `Attempting to delete {count} images from Cloudinary for club: {clubName}`
- `Error deleting from Cloudinary: {error}`
- `Error deleting {type} from Cloudinary: {error}`

### Log Analysis

- Track successful vs. failed Cloudinary operations
- Monitor storage cleanup efficiency
- Identify patterns in deletion failures

## Dependencies

- `cloudinary` package (already configured)
- Existing upload middleware uses CloudinaryStorage
- Cloudinary config in `configs/cloudinary.js`
- Helper function `extractPublicId()` replicated across controllers

## Implementation Summary

### Files Enhanced

1. **`routes/club.routes.js`** - Gallery and display image deletion
2. **`controllers/admin.controller.js`** - Complete resource cleanup (clubs, events, users)
3. **`controllers/event.controller.js`** - Event image cleanup
4. **`controllers/user.controller.js`** - Avatar cleanup on updates

### Coverage

- ✅ Club gallery images
- ✅ Club display images
- ✅ Club banner images (when entire club deleted)
- ✅ Event images
- ✅ User avatars (on update and deletion)
- ✅ Batch cleanup (complete club deletion)

### Error Handling

- Graceful failure (Cloudinary errors don't block database operations)
- Comprehensive logging for debugging
- Null checks for invalid URLs
- Try-catch blocks around all Cloudinary operations

The implementation ensures comprehensive image cleanup across the entire Event Management Portal while maintaining system reliability and user experience.
