import Event from "../models/event.js";
import Attendee from "../models/attendee.js"; // For event registration
import User from "../models/user.js"; // For save/unsave event functionality

// --------------------
// Event CRUD
// --------------------

// Create Event
export const createEvent = async (req, res) => {
  try {
    const { title, description, date, location, expectedAttendees, status } = req.body;

    if (!title || !date || !location) {
      return res.status(400).json({
        message: "Missing required fields: title, date, and location are required"
      });
    }

    const eventDate = new Date(date);
    if (eventDate <= new Date()) {
      return res.status(400).json({ message: "Event date must be in the future" });
    }

    const eventData = {
      title: title.trim(),
      description: description?.trim(),
      date: eventDate,
      location: location.trim(),
      expectedAttendees: expectedAttendees || 0,
      status: status || "draft",
      organizer: req.user._id
    };

    const event = await Event.create(eventData);
    await event.populate("organizer", "name email");

    res.status(201).json({ message: "Event created successfully", event });
  } catch (error) {
    console.error("Create event error:", error);
    res.status(500).json({ message: "Error creating event", error: error.message });
  }
};

// Get Events
export const getEvents = async (req, res) => {
  try {
    const { status, organizer, upcoming, limit = 10, page = 1 } = req.query;
    let query = {};

    if (status) query.status = status;
    if (organizer) query.organizer = organizer;
    if (upcoming === "true") {
      query.date = { $gte: new Date() };
      query.status = { $in: ["draft", "published"] };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const events = await Event.find(query)
      .populate("organizer", "name email")
      .sort({ date: 1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Event.countDocuments(query);

    res.json({
      events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("Get events error:", error);
    res.status(500).json({ message: "Error fetching events", error: error.message });
  }
};

// Get Event By ID
export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate("organizer", "name email");
    if (!event) return res.status(404).json({ message: "Event not found" });

    res.json(event);
  } catch (error) {
    console.error("Get event error:", error);
    res.status(500).json({ message: "Error fetching event", error: error.message });
  }
};

// Update Event
export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to update this event" });
    }

    const { title, description, date, location, expectedAttendees, status } = req.body;

    if (date) {
      const eventDate = new Date(date);
      if (eventDate <= new Date() && status !== "completed") {
        return res.status(400).json({ message: "Event date must be in the future" });
      }
      event.date = eventDate;
    }

    if (title !== undefined) event.title = title.trim();
    if (description !== undefined) event.description = description?.trim();
    if (location !== undefined) event.location = location.trim();
    if (expectedAttendees !== undefined) event.expectedAttendees = expectedAttendees;
    if (status !== undefined) event.status = status;

    await event.save();
    await event.populate("organizer", "name email");

    res.json({ message: "Event updated successfully", event });
  } catch (error) {
    console.error("Update event error:", error);
    res.status(500).json({ message: "Error updating event", error: error.message });
  }
};

// Delete Event
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to delete this event" });
    }

    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Delete event error:", error);
    res.status(500).json({ message: "Error deleting event", error: error.message });
  }
};

// Get My Events (Organizer)
export const getMyEvents = async (req, res) => {
  try {
    const { status, upcoming, limit = 10, page = 1 } = req.query;
    let query = { organizer: req.user._id };

    if (status) query.status = status;
    if (upcoming === "true") {
      query.date = { $gte: new Date() };
      query.status = { $in: ["draft", "published"] };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const events = await Event.find(query)
      .sort({ date: 1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Event.countDocuments(query);

    res.json({
      events,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    console.error("Get my events error:", error);
    res.status(500).json({ message: "Error fetching your events", error: error.message });
  }
};

// --------------------
// Attendee Self-Registration / Event Registration
// --------------------
export const registerForEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user._id;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const existingAttendee = await Attendee.findOne({ event: eventId, user: userId });
    if (existingAttendee) return res.status(400).json({ message: "You are already registered for this event" });

    const attendee = await Attendee.create({
      event: eventId,
      user: userId,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      phone: req.user.phone || "",
      registeredAt: new Date()
    });

    res.status(201).json({ message: "Successfully registered for the event", attendee });
  } catch (error) {
    console.error("Register for event error:", error);
    res.status(500).json({ message: "Error registering for event", error: error.message });
  }
};

// --------------------
// Save / Unsave Event for User
// --------------------
export const saveEvent = async (req, res) => {
  try {
    const userId = req.user._id;
    const eventId = req.params.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.savedEvents) user.savedEvents = [];
    if (user.savedEvents.includes(eventId)) return res.status(400).json({ message: "Event already saved" });

    user.savedEvents.push(eventId);
    await user.save();

    res.json({ message: "Event saved successfully", savedEvents: user.savedEvents });
  } catch (error) {
    console.error("Save event error:", error);
    res.status(500).json({ message: "Error saving event", error: error.message });
  }
};

export const unsaveEvent = async (req, res) => {
  try {
    const userId = req.user._id;
    const eventId = req.params.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.savedEvents || !user.savedEvents.includes(eventId)) {
      return res.status(400).json({ message: "Event not saved yet" });
    }

    user.savedEvents = user.savedEvents.filter(e => e.toString() !== eventId);
    await user.save();

    res.json({ message: "Event removed from saved list", savedEvents: user.savedEvents });
  } catch (error) {
    console.error("Unsave event error:", error);
    res.status(500).json({ message: "Error unsaving event", error: error.message });
  }
};