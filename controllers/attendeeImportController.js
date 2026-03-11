import Event from "../models/event.js";
import Attendee from "../models/attendee.js";
import AttendeeImport from "../models/attendeeImport.js";
import { parseAttendeeFile } from "../utils/attendeeImport.js";
import xlsx from "xlsx";

const normalizeEmail = (email) => {
  if (!email) return "";
  return email.toString().trim().toLowerCase();
};

const normalizePhone = (phone) => {
  if (!phone) return "";
  return phone.toString().replace(/\D+/g, "");
};

const isValidEmail = (email) => {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const escapeCsv = (value) => {
  const text = value === undefined || value === null ? "" : value.toString();
  if (text.includes(",") || text.includes("\"") || text.includes("\n")) {
    return `"${text.replace(/"/g, "\"\"")}"`;
  }
  return text;
};

const ensureEventAccess = (event, user) => {
  if (!event) return { ok: false, status: 404, message: "Event not found" };
  if (event.organizer.toString() !== user._id.toString() && user.role !== "admin") {
    return { ok: false, status: 403, message: "Not authorized for this event" };
  }
  return { ok: true };
};

const processImport = async ({ importId, file, event, user }) => {
  const importJob = await AttendeeImport.findById(importId);
  if (!importJob) return;

  importJob.status = "processing";
  await importJob.save();

  try {
    const rows = parseAttendeeFile(file);

    importJob.progress.totalRows = rows.length;
    importJob.progress.processedRows = 0;
    importJob.progress.percent = rows.length === 0 ? 100 : 0;
    await importJob.save();

    if (!rows.length) {
      importJob.status = "failed";
      importJob.importErrors = [{ row: 0, field: "file", message: "No rows found in file" }];
      await importJob.save();
      return;
    }

    const existingAttendees = await Attendee.find({ event: event._id })
      .select("email phone");
    const existingEmails = new Set(existingAttendees.map((a) => normalizeEmail(a.email)));
    const existingPhones = new Set(existingAttendees.map((a) => normalizePhone(a.phone)));

    const seenEmails = new Set();
    const seenPhones = new Set();

    const errors = [];
    const duplicates = [];
    const toInsert = [];

    const totalRows = rows.length;
    let processedRows = 0;

    for (const row of rows) {
      processedRows += 1;

      const firstName = (row.firstName || "").toString().trim();
      const lastName = (row.lastName || "").toString().trim();
      const emailRaw = row.email;
      const phoneRaw = row.phone;
      const email = normalizeEmail(emailRaw);
      const phone = normalizePhone(phoneRaw);

      const missingFields = [];
      if (!firstName) missingFields.push("First Name");
      if (!lastName) missingFields.push("Last Name");
      if (!email) missingFields.push("Email");
      if (!phone) missingFields.push("Phone Number");

      if (missingFields.length > 0) {
        errors.push({
          row: row.__row || 0,
          field: missingFields.join(", "),
          message: "Missing required field(s)"
        });
        continue;
      }

      if (!isValidEmail(email)) {
        errors.push({ row: row.__row || 0, field: "Email", message: "Invalid email format" });
        continue;
      }

      const duplicateFields = [];
      if (email && (seenEmails.has(email) || existingEmails.has(email))) {
        duplicateFields.push("email");
      }
      if (phone && (seenPhones.has(phone) || existingPhones.has(phone))) {
        duplicateFields.push("phone");
      }

      if (duplicateFields.length > 0) {
        duplicates.push({
          row: row.__row || 0,
          name: `${firstName} ${lastName}`.trim(),
          fields: duplicateFields
        });
      } else {
        toInsert.push({
          event: event._id,
          firstName,
          lastName,
          email,
          phone,
          source: "import",
          createdBy: user._id
        });
      }

      if (email) seenEmails.add(email);
      if (phone) seenPhones.add(phone);

      if (processedRows % 50 === 0 || processedRows === totalRows) {
        importJob.progress.processedRows = processedRows;
        importJob.progress.percent = Math.round((processedRows / totalRows) * 100);
        await importJob.save();
      }
    }

    let successful = 0;
    if (toInsert.length > 0) {
      const created = await Attendee.insertMany(toInsert, { ordered: false });
      successful = created.length;
    }

    importJob.status = "completed";
    importJob.summary = {
      totalRows,
      successful,
      failed: errors.length,
      duplicates: duplicates.length
    };
    importJob.importErrors = errors;
    importJob.duplicates = duplicates;
    importJob.progress.processedRows = totalRows;
    importJob.progress.percent = 100;
    await importJob.save();
  } catch (error) {
    importJob.status = "failed";
    importJob.importErrors = [{ row: 0, field: "processing", message: error.message }];
    await importJob.save();
  }
};

export const createAttendeeImport = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: "File is required" });
    }

    const event = await Event.findById(eventId);
    const access = ensureEventAccess(event, req.user);
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    if (event.status !== "draft") {
      return res.status(400).json({ message: "Attendee upload is only available for draft events" });
    }

    const importJob = await AttendeeImport.create({
      event: event._id,
      createdBy: req.user._id,
      fileName: req.file.originalname,
      status: "queued"
    });

    // Async processing to keep request fast and enable progress polling.
    setImmediate(() => {
      processImport({ importId: importJob._id, file: req.file, event, user: req.user });
    });

    return res.status(202).json({ importId: importJob._id, status: importJob.status });
  } catch (error) {
    console.error("Create attendee import error:", error);
    return res.status(500).json({ message: "Error creating attendee import", error: error.message });
  }
};

