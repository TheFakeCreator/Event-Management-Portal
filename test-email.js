// Test script to debug email sending
import dotenv from "dotenv";
dotenv.config();

import transporter from "./configs/nodemailer.js";

console.log("Environment variables check:");
console.log("EMAIL_USER:", process.env.EMAIL_USER ? "Set" : "Not set");
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "Set" : "Not set");

const testEmailSending = async () => {
  try {
    console.log("\nTesting email configuration...");

    // First, verify the transporter configuration
    await transporter.verify();
    console.log("✅ Transporter configuration is valid");

    // Test sending an email
    const testEmail = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Send to self for testing
      subject: "Test Email - Event Management Portal",
      html: `
        <h4>Test Email</h4>
        <p>This is a test email from the Event Management Portal to verify email functionality.</p>
        <p>If you receive this, email sending is working correctly!</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      `,
    };

    console.log("\nSending test email...");
    const result = await transporter.sendMail(testEmail);
    console.log("✅ Email sent successfully!");
    console.log("Message ID:", result.messageId);
    console.log("Response:", result.response);
  } catch (error) {
    console.error("❌ Email sending failed:");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    console.error("Error command:", error.command);

    if (error.code === "EAUTH") {
      console.log("\n🔧 Authentication failed. This usually means:");
      console.log("1. The email/password combination is incorrect");
      console.log(
        "2. You need to use an App Password instead of your regular password"
      );
      console.log("3. 2-factor authentication needs to be enabled on Gmail");
    }
  }
};

testEmailSending();
