# Bulk Email Notification System - Implementation Guide

## Overview

Your Event Management Portal now has a comprehensive bulk email notification system that can handle sending thousands of notifications efficiently and reliably.

## ✅ What's Implemented

### 1. **Email Queue System**
- **Database Model**: `EmailQueue` model to store and track all emails
- **Rate Limiting**: Configurable limits (500/hour, 10/minute by default)
- **Retry Logic**: Automatic retry with exponential backoff for failed emails
- **Priority Support**: High, normal, and low priority email processing

### 2. **Bulk Email Service**
- **Queue Management**: `queueBulkEmails()` function for mass email queuing
- **Background Processing**: Automatic email processing every minute
- **Statistics Tracking**: Monitor sent, failed, and pending emails
- **Cleanup Jobs**: Automatic removal of old emails

### 3. **Announcement Notifications**
- **Club Announcements**: Automatic notifications to club members
- **General Announcements**: Notifications to all opted-in users
- **User Preferences**: Granular notification preferences per user
- **Email Templates**: Beautiful, responsive email templates

### 4. **Admin Dashboard**
- **Queue Monitoring**: Real-time stats and email status tracking
- **Failed Email Management**: Retry failed emails with one click
- **Cleanup Tools**: Remove old emails to maintain performance
- **Rate Limit Monitoring**: Track current usage against limits

### 5. **User Preferences**
- **Notification Settings**: Users can control what emails they receive
- **Email Types**: Event reminders, club updates, general announcements, etc.
- **Master Toggle**: Users can disable all emails with one setting

## 🚀 How to Use

### For Club Announcements

When an admin creates an announcement, the system automatically:

1. **Identifies Recipients**:
   - Club announcements → Club members who want club updates
   - General announcements → All users who want general notifications

2. **Queues Emails**: 
   - Adds emails to the processing queue in batches
   - Uses beautiful HTML templates with club branding

3. **Processes Queue**:
   - Sends emails respecting rate limits
   - Retries failed emails automatically
   - Tracks all activity in the database

### For Event Notifications

The system can be easily extended for other bulk notifications:

```javascript
// Example: Event registration confirmation to all participants
import { queueBulkEmails } from "../utils/bulkEmailService.js";

const notifyEventParticipants = async (event, participants) => {
  await queueBulkEmails(
    participants, // Array of {email, name} objects
    `Event Update: ${event.title}`,
    'event-update', // Email template name
    {
      eventTitle: event.title,
      eventDate: event.date,
      message: "Important update about your registered event"
    },
    { priority: 'high' }
  );
};
```

## 📧 Email Templates

Templates are located in `views/emails/`:
- `announcement.ejs` - Club and general announcements
- `default.ejs` - Fallback template for any email
- Add more templates as needed (event reminders, welcome emails, etc.)

## ⚙️ Configuration

### Environment Variables

Add to your `.env` file:

```env
# Email rate limiting
EMAIL_RATE_LIMIT_HOUR=500
EMAIL_RATE_LIMIT_MINUTE=10

# Email queue settings
ENABLE_EMAIL_QUEUE=true
EMAIL_QUEUE_BATCH_SIZE=10

# Background jobs
ENABLE_CRON_JOBS=true
```

### Gmail Setup for Production

1. **Enable 2-Factor Authentication**
2. **Generate App Password**: Google Account → Security → App passwords
3. **Update Environment**:
   ```env
   EMAIL_USER=your-portal@gmail.com
   EMAIL_PASS=your_16_character_app_password
   EMAIL_FROM="Event Portal <noreply@yourportal.com>"
   ```

## 📊 Monitoring

### Admin Dashboard
Access at `/admin/email-queue` to:
- View real-time queue statistics
- Monitor rate limit usage
- Retry failed emails
- Clean up old records

### Queue Statistics
The system logs queue stats every 10 minutes showing:
- Emails by status (pending, sent, failed)
- Recent activity (last 24 hours)
- Current rate limit usage

## 🔧 Maintenance

### Automatic Cleanup
- **Daily at 3:00 AM**: Removes emails older than 30 days
- **Configurable**: Adjust retention period in cleanup function

### Manual Cleanup
Use admin dashboard to clean up emails older than:
- 7 days (for testing)
- 30 days (recommended)
- 60-90 days (for audit trails)

## 🚨 Troubleshooting

### Common Issues

1. **Emails Not Sending**:
   - Check Gmail app password is correct
   - Verify rate limits aren't exceeded
   - Check failed emails in admin dashboard

2. **Queue Processing Stopped**:
   - Restart the application
   - Check server logs for cron job errors
   - Verify database connection

3. **Rate Limit Exceeded**:
   - Increase limits in environment variables
   - Consider using a dedicated email service (SendGrid, etc.)

### Production Recommendations

1. **Use Dedicated Email Service**: For high volume (>1000 emails/day)
2. **Monitor Queue Size**: Keep pending emails under 1000
3. **Set Up Alerts**: Monitor failed email rates
4. **Regular Backups**: Include email queue data in backups

## 📈 Scaling Considerations

### Current Limits (Gmail SMTP)
- **Daily**: ~500 emails/day
- **Hourly**: 500 emails (configurable)
- **Per Minute**: 10 emails (configurable)

### For Higher Volume
Consider switching to:
- **SendGrid**: 100 emails/day free, then paid plans
- **Mailgun**: 5,000 emails/month free
- **Amazon SES**: $0.10 per 1,000 emails
- **Postmark**: Transactional email specialist

### Implementation for Other Services
The bulk email service is designed to easily switch providers by updating the `transporter` in `configs/nodemailer.js`.

## 🎯 Next Steps

1. **Test the System**: Run announcements with small groups first
2. **Monitor Performance**: Watch queue stats and processing times
3. **Gather User Feedback**: Ensure notification preferences work well
4. **Plan for Growth**: Consider email service upgrades as user base grows

## 💡 Tips

- **Start Small**: Test with 10-50 recipients first
- **Monitor Closely**: Watch the admin dashboard during first few announcements
- **User Education**: Let users know about notification preferences
- **Template Testing**: Send test emails to yourself to verify templates

The system is production-ready and will handle your announcement needs efficiently while providing excellent monitoring and management capabilities!
