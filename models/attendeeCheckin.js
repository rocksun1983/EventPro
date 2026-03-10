import mongoose from "mongoose";

const attendeeCheckinSchema = new mongoose.Schema({

  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true,
    index: true
  },

  attendee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Attendee",
    required: true
  },

  phoneType: {
    type: String,
    enum: ["smartphone", "feature"],
    default: "smartphone"
  },

  checkInCode: {
    type: String,
    trim: true
  },

  qrCodeUrl: {
    type: String,
    trim: true
  },

  lastInstructionSentAt: Date,

  lastInstructionStatus: {
    type: String,
    enum: ["sent", "failed", "pending"],
    default: "pending"
  },

  lastInstructionError: {
    type: String,
    trim: true
  }

}, {
  timestamps: true
});

attendeeCheckinSchema.index({ event: 1, attendee: 1 }, { unique: true });

export default mongoose.model("AttendeeCheckin", attendeeCheckinSchema);
