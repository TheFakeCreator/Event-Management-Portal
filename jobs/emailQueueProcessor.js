import cron from "node-cron";
import { processEmailQueue, cleanupOldEmails, getQueueStats } from "../utils/bulkEmailService.js";

console.log("📧 Initializing email queue processor...");

// Process email queue every minute
cron.schedule("* * * * *", async () => {
  try {
    await processEmailQueue();
  } catch (error) {
    console.error("Error in email queue processing cron job:", error);
  }
});

// Queue statistics logging every 10 minutes
cron.schedule("*/10 * * * *", async () => {
  try {
    const stats = await getQueueStats();
    if (stats.statusBreakdown.length > 0 || stats.recentActivity > 0) {
      console.log("📊 Email Queue Stats:", {
        statusBreakdown: stats.statusBreakdown,
        recentActivity: stats.recentActivity,
        rateLimit: `${stats.rateLimit.hourlyCount}/${stats.rateLimit.maxPerHour} hourly, ${stats.rateLimit.minuteCount}/${stats.rateLimit.maxPerMinute} per minute`
      });
    }
  } catch (error) {
    console.error("Error getting queue stats:", error);
  }
});

// Clean up old emails daily at 3:00 AM
cron.schedule("0 3 * * *", async () => {
  try {
    console.log("🧹 Running daily email cleanup...");
    await cleanupOldEmails(30); // Remove emails older than 30 days
  } catch (error) {
    console.error("Error in email cleanup cron job:", error);
  }
});

console.log("✅ Email queue processor cron jobs initialized");
console.log("   - Queue processing: Every minute");
console.log("   - Statistics logging: Every 10 minutes"); 
console.log("   - Cleanup: Daily at 3:00 AM");
