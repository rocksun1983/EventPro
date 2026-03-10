import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { attendeeUpload } from "../middleware/attendeeUpload.js";
import {
  createAttendeeImport,
  getAttendeeImportStatus,
  getAttendeeImportResult,
  downloadDuplicateReport,
  downloadAttendeeTemplate
} from "../controllers/attendeeImportController.js";

const router = express.Router();

// Mounted under /api/events in server.js for organizer/admin imports.
router.post("/:eventId/attendees/imports", protect, attendeeUpload, createAttendeeImport);
router.get("/:eventId/attendees/imports/:importId", protect, getAttendeeImportStatus);
router.get("/:eventId/attendees/imports/:importId/result", protect, getAttendeeImportResult);
router.get("/:eventId/attendees/imports/:importId/duplicates.csv", protect, downloadDuplicateReport);
router.get("/:eventId/attendees/imports/template", protect, downloadAttendeeTemplate);

export default router;
