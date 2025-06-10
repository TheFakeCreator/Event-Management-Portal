# Email System Documentation

## Overview

The Event Management Portal includes a comprehensive email notification system that handles user communications, verification processes, and automated notifications. This document covers the email system architecture, notification types, cron job scheduling, and configuration details.

## Email System Architecture

### 1. Email Service Configuration

#### SMTP Configuration

The application uses Gmail SMTP for email delivery with the following configuration:

```javascript
const transporter = nodemailer.createTransporter({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // App-specific password
  },
});
```

#### Environment Variables

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
EMAIL_FROM="Event Management Portal <noreply@eventportal.com>"
BASE_URL=https://yourdomain.com
```

### 2. Email Templates

#### Template Structure

- HTML templates with embedded CSS for compatibility
- Responsive design for mobile devices
- Consistent branding and styling
- Fallback text versions for accessibility

#### Template Engine

The application uses EJS templating for dynamic email content:

```javascript
const emailTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title><%= subject %></title>
  <style>
    /* Email-specific CSS */
  </style>
</head>
<body>
  <div class="email-container">
    <%= content %>
  </div>
</body>
</html>
`;
```

## Notification Types

### 1. Authentication Emails

#### Email Verification

**Trigger**: User registration
**Purpose**: Verify email address ownership
**Template**: `email-verification.ejs`

```javascript
const verificationEmail = {
  to: user.email,
  subject: "Verify Your Email Address",
  template: "email-verification",
  data: {
    username: user.username,
    verificationUrl: `${process.env.BASE_URL}/auth/verify-email?token=${token}`,
    expiresIn: "24 hours",
  },
};
```

#### Password Reset

**Trigger**: Forgot password request
**Purpose**: Secure password reset process
**Template**: `password-reset.ejs`

```javascript
const resetEmail = {
  to: user.email,
  subject: "Reset Your Password",
  template: "password-reset",
  data: {
    username: user.username,
    resetUrl: `${process.env.BASE_URL}/auth/reset-password?token=${resetToken}`,
    expiresIn: "1 hour",
  },
};
```

#### Welcome Email

**Trigger**: Email verification completion
**Purpose**: Welcome new users to the platform
**Template**: `welcome.ejs`

### 2. Event Notifications

#### Event Registration Confirmation

**Trigger**: User registers for an event
**Purpose**: Confirm registration and provide event details
**Template**: `event-registration.ejs`

```javascript
const registrationEmail = {
  to: user.email,
  subject: `Registration Confirmed: ${event.title}`,
  template: "event-registration",
  data: {
    username: user.username,
    eventTitle: event.title,
    eventDate: event.date,
    eventLocation: event.location,
    eventUrl: `${process.env.BASE_URL}/events/${event._id}`,
  },
};
```

#### Event Reminder

**Trigger**: Scheduled cron job (24 hours before event)
**Purpose**: Remind registered users about upcoming events
**Template**: `event-reminder.ejs`

#### Event Updates

**Trigger**: Event details modification
**Purpose**: Notify registered users of changes
**Template**: `event-update.ejs`

#### Event Cancellation

**Trigger**: Event cancellation by organizer
**Purpose**: Inform registered users of cancellation
**Template**: `event-cancellation.ejs`

### 3. Club Notifications

#### Club Membership Approval

**Trigger**: Moderator approves membership request
**Purpose**: Notify user of membership approval
**Template**: `club-membership-approved.ejs`

#### Club Membership Rejection

**Trigger**: Moderator rejects membership request
**Purpose**: Notify user of membership rejection
**Template**: `club-membership-rejected.ejs`

#### Club Activity Updates

**Trigger**: New club events or announcements
**Purpose**: Keep members informed of club activities
**Template**: `club-activity-update.ejs`

### 4. Recruitment Notifications

#### Application Confirmation

**Trigger**: User submits recruitment application
**Purpose**: Confirm application receipt
**Template**: `recruitment-application.ejs`

#### Application Status Update

**Trigger**: Status change by recruiter
**Purpose**: Inform applicant of status changes
**Template**: `recruitment-status-update.ejs`

### 5. Administrative Notifications

#### Admin Alerts

**Trigger**: System events requiring admin attention
**Purpose**: Alert administrators of important events
**Template**: `admin-alert.ejs`

#### Moderation Notifications

**Trigger**: Content flagging or moderation actions
**Purpose**: Notify moderators of pending actions
**Template**: `moderation-notification.ejs`

