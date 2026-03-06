import express from "express";
import { dashboardStats } from "../controllers/adminController.js";

const router = express.Router();

router.get("/stats", dashboardStats);

export default router;
