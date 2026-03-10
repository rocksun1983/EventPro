import mongoose from "mongoose";

const attendeeCheckinSendSchema = new mongoose.Schema({

  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  status: {
    type: String,
    enum: ["queued", "processing", "completed", "failed"],
    default: "queued"
  },

  progress: {
    total: { type: Number, default: 0 },
    processed: { type: Number, default: 0 },
    percent: { type: Number, default: 0 }
  },

  summary: {
    sent: { type: Number, default: 0 },
    failed: { type: Number, default: 0 }
  },

  failed: [{
    name: String,
    phone: String,
    error: String
  }]

}, {
  timestamps: true
});

export default mongoose.model("AttendeeCheckinSend", attendeeCheckinSendSchema);
