import Event from "../models/event.js";
import Attendee from "../models/attendee.js";

const ensureEventAccess = (event, user) => {
  if (!event) return { ok: false, status: 404, message: "Event not found" };
  if (event.organizer.toString() !== user._id.toString() && user.role !== "admin") {
    return { ok: false, status: 403, message: "Not authorized for this event" };
  }
  return { ok: true };
};

export const listEventAttendees = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { page = 1, limit = 25, search, status } = req.query;

    const event = await Event.findById(eventId);
    const access = ensureEventAccess(event, req.user);
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));
    const skip = (parsedPage - 1) * parsedLimit;

    const query = { event: event._id };
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } }
      ];
    }

    const attendees = await Attendee.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit);

    const total = await Attendee.countDocuments(query);

    return res.json({
      attendees,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        pages: Math.ceil(total / parsedLimit)
      }
    });
  } catch (error) {
    console.error("List attendees error:", error);
    return res.status(500).json({ message: "Error fetching attendees", error: error.message });
  }
};
