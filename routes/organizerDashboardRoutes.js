import express from "express";
import { protect, protectQueryToken } from "../middleware/authMiddleware.js";
import {
  getOrganizerDashboardStats,
  streamOrganizerDashboardStats
} from "../controllers/organizerDashboardController.js";

const router = express.Router();

router.get("/stats", protect, getOrganizerDashboardStats);
router.get("/stream", protectQueryToken, streamOrganizerDashboardStats);

export default router;
