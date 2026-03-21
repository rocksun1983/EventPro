import mongoose from "mongoose";

const attendeeSchema = new mongoose.Schema({

  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  firstName: {
    type: String,
    required: [true, "First name is required"],
    trim: true
  },

  lastName: {
    type: String,
    required: [true, "Last name is required"],
    trim: true
  },

  email: {
    type: String,
    required: [true, "Email is required"],
    trim: true,
    lowercase: true
  },

  phone: {
    type: String,
    required: [true, "Phone number is required"],
    trim: true
  },

  ticketType: {
    type: String,
    trim: true
  },
  ticketId: {
    type: String,
    trim: true
  },
  registrationStatus: {
    type: String,
    enum: ["confirmed", "pending", "cancelled"],
    default: "pending"
  },

  status: {
    type: String,
    enum: ["registered", "checked_in", "cancelled"],
    default: "registered"
  },

  source: {
    type: String,
    enum: ["import", "manual"],
    default: "import"
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }

}, {
  timestamps: true
});

attendeeSchema.index({ event: 1, email: 1 }, { unique: true });
attendeeSchema.index({ ticketId: 1 }, { unique: true, sparse: true });

export default mongoose.model("Attendee", attendeeSchema);
