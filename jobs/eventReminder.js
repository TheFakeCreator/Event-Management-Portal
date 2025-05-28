import cron from "node-cron";
import Event from "../models/event.model.js";
import EventRegistration from "../models/eventRegistration.model.js";
import sendEmail from "../utils/sendEmail.js";

// Run every hour
cron.schedule("0 * * * *", async () => {
  console.log("[Event Reminder] Checking for upcoming event reminders...");
  const now = new Date();
  const nextHour = new Date(now.getTime() + 60 * 60 * 1000);

  // Find events starting in the next hour
  const upcomingEvents = await Event.find({
    startDate: { $gte: now, $lte: nextHour }
  });

  for (const event of upcomingEvents) {
    // Get all registrations for this event
    const registrations = await EventRegistration.find({ event: event._id });
    for (const reg of registrations) {
      // Send reminder email
      await sendEmail(
        reg.email,
        `Reminder: ${event.title} is starting soon!`,
        `Hello ${reg.name},\n\nThis is a reminder that the event "${event.title}" is starting at ${event.startTime} on ${new Date(event.startDate).toLocaleDateString()}.\n\nLocation: ${event.location}\n\nEvent Details: ${event.description}\n\nSee you there!\n\n- Event Management Portal`
      );
    }
  }
  console.log("[Event Reminder] Event reminders sent for events starting in the next hour.");
});
