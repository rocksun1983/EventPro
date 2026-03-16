import Event from "../models/event.js";
import Attendee from "../models/attendee.js";
import AttendeeImport from "../models/attendeeImport.js";
import AttendeeCheckin from "../models/attendeeCheckin.js";
import { parseAttendeeFile } from "../utils/attendeeImport.js";
import xlsx from "xlsx";
import PDFDocument from "pdfkit";

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

export const exportAttendanceReport = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { only } = req.query;

    const event = await Event.findById(eventId);
    const access = ensureEventAccess(event, req.user);
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    const attendeesCursor = Attendee.find({ event: event._id })
      .select("firstName lastName email phone ticketType status source createdAt")
      .sort({ createdAt: 1 })
      .lean()
      .cursor();

    const checkins = await AttendeeCheckin.find({ event: event._id })
      .select("attendee checkedInAt")
      .lean();

    const checkinMap = new Map(
      checkins.map((checkin) => [checkin.attendee.toString(), checkin])
    );

    const header = [
      "Event ID",
      "Event Title",
      "Event Date",
      "Attendee ID",
      "First Name",
      "Last Name",
      "Email",
      "Phone",
      "Ticket Type",
      "Status",
      "Source",
      "Registered At",
      "Checked In",
      "Checked In At",
      "No Show"
    ].join(",");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=\"attendance-${eventId}.csv\"`);
    res.write(`${header}\n`);

    const eventDate = event.date ? new Date(event.date).toISOString() : "";
    for await (const attendee of attendeesCursor) {
      const checkin = checkinMap.get(attendee._id.toString());
      const checkedIn = Boolean(checkin?.checkedInAt) || attendee.status === "checked_in";
      const checkedInAt = checkin?.checkedInAt ? new Date(checkin.checkedInAt).toISOString() : "";
      const registeredAt = attendee.createdAt ? new Date(attendee.createdAt).toISOString() : "";
      const noShow = !checkedIn;

      if (only === "no_show" && !noShow) {
        continue;
      }

      const line = [
        escapeCsv(event._id.toString()),
        escapeCsv(event.title || ""),
        escapeCsv(eventDate),
        escapeCsv(attendee._id.toString()),
        escapeCsv(attendee.firstName || ""),
        escapeCsv(attendee.lastName || ""),
        escapeCsv(attendee.email || ""),
        escapeCsv(attendee.phone || ""),
        escapeCsv(attendee.ticketType || ""),
        escapeCsv(attendee.status || ""),
        escapeCsv(attendee.source || ""),
        escapeCsv(registeredAt),
        escapeCsv(checkedIn ? "true" : "false"),
        escapeCsv(checkedInAt),
        escapeCsv(noShow ? "true" : "false")
      ].join(",");

      res.write(`${line}\n`);
    }

    return res.end();
  } catch (error) {
    console.error("Export attendance report error:", error);
    return res.status(500).json({ message: "Error exporting attendance report", error: error.message });
  }
};

const formatDateTime = (value) => {
  if (!value) return "";
  return new Date(value).toISOString();
};

const drawTableRow = (doc, columns, y, rowHeight, fontSize) => {
  const padding = 4;
  doc.fontSize(fontSize);
  for (const col of columns) {
    doc.text(col.text, col.x + padding, y + padding, { width: col.width - padding * 2 });
  }
  doc.moveTo(columns[0].x, y).lineTo(columns[columns.length - 1].x + columns[columns.length - 1].width, y).strokeColor("#e6e6e6").stroke();
  doc.moveTo(columns[0].x, y + rowHeight).lineTo(columns[columns.length - 1].x + columns[columns.length - 1].width, y + rowHeight).strokeColor("#e6e6e6").stroke();
};

