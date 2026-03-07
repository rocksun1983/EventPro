import express from "express";
import {
  registerUser,
  loginUser,
  resetPasswordAuthenticated,
  forgotPassword,
  resetPasswordWithToken,
  updateProfile,
  getProfile,
  resendVerification,
  verifyEmail
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/signup", registerUser);
router.post("/login", loginUser);
router.post("/resend-verification", resendVerification);
router.post("/verify-email", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPasswordWithToken);
router.post("/reset-password", protect, resetPasswordAuthenticated);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);

export default router;
