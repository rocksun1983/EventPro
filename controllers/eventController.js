import Event from "../models/event.js";

export const createEvent = async (req, res) => {
  try {
    const { title, description, date, location, expectedAttendees, status } = req.body;

    // Validate required fields
    if (!title || !date || !location) {
      return res.status(400).json({
        message: "Missing required fields: title, date, and location are required"
      });
    }

    // Validate date is in the future
    const eventDate = new Date(date);
    if (eventDate <= new Date()) {
      return res.status(400).json({
        message: "Event date must be in the future"
      });
    }

    // Create event with authenticated user as organizer
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

    // Populate organizer info in response
    await event.populate("organizer", "name email");

    res.status(201).json({
      message: "Event created successfully",
      event
    });
  } catch (error) {
    console.error("Create event error:", error);
    res.status(500).json({
      message: "Error creating event",
      error: error.message
    });
  }
};

export const getEvents = async (req, res) => {
  try {
    const { status, organizer, upcoming, limit = 10, page = 1 } = req.query;

    let query = {};

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    // Filter by organizer if provided
    if (organizer) {
      query.organizer = organizer;
    }

    // Filter for upcoming events only
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
    res.status(500).json({
      message: "Error fetching events",
      error: error.message
    });
  }
};

export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("organizer", "name email");

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json(event);
  } catch (error) {
    console.error("Get event error:", error);
    res.status(500).json({
      message: "Error fetching event",
      error: error.message
    });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if user is the organizer or admin
    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to update this event" });
    }

    const { title, description, date, location, expectedAttendees, status } = req.body;

    // Validate date if provided
    if (date) {
      const eventDate = new Date(date);
      if (eventDate <= new Date() && status !== "completed") {
        return res.status(400).json({
          message: "Event date must be in the future"
        });
      }
      event.date = eventDate;
    }

    // Update fields
    if (title !== undefined) event.title = title.trim();
    if (description !== undefined) event.description = description?.trim();
    if (location !== undefined) event.location = location.trim();
    if (expectedAttendees !== undefined) event.expectedAttendees = expectedAttendees;
    if (status !== undefined) event.status = status;

    await event.save();
    await event.populate("organizer", "name email");

    res.json({
      message: "Event updated successfully",
      event
    });
  } catch (error) {
    console.error("Update event error:", error);
    res.status(500).json({
      message: "Error updating event",
      error: error.message
    });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if user is the organizer or admin
    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to delete this event" });
    }

    await Event.findByIdAndDelete(req.params.id);

    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Delete event error:", error);
    res.status(500).json({
      message: "Error deleting event",
      error: error.message
    });
  }
};

export const getMyEvents = async (req, res) => {
  try {
    const { status, upcoming, limit = 10, page = 1 } = req.query;

    let query = { organizer: req.user._id };

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    // Filter for upcoming events only
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
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("Get my events error:", error);
    res.status(500).json({
      message: "Error fetching your events",
      error: error.message
    });
  }
};