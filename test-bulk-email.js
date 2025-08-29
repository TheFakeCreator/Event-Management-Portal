// Test script for bulk email functionality
import dotenv from "dotenv";
dotenv.config();

import db from "./configs/mongoose-connect.js";
import { queueBulkEmails, processEmailQueue, getQueueStats } from "./utils/bulkEmailService.js";

const testBulkEmails = async () => {
  try {
    console.log("🧪 Testing Bulk Email System...\n");

    // Test data
    const testRecipients = [
      { email: "test1@example.com", name: "Test User 1" },
      { email: "test2@example.com", name: "Test User 2" },
      { email: "test3@example.com", name: "Test User 3" },
    ];

    const emailData = {
      title: "Test Announcement",
      message: "This is a test announcement to verify the bulk email system is working correctly.",
      postedBy: "Test Admin",
      timestamp: new Date(),
    };

    // Queue test emails
    console.log("📧 Queueing test emails...");
    const result = await queueBulkEmails(
      testRecipients,
      "Test Announcement: Bulk Email System",
      "announcement",
      emailData,
      { priority: "high" }
    );

    console.log("✅ Queuing result:", result);

    // Check queue stats
    console.log("\n📊 Queue stats before processing:");
    const statsBefore = await getQueueStats();
    console.log(JSON.stringify(statsBefore, null, 2));

    // Process the queue
    console.log("\n⚙️ Processing email queue...");
    const processResult = await processEmailQueue();
    console.log("✅ Processing result:", processResult);

    // Check queue stats after processing
    console.log("\n📊 Queue stats after processing:");
    const statsAfter = await getQueueStats();
    console.log(JSON.stringify(statsAfter, null, 2));

    console.log("\n🎉 Test completed! Check your email queue dashboard for details.");

  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    process.exit(0);
  }
};

// Run the test
testBulkEmails();
