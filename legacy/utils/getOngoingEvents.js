import Event from "../models/event.model.js";
const today = Date.now();
export const getOngoingEvents = async () => {
  const events = await Event.find({
    endDate: { $gte: today },
    startDate: { $lte: today },
  });
  return events;
};
