import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { registerSelfForEvent } from "../controllers/attendeeSelfRegistrationController.js";

const router = express.Router();

// POST /events/:eventId/register — Single-attendee self-registration
router.post("/:eventId/register", protect, registerSelfForEvent);

export default router;