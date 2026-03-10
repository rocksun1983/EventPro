import express from "express";
import { generateCheckinCodes } from "../controllers/checkinController.js";

const router = express.Router();

router.post("/generate/:ticketId", generateCheckinCodes);

export default router;