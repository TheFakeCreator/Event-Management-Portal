import cron from "node-cron";
import Event from "../models/event.model.js"; 
import sendEmail from "../utils/sendEmail.js";

cron.schedule("0 * * * *", async () => {
  console.log("Checking for upcoming event reminders...");

  const upcomingEvents = await Event.find({
    date: { $gte: new Date(), $lte: new Date(Date.now() + 24 * 60 * 60 * 1000) } // Next 24 hours
  });

  for (const event of upcomingEvents) {
    for (const userEmail of event.registeredUsers) {
      await sendEmail(
        userEmail,
        `Reminder: ${event.name} is tomorrow!`,
        `Hey, don't forget! ${event.name} is happening on ${event.date.toDateString()}.\n\nEvent Details:\n${event.description}`
      );
    }
  }

  console.log("Event reminders sent successfully!");
});
