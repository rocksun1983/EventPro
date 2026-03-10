import mongoose from "mongoose";
import { generateOTP } from "../utils/otpGenerator.js";
import { generateQRCode } from "../utils/qrGenerator.js";

const ticketSchema = new mongoose.Schema({
  guestName: String,
  guestEmail: String,
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event"
  },
  ticketId: String,
  qrCode: String,
  smsCode: String,
  checkedIn: {
    type: Boolean,
    default: false
  }
});


ticketSchema.pre("save", async function() {
  
  if (!this.smsCode) {
    this.smsCode = generateOTP(this._id.toString());
  }

  
  if (!this.qrCode) {
    const qrData = `ticket:${this._id.toString()}`;
    this.qrCode = await generateQRCode(qrData);
  }

  
});

export default mongoose.model("Ticket", ticketSchema);