import Event from "../models/event.js";
import Attendee from "../models/attendee.js";
import Ticket from "../models/ticket.js";
import sendSMS from "../utils/sendSMS.js";
import crypto from "crypto";

const generateOtp = () => crypto.randomInt(100000, 1000000).toString();
const hashOtp = (otp) => crypto.createHash("sha256").update(otp).digest("hex");

export const registerSelfForEvent = async (req, res) => {
  let ticketId;
  try {
    const { eventId } = req.params;
    const userId = req.user._id;
    const phone = (req.body?.phone || req.user.phone || "").trim();

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
    if (!phone) {
      return res.status(400).json({ message: "Phone number is required for verification" });
    }

    const guestName = `${req.user.firstName || ""} ${req.user.lastName || ""}`.trim();
    const ticket = await Ticket.create({
      guestName,
      guestEmail: req.user.email,
      eventId
    });
    ticketId = ticket._id;

    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    const attendee = await Attendee.create({
      event: eventId,
      user: userId,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      phone,
      registrationStatus: "pending",
      ticketId: ticket._id.toString(),
      verificationCodeHash: otpHash,
      verificationCodeExpiry: otpExpiry
    });

    const smsResult = await sendSMS(
      phone,
      `Your EventPro verification code is: ${otp}. Valid for 10 minutes.`
    );
    if (!smsResult.success) {
      console.error("Registration SMS failed:", smsResult.error || smsResult.message);
    }

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
