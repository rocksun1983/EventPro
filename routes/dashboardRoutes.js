import express from "express";
import { dashboardStats } from "../controllers/adminController.js";
import { protectAdmin } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.get("/stats", protectAdmin, dashboardStats);

export default router;
