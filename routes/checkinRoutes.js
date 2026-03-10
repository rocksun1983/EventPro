import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getCheckinTemplate,
  previewCheckinMessage,
  generateCheckinCodes,
  sendCheckinInstructions,
  getCheckinSendStatus,
  getCheckinSendResult
} from "../controllers/attendeeCheckinController.js";

const router = express.Router();

router.get("/:eventId/checkin/template", protect, getCheckinTemplate);
router.post("/:eventId/checkin/preview", protect, previewCheckinMessage);
router.post("/:eventId/checkin/generate", protect, generateCheckinCodes);
router.post("/:eventId/checkin/send", protect, sendCheckinInstructions);
router.get("/:eventId/checkin/send/:sendId", protect, getCheckinSendStatus);
router.get("/:eventId/checkin/send/:sendId/result", protect, getCheckinSendResult);

export default router;
