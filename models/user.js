import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, "Name is required"],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, "Name is required"],
    trim: true
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    select: false
  },
  phone: String, // For SMS notifications
  role: {
    type: String,
    enum: ["user", "organizer", "admin"],
    default: "user"
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  verificationTokenExpiry: Date,
  resetToken: String,
  resetTokenExpiry: Date,
  smsEnabled: {
    type: Boolean,
    default: false
  },
  appwriteId: String
  },
{
  timestamps: true
});

export default mongoose.model("User", userSchema);
