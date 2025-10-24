import Event from "../models/event.model.js";
const today = Date.now();
export const getUpcomingEvents = async () => {
  const events = await Event.find({
    endDate: { $gte: today },
    startDate: { $gte: today },
  });
  return events;
};
