import express from "express";
import { registerUser, loginUser, resetPasswordAuthenticated, forgotPassword, resetPasswordWithToken, updateProfile, getProfile } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPasswordWithToken);
router.post("/reset-password", protect, resetPasswordAuthenticated);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);

export default router;