export const getAttendeeImportStatus = async (req, res) => {
  try {
    const { eventId, importId } = req.params;

    const event = await Event.findById(eventId);
    const access = ensureEventAccess(event, req.user);
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    const importJob = await AttendeeImport.findById(importId);
    if (!importJob || importJob.event.toString() !== eventId) {
      return res.status(404).json({ message: "Import not found" });
    }

    return res.json({
      importId: importJob._id,
      status: importJob.status,
      progress: importJob.progress
    });
  } catch (error) {
    console.error("Get attendee import status error:", error);
    return res.status(500).json({ message: "Error fetching import status", error: error.message });
  }
};

export const getAttendeeImportResult = async (req, res) => {
  try {
    const { eventId, importId } = req.params;

    const event = await Event.findById(eventId);
    const access = ensureEventAccess(event, req.user);
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    const importJob = await AttendeeImport.findById(importId);
    if (!importJob || importJob.event.toString() !== eventId) {
      return res.status(404).json({ message: "Import not found" });
    }

    return res.json({
      importId: importJob._id,
      status: importJob.status,
      summary: importJob.summary,
      duplicates: importJob.duplicates,
      importErrors: importJob.importErrors
    });
  } catch (error) {
    console.error("Get attendee import result error:", error);
    return res.status(500).json({ message: "Error fetching import result", error: error.message });
  }
};

export const downloadDuplicateReport = async (req, res) => {
  try {
    const { eventId, importId } = req.params;

    const event = await Event.findById(eventId);
    const access = ensureEventAccess(event, req.user);
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    const importJob = await AttendeeImport.findById(importId);
    if (!importJob || importJob.event.toString() !== eventId) {
      return res.status(404).json({ message: "Import not found" });
    }

    const header = "Row,Name,DuplicateFields\n";
    const lines = (importJob.duplicates || []).map((dup) => {
      const fields = (dup.fields || []).join("|");
      return `${escapeCsv(dup.row)},${escapeCsv(dup.name)},${escapeCsv(fields)}`;
    });

    const csv = header + lines.join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=\"duplicates-${importId}.csv\"`);
    return res.send(csv);
  } catch (error) {
    console.error("Download duplicate report error:", error);
    return res.status(500).json({ message: "Error downloading duplicate report", error: error.message });
  }
};

export const downloadAttendeeTemplate = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { format = "csv" } = req.query;

    const event = await Event.findById(eventId);
    const access = ensureEventAccess(event, req.user);
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    const headers = ["First Name", "Last Name", "Email", "Phone Number"];

    if (format === "xlsx") {
      const worksheet = xlsx.utils.aoa_to_sheet([headers]);
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, "Attendees");
      const buffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=\"attendee-template.xlsx\"");
      return res.send(buffer);
    }

    if (format !== "csv") {
      return res.status(400).json({ message: "Invalid format. Use csv or xlsx." });
    }

    const csv = `${headers.join(",")}\n`;
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=\"attendee-template.csv\"");
    return res.send(csv);
  } catch (error) {
    console.error("Download template error:", error);
    return res.status(500).json({ message: "Error downloading template", error: error.message });
  }
};
