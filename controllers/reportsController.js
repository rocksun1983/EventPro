import Event from "../models/event.js";
import Attendee from "../models/attendee.js";
import AttendeeCheckin from "../models/attendeeCheckin.js";
import User from "../models/user.js";

const ensureEventAccess = (event, user) => {
  if (!event) return { ok: false, status: 404, message: "Event not found" };
  if (event.organizer.toString() !== user._id.toString() && user.role !== "admin") {
    return { ok: false, status: 403, message: "Not authorized for this event" };
  }
  return { ok: true };
};

const getMonthlyLabels = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const labels = [];
  const keys = [];
  for (let i = 0; i < 12; i += 1) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    labels.push(d.toLocaleString("en-US", { month: "short" }));
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return { labels, keys, start, now };
};

export const getReportSummary = async (req, res) => {
  try {
    const { eventId } = req.query;
    if (!eventId) {
      return res.status(400).json({ message: "eventId is required" });
    }

    const event = await Event.findById(eventId);
    const access = ensureEventAccess(event, req.user);
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    const organizer = await User.findById(event.organizer).select("firstName lastName");
    const organizerName = organizer ? `${organizer.firstName || ""} ${organizer.lastName || ""}`.trim() : "";

    const totalAttendees = await Attendee.countDocuments({ event: event._id });
    const vipTickets = await Attendee.countDocuments({
      event: event._id,
      ticketType: { $regex: /^vip$/i }
    });
    const regularTickets = await Attendee.countDocuments({
      event: event._id,
      ticketType: { $regex: /^regular$/i }
    });
    const checkedIn = await AttendeeCheckin.countDocuments({
      event: event._id,
      checkedInAt: { $ne: null }
    });
    const pending = Math.max(0, totalAttendees - checkedIn);

    return res.json({
      eventName: event.title || "",
      eventDate: event.date || null,
      organizerName,
      totalAttendees,
      vipTickets,
      regularTickets,
      checkedIn,
      pending
    });
  } catch (error) {
    console.error("Report summary error:", error);
    return res.status(500).json({ message: "Error fetching report summary", error: error.message });
  }
};

export const getReportTimeline = async (req, res) => {
  try {
    const { eventId } = req.query;
    if (!eventId) {
      return res.status(400).json({ message: "eventId is required" });
    }

    const event = await Event.findById(eventId);
    const access = ensureEventAccess(event, req.user);
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    const { labels, keys, start, now } = getMonthlyLabels();

    const registeredByMonth = await Attendee.aggregate([
      { $match: { event: event._id, createdAt: { $gte: start, $lte: now } } },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          count: { $sum: 1 }
        }
      }
    ]);

    const checkedInByMonth = await AttendeeCheckin.aggregate([
      { $match: { event: event._id, checkedInAt: { $ne: null, $gte: start, $lte: now } } },
      {
        $group: {
          _id: { year: { $year: "$checkedInAt" }, month: { $month: "$checkedInAt" } },
          count: { $sum: 1 }
        }
      }
    ]);

    const toKey = (item) => `${item._id.year}-${String(item._id.month).padStart(2, "0")}`;
    const registeredMap = new Map(registeredByMonth.map((item) => [toKey(item), item.count]));
    const checkedInMap = new Map(checkedInByMonth.map((item) => [toKey(item), item.count]));

    const total = keys.map((key) => registeredMap.get(key) || 0);
    const checkedIn = keys.map((key) => checkedInMap.get(key) || 0);

    return res.json({
      labels,
      total,
      checkedIn
    });
  } catch (error) {
    console.error("Report timeline error:", error);
    return res.status(500).json({ message: "Error fetching report timeline", error: error.message });
  }
};
