import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({

  title: {
    type: String,
    required: [true, "Event title is required"],
    trim: true
  },

  description: {
    type: String,
    trim: true
  },

  date: {
    type: Date,
    required: [true, "Event date is required"]
  },

  location: {
    type: String,
    required: [true, "Event location/venue is required"],
    trim: true
  },

  expectedAttendees: {
    type: Number,
    default: 0,
    min: [0, "Expected attendees cannot be negative"]
  },

  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  reminderSent: {
    type: Boolean,
    default: false
  },

  status: {
    type: String,
    enum: ["draft", "published", "cancelled", "completed"],
    default: "draft"
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

export default mongoose.model("Event", eventSchema);