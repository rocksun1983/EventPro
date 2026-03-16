import Event from "../models/event.js";
import Attendee from "../models/attendee.js";
import AttendeeCheckin from "../models/attendeeCheckin.js";
import AttendeeCheckinSend from "../models/attendeeCheckinSend.js";
import sendSMS from "../utils/sendSMS.js";

const DEFAULT_TEMPLATE = "Hi {{firstName}}, check in for {{eventTitle}}. {{instruction}}";

const ensureEventAccess = (event, user) => {
  if (!event) return { ok: false, status: 404, message: "Event not found" };
  if (event.organizer.toString() !== user._id.toString() && user.role !== "admin") {
    return { ok: false, status: 403, message: "Not authorized for this event" };
  }
  return { ok: true };
};

const renderTemplate = (template, data) => {
  let message = template || DEFAULT_TEMPLATE;
  for (const [key, value] of Object.entries(data)) {
    const token = `{{${key}}}`;
    message = message.split(token).join(value || "");
  }
  return message.trim();
};

const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const getQrBaseUrl = () => {
  return process.env.CHECKIN_QR_BASE_URL || process.env.FRONTEND_URL || "";
};

export const getCheckinTemplate = async (req, res) => {
  return res.json({ template: DEFAULT_TEMPLATE });
};

export const scanCheckinCode = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { code } = req.body;

    if (!code || typeof code !== "string") {
      return res.status(400).json({ message: "code is required" });
    }

    const event = await Event.findById(eventId);
    const access = ensureEventAccess(event, req.user);
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    const checkin = await AttendeeCheckin.findOne({
      event: event._id,
      checkInCode: code.trim()
    }).populate("attendee", "firstName lastName email phone");

    if (!checkin) {
      return res.status(404).json({ message: "Check-in code not found for this event" });
    }

    const now = new Date();
    const isDuplicate = !!checkin.checkedInAt;
    if (!isDuplicate) {
      checkin.checkedInAt = now;
      await checkin.save();
      if (checkin.attendee?._id) {
        await Attendee.findByIdAndUpdate(checkin.attendee._id, { status: "checked_in" });
      }
    }

    return res.json({
      duplicate: isDuplicate,
      checkedInAt: checkin.checkedInAt || now,
      attendee: checkin.attendee
    });
  } catch (error) {
    console.error("Scan check-in code error:", error);
    return res.status(500).json({ message: "Error scanning check-in code", error: error.message });
  }
};

export const previewCheckinMessage = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { attendeeId, template, checkInNumber } = req.body;

    const event = await Event.findById(eventId);
    const access = ensureEventAccess(event, req.user);
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    if (!attendeeId) {
      return res.status(400).json({ message: "attendeeId is required" });
    }

    const attendee = await Attendee.findById(attendeeId);
    if (!attendee) {
      return res.status(404).json({ message: "Attendee not found" });
    }

    const checkin = await AttendeeCheckin.findOne({ event: event._id, attendee: attendee._id });
    if (!checkin) {
      return res.status(400).json({ message: "Check-in codes not generated for this attendee" });
    }

    if (checkin.phoneType === "feature" && !checkInNumber) {
      return res.status(400).json({ message: "checkInNumber is required for feature phone preview" });
    }

    const instruction = checkin.phoneType === "feature"
      ? `Your check-in code is ${checkin.checkInCode}. Call ${checkInNumber} for help.`
      : `Open your QR code here: ${checkin.qrCodeUrl}`;

    const message = renderTemplate(template, {
      firstName: attendee.firstName,
      lastName: attendee.lastName,
      eventTitle: event.title,
      code: checkin.checkInCode,
      qrUrl: checkin.qrCodeUrl,
      checkInNumber: checkInNumber || "",
      instruction
    });

    return res.json({ message });
  } catch (error) {
    console.error("Preview check-in message error:", error);
    return res.status(500).json({ message: "Error generating preview", error: error.message });
  }
};

