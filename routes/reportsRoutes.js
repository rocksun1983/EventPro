import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getReportSummary, getReportTimeline } from "../controllers/reportsController.js";

const router = express.Router();

router.get("/summary", protect, getReportSummary);
router.get("/timeline", protect, getReportTimeline);

export default router;
