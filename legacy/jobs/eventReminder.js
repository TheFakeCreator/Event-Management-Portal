import cron from "node-cron";
import Event from "../models/event.model.js";
import EventRegistration from "../models/eventRegistration.model.js";
import sendEmail from "../utils/sendEmail.js";

// Run every hour
cron.schedule("0 * * * *", async () => {
  console.log("[Event Reminder] Checking for upcoming event reminders...");
  const now = new Date();
  // Calculate 24-hour reminder window (1-hour span)
  const windowStart = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const windowEnd = new Date(windowStart.getTime() + 60 * 60 * 1000);

  // Limit query to events on the target date (next day)
  const tomorrowStart = new Date(
    windowStart.getFullYear(),
    windowStart.getMonth(),
    windowStart.getDate()
  );
  const tomorrowEnd = new Date(tomorrowStart.getTime() + 24 * 60 * 60 * 1000);
  const upcomingEvents = await Event.find({
    startDate: { $gte: tomorrowStart, $lt: tomorrowEnd },
  });

  for (const event of upcomingEvents) {
    // Combine date and time to a full Date object
    const [hour, minute] = event.startTime.split(":").map(Number);
    const eventDateTime = new Date(event.startDate);
    eventDateTime.setHours(hour, minute, 0, 0);
    // Check if the event is starting within the 24h ±1h window
    if (eventDateTime >= windowStart && eventDateTime < windowEnd) {
      const registrations = await EventRegistration.find({ event: event._id });
      for (const reg of registrations) {
        await sendEmail(
          reg.email,
          `Reminder: ${event.title} starts in 24 hours!`,
          `Hello ${reg.name},\n\nThis is a reminder that the event "${
            event.title
          }" will start at ${
            event.startTime
          } on ${eventDateTime.toLocaleString()}.\n\nLocation: ${
            event.location
          }\n\nEvent Details: ${
            event.description
          }\n\nSee you there!\n\n- Event Management Portal`
        );
      }
    }
  }
  console.log("[Event Reminder] 24h reminders sent.");

  // Short-term reminders for events starting in 2–3 hours
  const window2Start = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const window2End = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  const shortTermEvents = await Event.find({});
  for (const event of shortTermEvents) {
    const [h2, m2] = event.startTime.split(":").map(Number);
    const eventDateTime2 = new Date(event.startDate);
    eventDateTime2.setHours(h2, m2, 0, 0);
    if (eventDateTime2 >= window2Start && eventDateTime2 < window2End) {
      const regs2 = await EventRegistration.find({ event: event._id });
      for (const reg2 of regs2) {
        await sendEmail(
          reg2.email,
          `Reminder: ${event.title} starts soon!`,
          `Hello ${reg2.name},\n\nThis is a reminder that the event "${
            event.title
          }" will start at ${
            event.startTime
          } on ${eventDateTime2.toLocaleString()}.\n\nLocation: ${
            event.location
          }\n\nEvent Details: ${
            event.description
          }\n\nSee you soon!\n\n- Event Management Portal`
        );
      }
    }
  }
  console.log("[Event Reminder] 2–3h reminders sent.");
});
