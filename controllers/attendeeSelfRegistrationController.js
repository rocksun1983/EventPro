import Event from "../models/event.js";
import Attendee from "../models/attendee.js";

export const registerSelfForEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user._id;

    // 1. Check if the event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // 2. Check if the user is already registered
    const existingAttendee = await Attendee.findOne({ event: eventId, user: userId });
    if (existingAttendee) {
      return res.status(400).json({ message: "You are already registered for this event" });
    }

    // 3. Create attendee record
    const attendee = await Attendee.create({
      event: eventId,
      user: userId,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      phone: req.user.phone || "",
    });

    res.status(201).json({
      message: "Successfully registered for the event",
      attendee,
    });
  } catch (error) {
    console.error("Self-registration error:", error);
    res.status(500).json({ message: "Error registering for event", error: error.message });
  }
};