## Cron Jobs & Scheduled Tasks

### 1. Email Reminder System

#### Event Reminders

**Schedule**: Daily at 9:00 AM
**Purpose**: Send reminders for events happening in the next 24 hours

```javascript
const cron = require("node-cron");

// Daily event reminders at 9:00 AM
cron.schedule("0 9 * * *", async () => {
  console.log("Running daily event reminder job...");

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const upcomingEvents = await Event.find({
    date: {
      $gte: new Date(
        tomorrow.getFullYear(),
        tomorrow.getMonth(),
        tomorrow.getDate()
      ),
      $lt: new Date(
        tomorrow.getFullYear(),
        tomorrow.getMonth(),
        tomorrow.getDate() + 1
      ),
    },
    status: "active",
  }).populate("registrations.user");

  for (const event of upcomingEvents) {
    await sendEventReminders(event);
  }
});
```

#### Weekly Digest

**Schedule**: Every Sunday at 8:00 AM
**Purpose**: Send weekly summary of activities

```javascript
// Weekly digest every Sunday at 8:00 AM
cron.schedule("0 8 * * 0", async () => {
  console.log("Running weekly digest job...");

  const users = await User.find({
    emailNotifications: true,
    emailVerified: true,
  });

  for (const user of users) {
    await sendWeeklyDigest(user);
  }
});
```

### 2. Cleanup Tasks

#### Expired Token Cleanup

**Schedule**: Daily at 2:00 AM
**Purpose**: Remove expired verification and reset tokens

```javascript
// Daily cleanup at 2:00 AM
cron.schedule("0 2 * * *", async () => {
  console.log("Running token cleanup job...");

  const expired = new Date();
  expired.setHours(expired.getHours() - 24);

  await User.updateMany(
    {
      emailVerificationExpires: { $lt: expired },
      emailVerified: false,
    },
    {
      $unset: {
        emailVerificationToken: 1,
        emailVerificationExpires: 1,
      },
    }
  );

  await User.updateMany(
    { resetPasswordExpires: { $lt: new Date() } },
    {
      $unset: {
        resetPasswordToken: 1,
        resetPasswordExpires: 1,
      },
    }
  );
});
```

#### Failed Email Retry

**Schedule**: Every 30 minutes
**Purpose**: Retry sending failed emails

```javascript
// Retry failed emails every 30 minutes
cron.schedule("*/30 * * * *", async () => {
  console.log("Retrying failed emails...");

  const failedEmails = await EmailQueue.find({
    status: "failed",
    retryCount: { $lt: 3 },
    nextRetry: { $lte: new Date() },
  });

  for (const email of failedEmails) {
    await retryEmail(email);
  }
});
```

### 3. Cron Job Management

#### Job Configuration

```javascript
const cronJobs = {
  eventReminders: {
    schedule: "0 9 * * *",
    enabled: process.env.ENABLE_EVENT_REMINDERS === "true",
    task: sendEventReminders,
  },
  weeklyDigest: {
    schedule: "0 8 * * 0",
    enabled: process.env.ENABLE_WEEKLY_DIGEST === "true",
    task: sendWeeklyDigest,
  },
  tokenCleanup: {
    schedule: "0 2 * * *",
    enabled: true,
    task: cleanupExpiredTokens,
  },
};

// Initialize cron jobs
Object.entries(cronJobs).forEach(([name, job]) => {
  if (job.enabled) {
    cron.schedule(job.schedule, job.task);
    console.log(`Cron job '${name}' scheduled: ${job.schedule}`);
  }
});
```

## Email Queue System

### 1. Queue Implementation

#### Queue Structure

```javascript
const emailQueueSchema = new mongoose.Schema({
  to: { type: String, required: true },
  subject: { type: String, required: true },
  template: { type: String, required: true },
  data: { type: Object, default: {} },
  status: {
    type: String,
    enum: ["pending", "sent", "failed"],
    default: "pending",
  },
  retryCount: { type: Number, default: 0 },
  maxRetries: { type: Number, default: 3 },
  nextRetry: { type: Date },
  error: { type: String },
  createdAt: { type: Date, default: Date.now },
  sentAt: { type: Date },
});
```

#### Queue Processing

