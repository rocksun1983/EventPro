import express from "express";
import { protectAdmin } from "../middleware/adminMiddleware.js";
import {
  getSMSConfig,
  testSMS,
  updateUserSMSSettings,
  getUsersWithSMS,
  getAllOrganizers,
  getOrganizerDetails,
  updateOrganizerStatus,
  resetOrganizerPassword
} from "../controllers/adminController.js";

const router = express.Router();

// Admin routes - all require admin authentication
router.get("/dashboard", protectAdmin, (req, res) => {
  res.json({ message: "Admin dashboard" });
});

// Organizer Management Routes
router.get("/organizers", protectAdmin, getAllOrganizers);
router.get("/organizers/:organizerId", protectAdmin, getOrganizerDetails);
router.put("/organizers/:organizerId/status", protectAdmin, updateOrganizerStatus);
router.put("/organizers/:organizerId/reset-password", protectAdmin, resetOrganizerPassword);

// SMS Configuration Routes
router.get("/sms/config", protectAdmin, getSMSConfig);
router.post("/sms/test", protectAdmin, testSMS);
router.put("/sms/user-settings", protectAdmin, updateUserSMSSettings);
router.get("/sms/users", protectAdmin, getUsersWithSMS);

export default router;
