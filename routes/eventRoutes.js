import express from "express";
import {
  createEvent,
  getEvents,
  getEventById,
  duplicateEvent,
  updateEvent,
  deleteEvent,
  getMyEvents,
  registerForEvent
} from "../controllers/eventController.js";
import { protect } from "../middleware/authMiddleware.js";
import { saveEvent, unsaveEvent } from "../controllers/eventSaveController.js"; // Add your save/unsave controller imports

const router = express.Router();

// --------------------
// Public routes
// --------------------
router.get("/", getEvents);
router.get("/:id", getEventById);

// --------------------
// Protected routes (require authentication)
// --------------------
router.post("/", protect, createEvent);
router.post("/:id/duplicate", protect, duplicateEvent);
router.put("/:id", protect, updateEvent);
router.delete("/:id", protect, deleteEvent);

// Register current user for an event
router.post("/:id/register", protect, registerForEvent);

// Save / Unsave routes
router.post("/:id/save", protect, saveEvent);     // Save an event
router.delete("/:id/save", protect, unsaveEvent); // Unsave (remove) an event

// --------------------
// Organizer-specific routes
// --------------------
router.get("/organizer/my-events", protect, getMyEvents);

export default router;