```javascript
const processEmailQueue = async () => {
  const pendingEmails = await EmailQueue.find({
    status: "pending",
    $or: [
      { nextRetry: { $exists: false } },
      { nextRetry: { $lte: new Date() } },
    ],
  }).limit(10);

  for (const emailJob of pendingEmails) {
    try {
      await sendEmail(emailJob);
      emailJob.status = "sent";
      emailJob.sentAt = new Date();
    } catch (error) {
      emailJob.retryCount += 1;
      if (emailJob.retryCount >= emailJob.maxRetries) {
        emailJob.status = "failed";
      } else {
        emailJob.nextRetry = new Date(Date.now() + emailJob.retryCount * 60000);
      }
      emailJob.error = error.message;
    }
    await emailJob.save();
  }
};

// Process queue every minute
cron.schedule("* * * * *", processEmailQueue);
```

### 2. Email Rate Limiting

#### Rate Limits

- Maximum 100 emails per hour
- Maximum 10 emails per minute
- Bulk email operations throttled

```javascript
const rateLimiter = {
  hourlyCount: 0,
  minuteCount: 0,
  lastHourReset: new Date(),
  lastMinuteReset: new Date(),

  canSendEmail() {
    const now = new Date();

    // Reset hourly counter
    if (now - this.lastHourReset >= 3600000) {
      this.hourlyCount = 0;
      this.lastHourReset = now;
    }

    // Reset minute counter
    if (now - this.lastMinuteReset >= 60000) {
      this.minuteCount = 0;
      this.lastMinuteReset = now;
    }

    return this.hourlyCount < 100 && this.minuteCount < 10;
  },

  incrementCount() {
    this.hourlyCount++;
    this.minuteCount++;
  },
};
```

## Email Service Functions

### 1. Core Email Functions

#### Send Email Function

```javascript
const sendEmail = async (options) => {
  try {
    if (!rateLimiter.canSendEmail()) {
      throw new Error("Rate limit exceeded");
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: await renderTemplate(options.template, options.data),
      text: await renderTextTemplate(options.template, options.data),
    };

    const result = await transporter.sendMail(mailOptions);
    rateLimiter.incrementCount();

    console.log(`Email sent to ${options.to}: ${result.messageId}`);
    return result;
  } catch (error) {
    console.error(`Failed to send email to ${options.to}:`, error);
    throw error;
  }
};
```

#### Bulk Email Function

```javascript
const sendBulkEmail = async (recipients, template, data) => {
  const batchSize = 10;
  const batches = [];

  for (let i = 0; i < recipients.length; i += batchSize) {
    batches.push(recipients.slice(i, i + batchSize));
  }

  for (const batch of batches) {
    const promises = batch.map((recipient) =>
      EmailQueue.create({
        to: recipient.email,
        subject: data.subject,
        template: template,
        data: { ...data, username: recipient.username },
      })
    );

    await Promise.all(promises);

    // Wait between batches to respect rate limits
    await new Promise((resolve) => setTimeout(resolve, 6000));
  }
};
```

### 2. Template Rendering

#### HTML Template Rendering

```javascript
const renderTemplate = async (templateName, data) => {
  const templatePath = path.join(
    __dirname,
    "../views/emails",
    `${templateName}.ejs`
  );
  const template = await fs.readFile(templatePath, "utf8");
  return ejs.render(template, data);
};
```

#### Text Template Rendering

```javascript
const renderTextTemplate = async (templateName, data) => {
  const templatePath = path.join(
    __dirname,
    "../views/emails/text",
    `${templateName}.txt`
  );
  try {
    const template = await fs.readFile(templatePath, "utf8");
    return ejs.render(template, data);
  } catch (error) {
    // Fallback to HTML-to-text conversion
    const html = await renderTemplate(templateName, data);
    return htmlToText(html, {
      wordwrap: 80,
      preserveNewlines: true,
    });
  }
};
```

## User Notification Preferences

### 1. Notification Settings

#### User Preferences Schema

```javascript
const notificationPreferences = {
  emailNotifications: { type: Boolean, default: true },
  eventReminders: { type: Boolean, default: true },
  clubUpdates: { type: Boolean, default: true },
  recruitmentUpdates: { type: Boolean, default: true },
  weeklyDigest: { type: Boolean, default: false },
  marketingEmails: { type: Boolean, default: false },
};
```

#### Preference Management

```javascript
const updateNotificationPreferences = async (userId, preferences) => {
  await User.findByIdAndUpdate(
    userId,
    { $set: { notificationPreferences: preferences } },
    { new: true }
  );
};

const canSendNotification = (user, notificationType) => {
  if (!user.emailVerified || !user.notificationPreferences.emailNotifications) {
    return false;
  }

  return user.notificationPreferences[notificationType] !== false;
};
```

