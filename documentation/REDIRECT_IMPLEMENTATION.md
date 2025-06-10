# Login Redirect Implementation

## Overview

This implementation allows users to be redirected to the page they were trying to access after successfully logging in, instead of always being redirected to their profile page.

## Changes Made

### 1. Auth Middleware (`middlewares/authMiddleware.js`)

- Modified `isAuthenticated` middleware to capture the current URL (`req.originalUrl`) when redirecting unauthenticated users to login
- Added the captured URL as a query parameter: `/auth/login?redirect=<encoded-url>`

### 2. Auth Controller (`controllers/auth.controller.js`)

#### `getLoginUser` function:

- Now accepts a `redirect` query parameter
- Passes the redirect URL to the login view template

#### `loginUser` function:

- Extracts `redirectUrl` from the form data
- Validates that the redirect URL is safe (starts with `/` but not `//` to prevent external redirects)
- Redirects to the previous page if valid, otherwise defaults to user profile
- Preserves redirect URL in error scenarios by adding it back to the login redirect

### 3. Auth Routes (`routes/auth.routes.js`)

#### Google OAuth routes:

- Modified `/auth/google` route to store redirect URL in session
- Updated `/auth/google/callback` to check for stored redirect URL and use it after successful authentication

### 4. Login View (`views/login.ejs`)

- Added hidden input field to preserve redirect URL in form submission
- Modified Google OAuth button to include redirect URL as query parameter

## Security Considerations

### URL Validation

The implementation includes security checks to prevent open redirect vulnerabilities:

```javascript
// Ensure the redirect URL is safe (doesn't redirect to external sites)
if (redirectUrl.startsWith("/") && !redirectUrl.startsWith("//")) {
  return res.redirect(redirectUrl);
}
```

This ensures:

- Only relative URLs starting with `/` are allowed
- URLs starting with `//` are blocked (which could redirect to external domains)
- External URLs (http://, https://) are blocked

## Usage Examples

### 1. Accessing Protected Route

1. User visits `/admin/dashboard` without being logged in
2. Middleware redirects to `/auth/login?redirect=%2Fadmin%2Fdashboard`
3. After successful login, user is redirected to `/admin/dashboard`

### 2. Normal Login

1. User visits `/auth/login` directly (no redirect parameter)
2. After successful login, user is redirected to their profile page (default behavior)

### 3. Google OAuth with Redirect

1. User clicks "Sign in with Google" from a page with redirect URL
2. OAuth flow completes and user is redirected to the original page

## Testing the Implementation

### Manual Testing Steps:

1. **Test Protected Route Redirect:**

   - Start the application
   - In a private/incognito browser window, visit `http://localhost:3000/admin/dashboard`
   - You should be redirected to login page with URL: `/auth/login?redirect=%2Fadmin%2Fdashboard`
   - Login with valid credentials
   - You should be redirected back to `/admin/dashboard`

2. **Test Direct Login:**

   - Visit `http://localhost:3000/auth/login` directly
   - Login with valid credentials
   - You should be redirected to your profile page

3. **Test Google OAuth Redirect:**

   - Access a protected route (e.g., `/event/create`)
   - Click "Sign in with Google"
   - Complete Google OAuth
   - You should be redirected back to the original route

4. **Test Invalid/Malicious Redirects:**
   - Try visiting `/auth/login?redirect=//evil.com`
   - After login, you should be redirected to profile (not evil.com)
   - Try visiting `/auth/login?redirect=http://evil.com`
   - After login, you should be redirected to profile (not evil.com)

### Edge Cases Handled:

- Empty or missing redirect URL → defaults to profile
- Invalid redirect URL (external) → defaults to profile
- Malformed redirect URL → defaults to profile
- Login errors → preserves redirect URL for retry

## Files Modified:

1. `middlewares/authMiddleware.js` - Capture current URL for redirect
2. `controllers/auth.controller.js` - Handle redirect logic in login flow
3. `routes/auth.routes.js` - Google OAuth redirect handling
4. `views/login.ejs` - Form and UI updates for redirect URL

## Benefits:

- Improved user experience - users return to where they were going
- Maintains application state and context
- Secure implementation with proper validation
- Works with both regular login and Google OAuth
- Backward compatible - no breaking changes to existing functionality
