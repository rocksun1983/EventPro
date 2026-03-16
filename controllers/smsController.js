import AttendeeCheckin from "../models/attendeeCheckin.js";
import Attendee from "../models/attendee.js";

const toTwiML = (message) => {
  const safe = (message || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${safe}</Message></Response>`;
};

const extractCheckinCode = (text) => {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  const match = normalized.match(/(\d{6})/);
  return match ? match[1] : "";
};

export const inboundSmsCheckin = async (req, res) => {
  try {
    const body = req.body || {};
    const rawText = body.Body || body.body || "";
    const from = body.From || body.from || "";
    const code = extractCheckinCode(rawText);

    if (!code) {
      return res
        .status(200)
        .type("text/xml")
        .send(toTwiML("Missing check-in code. Reply with your 6-digit code (numbers only or in a sentence)."));
    }

    const matches = await AttendeeCheckin.find({ checkInCode: code })
      .limit(2)
      .populate("attendee", "firstName lastName email phone")
      .populate("event", "title");

    if (matches.length === 0) {
      return res
        .status(200)
        .type("text/xml")
        .send(toTwiML("We couldn't find that check-in code. Please re-check your 6-digit code and try again. If this continues, ask the event staff for help."));
    }

    if (matches.length > 1) {
      return res
        .status(200)
        .type("text/xml")
        .send(toTwiML("Multiple matches found for this code. Please contact the organizer."));
    }

    const checkin = matches[0];
    const isDuplicate = !!checkin.checkedInAt;
    if (!isDuplicate) {
      checkin.checkedInAt = new Date();
      await checkin.save();
      if (checkin.attendee?._id) {
        await Attendee.findByIdAndUpdate(checkin.attendee._id, { status: "checked_in" });
      }
    }

    const attendee = checkin.attendee;
    const event = checkin.event;
    const name = attendee ? `${attendee.firstName || ""} ${attendee.lastName || ""}`.trim() : "Attendee";
    const eventTitle = event && event.title ? ` for ${event.title}` : "";
    const message = isDuplicate
      ? `Hi ${name}, you're already checked in${eventTitle}.`
      : `You're checked in${eventTitle}, ${name}. Welcome!`;

    return res.status(200).type("text/xml").send(toTwiML(message));
  } catch (error) {
    console.error("Inbound SMS check-in error:", error);
    return res
      .status(200)
      .type("text/xml")
      .send(toTwiML("Sorry, we could not validate your check-in right now."));
  }
};