### 2. Unsubscribe System

#### Unsubscribe Token Generation

```javascript
const generateUnsubscribeToken = (userId, notificationType) => {
  const payload = {
    userId: userId.toString(),
    type: notificationType,
    exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
  };

  return jwt.sign(payload, process.env.JWT_SECRET);
};
```

#### Unsubscribe Handler

```javascript
const handleUnsubscribe = async (req, res) => {
  try {
    const { token } = req.query;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    await User.findByIdAndUpdate(decoded.userId, {
      [`notificationPreferences.${decoded.type}`]: false,
    });

    res.render("unsubscribe-success", { type: decoded.type });
  } catch (error) {
    res.render("unsubscribe-error");
  }
};
```

## Monitoring & Analytics

### 1. Email Metrics

#### Delivery Tracking

```javascript
const emailMetrics = {
  sent: 0,
  failed: 0,
  bounced: 0,
  opened: 0,
  clicked: 0,
};

const trackEmailEvent = async (type, emailId, metadata = {}) => {
  await EmailAnalytics.create({
    emailId,
    event: type,
    timestamp: new Date(),
    metadata,
  });

  emailMetrics[type]++;
};
```

#### Performance Monitoring

```javascript
const getEmailStats = async (dateRange) => {
  const stats = await EmailQueue.aggregate([
    {
      $match: {
        createdAt: {
          $gte: dateRange.start,
          $lte: dateRange.end,
        },
      },
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        avgRetries: { $avg: "$retryCount" },
      },
    },
  ]);

  return stats;
};
```

### 2. Error Handling & Logging

#### Error Logging

```javascript
const logEmailError = async (error, emailData) => {
  console.error("Email error:", {
    error: error.message,
    stack: error.stack,
    email: emailData,
    timestamp: new Date(),
  });

  // Save to database for analysis
  await EmailError.create({
    error: error.message,
    emailData,
    timestamp: new Date(),
  });
};
```

#### Health Checks

```javascript
const checkEmailHealth = async () => {
  const recentFailures = await EmailQueue.countDocuments({
    status: "failed",
    createdAt: { $gte: new Date(Date.now() - 3600000) }, // Last hour
  });

  const failureRate = recentFailures / 100; // Assuming 100 emails per hour max

  if (failureRate > 0.1) {
    // 10% failure rate threshold
    await sendAdminAlert("High email failure rate detected");
  }
};
```

## Troubleshooting

### Common Issues

#### SMTP Authentication Errors

```
Error: Invalid login: 535-5.7.8 Username and Password not accepted
Solution: Use app-specific password, enable 2FA on Gmail account
```

#### Rate Limiting

```
Error: 550 5.4.5 Daily sending quota exceeded
Solution: Implement proper rate limiting, consider using SendGrid/Mailgun
```

#### Template Rendering Errors

```
Error: Could not open file for reading
Solution: Check template file paths and permissions
```

#### Delivery Issues

```
Error: Recipient address rejected
Solution: Validate email addresses, handle bounces properly
```

### Performance Optimization

#### Email Queue Optimization

- Use database indexing on status and nextRetry fields
- Implement proper batch processing
- Monitor queue size and processing time
- Set up queue cleanup for old processed emails

#### Template Caching

- Cache compiled templates in memory
- Use template versioning for cache invalidation
- Optimize image sizes and inline CSS

---

## Configuration Examples

### Development Configuration

```env
EMAIL_USER=dev@example.com
EMAIL_PASS=dev-app-password
EMAIL_FROM="Dev Portal <dev@example.com>"
BASE_URL=http://localhost:3000
ENABLE_EMAIL_QUEUE=false
ENABLE_CRON_JOBS=false
```

### Production Configuration

```env
EMAIL_USER=noreply@yourportal.com
EMAIL_PASS=secure-app-password
EMAIL_FROM="Event Portal <noreply@yourportal.com>"
BASE_URL=https://yourportal.com
ENABLE_EMAIL_QUEUE=true
ENABLE_CRON_JOBS=true
EMAIL_RATE_LIMIT_HOUR=500
EMAIL_RATE_LIMIT_MINUTE=20
```

## Related Documentation

- [Environment Configuration](ENVIRONMENT_CONFIGURATION.md)
- [Authentication & Security](AUTHENTICATION_SECURITY.md)
- [User Guide](USER_GUIDE.md)
- [Troubleshooting Guide](TROUBLESHOOTING.md)