export const generateCheckinCodes = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    const access = ensureEventAccess(event, req.user);
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    const attendees = await Attendee.find({ event: event._id });
    if (!attendees.length) {
      return res.status(400).json({ message: "No attendees found for this event" });
    }

    const existing = await AttendeeCheckin.find({ event: event._id })
      .select("attendee checkInCode qrCodeUrl phoneType");
    const existingMap = new Map(existing.map((item) => [item.attendee.toString(), item]));

    const baseUrl = getQrBaseUrl();
    let generated = 0;
    let skipped = 0;

    for (const attendee of attendees) {
      const existingCheckin = existingMap.get(attendee._id.toString());
      if (existingCheckin) {
        skipped += 1;
        continue;
      }

      let code = "";
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const candidate = generateCode();
        const exists = await AttendeeCheckin.exists({ checkInCode: candidate });
        if (!exists) {
          code = candidate;
          break;
        }
      }
      if (!code) {
        return res.status(500).json({ message: "Unable to generate unique check-in codes. Please retry." });
      }
      const qrCodeUrl = baseUrl ? `${baseUrl.replace(/\/$/, "")}/checkin/${attendee._id}` : "";

      await AttendeeCheckin.create({
        event: event._id,
        attendee: attendee._id,
        phoneType: "smartphone",
        checkInCode: code,
        qrCodeUrl
      });
      generated += 1;
    }

    return res.json({ generated, skipped });
  } catch (error) {
    console.error("Generate check-in codes error:", error);
    return res.status(500).json({ message: "Error generating check-in codes", error: error.message });
  }
};

const sendBatch = async (items, template, checkInNumber, eventTitle, sendJob) => {
  let sent = 0;
  let failed = 0;
  const failedList = [];

  for (const item of items) {
    const attendee = item.attendee;
    const checkin = item.checkin;

    const instruction = checkin.phoneType === "feature"
      ? `Your check-in code is ${checkin.checkInCode}. Call ${checkInNumber} for help.`
      : `Open your QR code here: ${checkin.qrCodeUrl}`;

    const message = renderTemplate(template, {
      firstName: attendee.firstName,
      lastName: attendee.lastName,
      eventTitle,
      code: checkin.checkInCode,
      qrUrl: checkin.qrCodeUrl,
      checkInNumber: checkInNumber || "",
      instruction
    });

    const result = await sendSMS(attendee.phone, message);
    if (result.success) {
      sent += 1;
      checkin.lastInstructionSentAt = new Date();
      checkin.lastInstructionStatus = "sent";
      checkin.lastInstructionError = undefined;
    } else {
      failed += 1;
      const errorMessage = result.error || result.message || "Failed to send";
      failedList.push({ name: `${attendee.firstName} ${attendee.lastName}`.trim(), phone: attendee.phone, error: errorMessage });
      checkin.lastInstructionStatus = "failed";
      checkin.lastInstructionError = errorMessage;
    }
    await checkin.save();
  }

  sendJob.summary.sent += sent;
  sendJob.summary.failed += failed;
  if (failedList.length > 0) {
    sendJob.failed.push(...failedList);
  }
};

