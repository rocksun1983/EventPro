import Event from "../models/event.js";
import Attendee from "../models/attendee.js";
import Ticket from "../models/ticket.js";

export const registerSelfForEvent = async (req, res) => {
  let ticketId;
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
    const guestName = `${req.user.firstName || ""} ${req.user.lastName || ""}`.trim();
    const ticket = await Ticket.create({
      guestName,
      guestEmail: req.user.email,
      eventId
    });
    ticketId = ticket._id;

    const attendee = await Attendee.create({
      event: eventId,
      user: userId,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      phone: req.user.phone || "",
      registrationStatus: "confirmed",
      ticketId: ticket._id.toString()
    });

    res.status(201).json({
      message: "Successfully registered for the event",
      attendee,
    });
  } catch (error) {
    if (ticketId) {
      await Ticket.findByIdAndDelete(ticketId).catch(() => {});
    }
    console.error("Self-registration error:", error);
    res.status(500).json({ message: "Error registering for event", error: error.message });
  }
};
