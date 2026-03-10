import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { attendeeUpload } from "../middleware/attendeeUpload.js";
import { importAttendees } from "../controllers/attendeeController.js";

const router = express.Router();

// Mounted under /api/events in server.js for organizer/admin imports.
router.post("/:eventId/attendees/import", protect, attendeeUpload, importAttendees);

export default router;
