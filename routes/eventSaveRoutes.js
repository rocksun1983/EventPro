import express from "express";
import { saveEvent, unsaveEvent } from "../controllers/eventSaveController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// POST /events/:eventId/save
router.post("/:eventId/save", protect, saveEvent);

// DELETE /events/:eventId/save
router.delete("/:eventId/save", protect, unsaveEvent);

export default router;