const processSend = async ({ sendId, event, template, checkInNumber }) => {
  const sendJob = await AttendeeCheckinSend.findById(sendId);
  if (!sendJob) return;

  sendJob.status = "processing";
  await sendJob.save();

  try {
    const checkins = await AttendeeCheckin.find({ event: event._id }).populate("attendee");
    if (!checkins.length) {
      sendJob.status = "failed";
      sendJob.summary.failed = 0;
      sendJob.summary.sent = 0;
      sendJob.failed = [];
      await sendJob.save();
      return;
    }

    const items = [];
    const errors = [];

    for (const checkin of checkins) {
      const attendee = checkin.attendee;
      if (!attendee || !attendee.phone) {
        errors.push({ name: attendee ? `${attendee.firstName} ${attendee.lastName}`.trim() : "Unknown", phone: "", error: "Missing attendee phone" });
        continue;
      }

      if (checkin.phoneType === "feature" && !checkin.checkInCode) {
        errors.push({ name: `${attendee.firstName} ${attendee.lastName}`.trim(), phone: attendee.phone, error: "Missing check-in code" });
        continue;
      }

      if (checkin.phoneType === "feature" && !checkInNumber) {
        errors.push({ name: `${attendee.firstName} ${attendee.lastName}`.trim(), phone: attendee.phone, error: "Missing check-in number" });
        continue;
      }

      if (checkin.phoneType === "smartphone" && !checkin.qrCodeUrl) {
        errors.push({ name: `${attendee.firstName} ${attendee.lastName}`.trim(), phone: attendee.phone, error: "Missing QR code URL" });
        continue;
      }

      items.push({ attendee, checkin });
    }

    const cappedItems = items.slice(0, 500);
    const total = cappedItems.length;
    sendJob.progress.total = total;
    sendJob.progress.processed = 0;
    sendJob.progress.percent = total === 0 ? 100 : 0;
    sendJob.failed = errors;
    sendJob.summary.failed = errors.length;
    await sendJob.save();

    const batchSize = 25;
    for (let i = 0; i < total; i += batchSize) {
      const batch = cappedItems.slice(i, i + batchSize);
      await sendBatch(batch, template, checkInNumber, event.title, sendJob);
      sendJob.progress.processed = Math.min(i + batch.length, total);
      sendJob.progress.percent = Math.round((sendJob.progress.processed / total) * 100);
      await sendJob.save();
    }

    sendJob.status = "completed";
    sendJob.progress.processed = total;
    sendJob.progress.percent = 100;
    await sendJob.save();
  } catch (error) {
    sendJob.status = "failed";
    sendJob.failed.push({ name: "System", phone: "", error: error.message });
    await sendJob.save();
  }
};

export const sendCheckinInstructions = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { template, checkInNumber } = req.body;

    const event = await Event.findById(eventId);
    const access = ensureEventAccess(event, req.user);
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    const sendJob = await AttendeeCheckinSend.create({
      event: event._id,
      createdBy: req.user._id,
      status: "queued",
      progress: { total: 0, processed: 0, percent: 0 },
      summary: { sent: 0, failed: 0 },
      failed: []
    });

    setImmediate(() => {
      processSend({
        sendId: sendJob._id,
        event,
        template: template || DEFAULT_TEMPLATE,
        checkInNumber: checkInNumber || ""
      });
    });

    return res.status(202).json({ sendId: sendJob._id, status: sendJob.status });
  } catch (error) {
    console.error("Send check-in instructions error:", error);
    return res.status(500).json({ message: "Error sending check-in instructions", error: error.message });
  }
};

export const getCheckinSendStatus = async (req, res) => {
  try {
    const { eventId, sendId } = req.params;

    const event = await Event.findById(eventId);
    const access = ensureEventAccess(event, req.user);
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    const sendJob = await AttendeeCheckinSend.findById(sendId);
    if (!sendJob || sendJob.event.toString() !== eventId) {
      return res.status(404).json({ message: "Send not found" });
    }

    return res.json({
      sendId: sendJob._id,
      status: sendJob.status,
      progress: sendJob.progress
    });
  } catch (error) {
    console.error("Get check-in send status error:", error);
    return res.status(500).json({ message: "Error fetching send status", error: error.message });
  }
};

export const getCheckinSendResult = async (req, res) => {
  try {
    const { eventId, sendId } = req.params;

    const event = await Event.findById(eventId);
    const access = ensureEventAccess(event, req.user);
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    const sendJob = await AttendeeCheckinSend.findById(sendId);
    if (!sendJob || sendJob.event.toString() !== eventId) {
      return res.status(404).json({ message: "Send not found" });
    }

    return res.json({
      sendId: sendJob._id,
      status: sendJob.status,
      summary: sendJob.summary,
      failed: sendJob.failed
    });
  } catch (error) {
    console.error("Get check-in send result error:", error);
    return res.status(500).json({ message: "Error fetching send result", error: error.message });
  }
};