export const exportAttendancePdf = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { only } = req.query;

    const event = await Event.findById(eventId);
    const access = ensureEventAccess(event, req.user);
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    const attendees = await Attendee.find({ event: event._id })
      .sort({ createdAt: 1 })
      .lean();

    const checkins = await AttendeeCheckin.find({ event: event._id })
      .select("attendee checkedInAt")
      .lean();

    const checkinMap = new Map(
      checkins.map((checkin) => [checkin.attendee.toString(), checkin])
    );

    const totalAttendees = attendees.length;
    const totalCheckedIn = attendees.reduce((count, attendee) => {
      const checkin = checkinMap.get(attendee._id.toString());
      return count + (checkin?.checkedInAt || attendee.status === "checked_in" ? 1 : 0);
    }, 0);
    const totalNoShow = Math.max(0, totalAttendees - totalCheckedIn);
    const checkinRate = totalAttendees > 0 ? Math.round((totalCheckedIn / totalAttendees) * 100) : 0;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=\"attendance-${eventId}.pdf\"`);

    const doc = new PDFDocument({ margin: 48 });
    doc.pipe(res);

    doc.fontSize(20).text("Attendance Summary Report", { align: "left" });
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor("#555555");
    doc.text(`Event: ${event.title || "Untitled Event"}`);
    doc.text(`Event ID: ${event._id.toString()}`);
    doc.text(`Event Date: ${formatDateTime(event.date) || "Not set"}`);
    doc.text(`Location: ${event.location || "Not set"}`);
    doc.moveDown(0.5);
    doc.fillColor("#000000");
    doc.text(`Total Attendees: ${totalAttendees}`);
    doc.text(`Checked In: ${totalCheckedIn}`);
    doc.text(`No Show: ${totalNoShow}`);
    doc.text(`Check-in Rate: ${checkinRate}%`);
    doc.moveDown(0.8);

    const startX = doc.page.margins.left;
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const columns = [
      { header: "Name", x: startX, width: Math.round(pageWidth * 0.25) },
      { header: "Email", x: startX + Math.round(pageWidth * 0.25), width: Math.round(pageWidth * 0.28) },
      { header: "Phone", x: startX + Math.round(pageWidth * 0.53), width: Math.round(pageWidth * 0.15) },
      { header: "Checked In", x: startX + Math.round(pageWidth * 0.68), width: Math.round(pageWidth * 0.10) },
      { header: "No Show", x: startX + Math.round(pageWidth * 0.78), width: Math.round(pageWidth * 0.10) },
      { header: "Checked In At", x: startX + Math.round(pageWidth * 0.88), width: Math.round(pageWidth * 0.12) }
    ];

    const rowHeight = 22;
    let y = doc.y + 8;

    doc.fontSize(10).fillColor("#000000");
    drawTableRow(
      doc,
      columns.map((col) => ({ ...col, text: col.header })),
      y,
      rowHeight,
      10
    );
    y += rowHeight;

    for (const attendee of attendees) {
      if (y + rowHeight > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        y = doc.page.margins.top;
        drawTableRow(
          doc,
          columns.map((col) => ({ ...col, text: col.header })),
          y,
          rowHeight,
          10
        );
        y += rowHeight;
      }

      const checkin = checkinMap.get(attendee._id.toString());
      const checkedIn = Boolean(checkin?.checkedInAt) || attendee.status === "checked_in";
      const checkedInAt = checkin?.checkedInAt ? formatDateTime(checkin.checkedInAt) : "";
      const noShow = !checkedIn;
      const name = `${attendee.firstName || ""} ${attendee.lastName || ""}`.trim();

      if (only === "no_show" && !noShow) {
        continue;
      }

      drawTableRow(
        doc,
        [
          { ...columns[0], text: name },
          { ...columns[1], text: attendee.email || "" },
          { ...columns[2], text: attendee.phone || "" },
          { ...columns[3], text: checkedIn ? "Yes" : "No" },
          { ...columns[4], text: noShow ? "Yes" : "No" },
          { ...columns[5], text: checkedInAt }
        ],
        y,
        rowHeight,
        9
      );
      y += rowHeight;
    }

    doc.end();
  } catch (error) {
    console.error("Export attendance PDF error:", error);
    return res.status(500).json({ message: "Error exporting attendance PDF", error: error.message });
  }
};
