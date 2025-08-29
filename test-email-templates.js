// Test script for email template rendering
import dotenv from "dotenv";
dotenv.config();

import { fileURLToPath } from "url";
import path from "path";
import ejs from "ejs";
import fs from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testEmailTemplate = async () => {
  try {
    console.log("🧪 Testing Email Template Rendering...\n");

    // Test data
    const testData = {
      subject: "Test Announcement",
      title: "Welcome to Our Test Announcement",
      message: "This is a test message to verify our email templates are working correctly.\n\nThis is a multi-line message with proper formatting.",
      clubName: "Test Club",
      postedBy: "Test Admin",
      timestamp: new Date(),
      username: "Test User"
    };

    // Test announcement template
    console.log("📧 Testing announcement template...");
    const announcementPath = path.join(__dirname, "views", "emails", "announcement.ejs");
    console.log("Template path:", announcementPath);
    
    const announcementTemplate = await fs.readFile(announcementPath, "utf8");
    const announcementHtml = ejs.render(announcementTemplate, testData);
    
    console.log("✅ Announcement template rendered successfully!");
    console.log("Length:", announcementHtml.length, "characters");

    // Test default template
    console.log("\n📧 Testing default template...");
    const defaultPath = path.join(__dirname, "views", "emails", "default.ejs");
    console.log("Template path:", defaultPath);
    
    const defaultTemplate = await fs.readFile(defaultPath, "utf8");
    const defaultHtml = ejs.render(defaultTemplate, testData);
    
    console.log("✅ Default template rendered successfully!");
    console.log("Length:", defaultHtml.length, "characters");

    // Save test outputs for inspection
    await fs.writeFile("test-announcement-output.html", announcementHtml);
    await fs.writeFile("test-default-output.html", defaultHtml);
    
    console.log("\n📁 Test HTML files saved:");
    console.log("- test-announcement-output.html");
    console.log("- test-default-output.html");
    
    console.log("\n🎉 All email templates rendered successfully!");

  } catch (error) {
    console.error("❌ Template test failed:", error);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
  }
};

// Run the test
testEmailTemplate();
