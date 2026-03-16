import Event from "../models/event.js";
import AttendeeCheckin from "../models/attendeeCheckin.js";

const getOrganizerStats = async (organizerId) => {
  const [totalEvents, upcomingEvents, completedEvents] = await Promise.all([
    Event.countDocuments({ organizer: organizerId }),
    Event.countDocuments({
      organizer: organizerId,
      date: { $gte: new Date() },
      status: { $in: ["draft", "published"] }
    }),
    Event.countDocuments({
      organizer: organizerId,
      status: "completed"
    })
  ]);

  const eventIds = await Event.find({ organizer: organizerId }).select("_id");
  const ids = eventIds.map((event) => event._id);
  const totalCheckins = ids.length > 0
    ? await AttendeeCheckin.countDocuments({ event: { $in: ids } })
    : 0;

  return { totalEvents, upcomingEvents, completedEvents, totalCheckins };
};

export const getOrganizerDashboardStats = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "organizer") {
      return res.status(403).json({ message: "Not authorized as an organizer" });
    }

    const stats = await getOrganizerStats(req.user._id);
    res.setHeader("Cache-Control", "no-store");
    return res.json(stats);
  } catch (error) {
    console.error("Get organizer dashboard stats error:", error);
    return res.status(500).json({ message: "Error fetching organizer dashboard stats", error: error.message });
  }
};

export const streamOrganizerDashboardStats = async (req, res) => {
  if (!req.user || req.user.role !== "organizer") {
    return res.status(403).json({ message: "Not authorized as an organizer" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  let closed = false;
  const sendStats = async () => {
    if (closed) return;
    try {
      const stats = await getOrganizerStats(req.user._id);
      res.write(`data: ${JSON.stringify(stats)}\n\n`);
    } catch (error) {
      res.write(`event: error\ndata: ${JSON.stringify({ message: "Stats error" })}\n\n`);
    }
  };

  await sendStats();
  const interval = setInterval(sendStats, 3000);

  req.on("close", () => {
    closed = true;
    clearInterval(interval);
  });
};
