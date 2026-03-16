import express from "express";
import { inboundSmsCheckin } from "../controllers/smsController.js";

const router = express.Router();

// Twilio inbound SMS webhook
router.post("/inbound", inboundSmsCheckin);

export default router;
