import mongoose from "mongoose";
import Ticket from "../models/ticket.js";
import { generateOTP } from "../utils/otpGenerator.js";
import { generateQRCode } from "../utils/qrGenerator.js";

export const generateCheckinCodes = async (req, res) => {
  const { ticketId } = req.params;

  try {
    
    const ticket = await Ticket.findById(new mongoose.Types.ObjectId(ticketId));

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const smsCode = generateOTP(ticketId);
    const qrData = `ticket:${ticketId}`;
    const qrCode = await generateQRCode(qrData);

    ticket.smsCode = smsCode;
    ticket.qrCode = qrCode;

    await ticket.save();

    res.json({
      message: "Check-in codes generated",
      ticketId: ticket._id,
      smsCode,
      qrCode
    });

  } catch (error) {
    res.status(500).json({ message: "Error generating check-in codes", error: error.message });
  }
};