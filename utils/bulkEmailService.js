import EmailQueue from "../models/emailQueue.model.js";
import transporter from "../configs/nodemailer.js";
import ejs from "ejs";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rate limiting configuration
const rateLimiter = {
  hourlyCount: 0,
  minuteCount: 0,
  lastHourReset: new Date(),
  lastMinuteReset: new Date(),
  maxPerHour: process.env.EMAIL_RATE_LIMIT_HOUR || 500,
  maxPerMinute: process.env.EMAIL_RATE_LIMIT_MINUTE || 10,

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

    return this.hourlyCount < this.maxPerHour && this.minuteCount < this.maxPerMinute;
  },

  incrementCount() {
    this.hourlyCount++;
    this.minuteCount++;
  },

  getWaitTime() {
    const now = new Date();
    if (this.minuteCount >= this.maxPerMinute) {
      return 60000 - (now - this.lastMinuteReset);
    }
    return 0;
  }
};

// Template rendering function
const renderEmailTemplate = async (templateName, data) => {
  try {
    // Fix path resolution - go up from utils to root, then to views/emails
    const templatePath = path.join(__dirname, "..", "views", "emails", `${templateName}.ejs`);
    const template = await fs.readFile(templatePath, "utf8");
    return ejs.render(template, data);
  } catch (error) {
    console.error(`Error rendering template ${templateName}:`, error);
    console.error(`Attempted path: ${path.join(__dirname, "..", "views", "emails", `${templateName}.ejs`)}`);
    // Fallback to basic template
    return `
      <h2>${data.subject}</h2>
      <p>${data.message || 'No message content available'}</p>
      <br>
      <p>Best regards,<br>Event Management Portal Team</p>
    `;
  }
};

// Core email sending function
export const sendEmail = async (to, subject, template, data = {}) => {
  try {
    if (!rateLimiter.canSendEmail()) {
      const waitTime = rateLimiter.getWaitTime();
      throw new Error(`Rate limit exceeded. Wait ${Math.ceil(waitTime / 1000)} seconds.`);
    }

    const htmlContent = await renderEmailTemplate(template, { ...data, subject });
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: to,
      subject: subject,
      html: htmlContent,
    };

    const result = await transporter.sendMail(mailOptions);
    rateLimiter.incrementCount();

    console.log(`✅ Email sent to ${to}: ${result.messageId}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    throw error;
  }
};

// Queue email for bulk sending
export const queueEmail = async (emailData) => {
  try {
    const emailJob = new EmailQueue({
      to: emailData.to.trim().toLowerCase(),
      subject: emailData.subject,
      template: emailData.template || 'default',
      data: emailData.data || {},
      priority: emailData.priority || 'normal',
      batchId: emailData.batchId,
    });

    await emailJob.save();
    console.log(`📧 Email queued for ${emailData.to}`);
    return emailJob;
  } catch (error) {
    console.error('Error queuing email:', error);
    throw error;
  }
};

// Bulk email queueing function
export const queueBulkEmails = async (recipients, subject, template, data = {}, options = {}) => {
  try {
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const priority = options.priority || 'normal';
    
    console.log(`📬 Queueing ${recipients.length} emails for batch: ${batchId}`);

    const emailJobs = recipients.map(recipient => ({
      to: recipient.email.trim().toLowerCase(),
      subject: subject,
      template: template,
      data: {
        ...data,
        username: recipient.name || recipient.username || 'User',
        ...recipient.customData,
      },
      priority: priority,
      batchId: batchId,
    }));

    // Insert emails in batches to avoid memory issues
    const insertBatchSize = 100;
    let totalQueued = 0;

    for (let i = 0; i < emailJobs.length; i += insertBatchSize) {
      const batch = emailJobs.slice(i, i + insertBatchSize);
      await EmailQueue.insertMany(batch);
      totalQueued += batch.length;
      console.log(`📧 Queued ${totalQueued}/${emailJobs.length} emails...`);
    }

    console.log(`✅ Successfully queued ${totalQueued} emails with batch ID: ${batchId}`);
    return { 
      success: true, 
      batchId, 
      totalQueued,
      message: `${totalQueued} emails queued for sending`
    };
  } catch (error) {
    console.error('Error queueing bulk emails:', error);
    throw error;
  }
};

// Process email queue
export const processEmailQueue = async () => {
  try {
    // Get pending emails, prioritizing high priority and older emails
    const pendingEmails = await EmailQueue.find({
      status: "pending",
      $or: [
        { nextRetry: { $exists: false } },
        { nextRetry: { $lte: new Date() } },
      ],
    })
    .sort({ priority: -1, createdAt: 1 })
    .limit(10); // Process in small batches

    if (pendingEmails.length === 0) {
      return { processed: 0, message: "No pending emails" };
    }

    let processed = 0;
    let sent = 0;
    let failed = 0;

    for (const emailJob of pendingEmails) {
      try {
        // Check rate limits
        if (!rateLimiter.canSendEmail()) {
          console.log("⏳ Rate limit reached, pausing queue processing");
          break;
        }

        // Mark as processing
        emailJob.status = "processing";
        emailJob.processedAt = new Date();
        await emailJob.save();

        // Send the email
        await sendEmail(emailJob.to, emailJob.subject, emailJob.template, emailJob.data);

        // Mark as sent
        emailJob.status = "sent";
        emailJob.sentAt = new Date();
        await emailJob.save();

        sent++;
        processed++;

        // Small delay between emails to be respectful
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Failed to send email to ${emailJob.to}:`, error.message);

        emailJob.retryCount += 1;
        emailJob.error = error.message;

        if (emailJob.retryCount >= emailJob.maxRetries) {
          emailJob.status = "failed";
          failed++;
        } else {
          emailJob.status = "pending";
          // Exponential backoff: 5min, 15min, 45min
          const backoffMinutes = Math.pow(3, emailJob.retryCount) * 5;
          emailJob.nextRetry = new Date(Date.now() + backoffMinutes * 60000);
        }

        await emailJob.save();
        processed++;
      }
    }

    const result = { 
      processed, 
      sent, 
      failed, 
      remaining: await EmailQueue.countDocuments({ status: "pending" }),
      message: `Processed ${processed} emails (${sent} sent, ${failed} failed)`
    };

    if (processed > 0) {
      console.log(`📊 Queue processing: ${result.message}`);
    }

    return result;
  } catch (error) {
    console.error("Error processing email queue:", error);
    throw error;
  }
};

// Get queue statistics
export const getQueueStats = async () => {
  try {
    const stats = await EmailQueue.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          avgRetries: { $avg: "$retryCount" },
        },
      },
    ]);

    const recentActivity = await EmailQueue.find({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }).countDocuments();

    return {
      statusBreakdown: stats,
      recentActivity,
      rateLimit: {
        hourlyCount: rateLimiter.hourlyCount,
        minuteCount: rateLimiter.minuteCount,
        maxPerHour: rateLimiter.maxPerHour,
        maxPerMinute: rateLimiter.maxPerMinute,
      }
    };
  } catch (error) {
    console.error("Error getting queue stats:", error);
    throw error;
  }
};

// Clean up old processed emails
export const cleanupOldEmails = async (daysOld = 30) => {
  try {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    
    const result = await EmailQueue.deleteMany({
      status: { $in: ["sent", "failed"] },
      $or: [
        { sentAt: { $lt: cutoffDate } },
        { processedAt: { $lt: cutoffDate } }
      ]
    });

    console.log(`🧹 Cleaned up ${result.deletedCount} old email records`);
    return result;
  } catch (error) {
    console.error("Error cleaning up old emails:", error);
    throw error;
  }
};
