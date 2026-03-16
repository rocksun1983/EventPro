import express from "express";
import {
  registerUser,
  registerOrganizer,
  registerAdmin,
  loginUser,
  loginWithAppwrite,
  resetPasswordAuthenticated,
  forgotPassword,
  resetPasswordWithToken,
  updateProfile,
  getProfile
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { protectAdmin } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.post("/signup", registerUser);
router.post("/signup/user", registerUser);
router.post("/signup/organizer", protectAdmin, registerOrganizer);
// Open admin creation endpoint (distinct from public user signup)
router.post("/signup/admin", registerAdmin);
router.post("/login", loginUser);
router.post("/login/appwrite", loginWithAppwrite);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPasswordWithToken);
router.post("/reset-password", protect, resetPasswordAuthenticated);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);

export default router;
