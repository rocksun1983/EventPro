import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
    description: {
    type: String,
  },
    date: {
    type: Date,
    required: true,
  },
    location: {
    type: String,
    required: true,
  },
    organizer: {
    type: String,
    required: true,
  },
    createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
}, { timestamps: true }
);