import Event from "../models/event.js";
import User from "../models/user.js";

// Save an event to the user's list
export const saveEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const user = req.user;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (!user.savedEvents) user.savedEvents = [];

    if (user.savedEvents.includes(event._id.toString())) {
      return res.status(400).json({ message: "Event already saved" });
    }

    user.savedEvents.push(event._id);
    await user.save();

    res.json({ message: "Event saved successfully" });
  } catch (error) {
    console.error("Save event error:", error);
    res.status(500).json({ message: "Error saving event", error: error.message });
  }
};

// Remove an event from the user's list
export const unsaveEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const user = req.user;

    const index = user.savedEvents?.findIndex((id) => id.toString() === eventId);
    if (index === -1 || index === undefined) {
      return res.status(400).json({ message: "Event not saved" });
    }

    user.savedEvents.splice(index, 1);
    await user.save();

    res.json({ message: "Event removed from saved list" });
  } catch (error) {
    console.error("Unsave event error:", error);
    res.status(500).json({ message: "Error removing event", error: error.message });
  }
};