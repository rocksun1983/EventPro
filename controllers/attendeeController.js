import Event from "../models/event.js";
import Attendee from "../models/attendee.js";
import { parseAttendeeFile } from "../utils/attendeeImport.js";

const ValidEmail = (email) => {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const importAttendees = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: "File is required" });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Organizer/admin check mirrors existing event authorization logic.
    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to import attendees for this event" });
    }

    const rows = parseAttendeeFile(req.file);

    if (!rows.length) {
      return res.status(400).json({ message: "No rows found in file" });
    }

    const errors = [];
    const seenEmails = new Set();
    const candidates = [];
    let duplicatesInFile = 0;

    for (const row of rows) {
      const email = (row.email || "").toString().trim().toLowerCase();
      const firstName = (row.firstName || "").toString().trim();
      const lastName = (row.lastName || "").toString().trim();
      const phone = (row.phone || "").toString().trim();
      const ticketType = (row.ticketType || "").toString().trim();
      const status = (row.status || "").toString().trim().toLowerCase();

      if (!email || !ValidEmail(email)) {
        errors.push({ row: row.__row || 0, field: "email", message: "Invalid or missing email" });
        continue;
      }

      if (seenEmails.has(email)) {
        duplicatesInFile += 1;
        continue;
      }

      seenEmails.add(email);

      candidates.push({
        event: event._id,
        firstName,
        lastName,
        email,
        phone,
        ticketType,
        status: status || "registered",
        source: "import",
        createdBy: req.user._id
      });
    }

    if (!candidates.length) {
      return res.status(400).json({
        message: "No valid attendee rows to import",
        summary: {
          totalRows: rows.length,
          inserted: 0,
          skipped: rows.length,
          duplicatesInFile,
          errors
        }
      });
    }

    const existing = await Attendee.find({
      event: event._id,
      email: { $in: candidates.map((c) => c.email) }
    }).select("email");

    const existingEmails = new Set(existing.map((item) => item.email));
    const toInsert = candidates.filter((c) => !existingEmails.has(c.email));
    const duplicatesInDb = candidates.length - toInsert.length;

    let inserted = 0;
    if (toInsert.length > 0) {
      const created = await Attendee.insertMany(toInsert, { ordered: false });
      inserted = created.length;
    }

    return res.status(201).json({
      message: "Attendee import completed",
      summary: {
        totalRows: rows.length,
        inserted,
        skipped: rows.length - inserted,
        duplicatesInFile,
        duplicatesInDb,
        errors
      }
    });
  } catch (error) {
    console.error("Import attendees error:", error);
    return res.status(500).json({ message: "Error importing attendees", error: error.message });
  }
};
