import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import attendeeRoutes from "./routes/attendeeRoutes.js"; // Attendee import/template routes
import attendeeSelfRegistrationRoutes from "./routes/attendeeSelfRegistrationRoutes.js"; // Self-registration routes
import checkinRoutes from "./routes/checkinRoutes.js"; // Attendee check-in instructions
import eventSaveRoutes from "./routes/eventSaveRoutes.js"; // Event save routes
import vendorRoutes from "./routes/vendorRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

import startReminderService from "./utils/reminderScheduler.js";

dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);

// Event-related routes (organized)
app.use("/api/events", eventRoutes); // Event management endpoints
app.use("/api/events", attendeeRoutes); // Attendee import endpoints
app.use("/api/events", attendeeSelfRegistrationRoutes); // Attendee self-registration
app.use("/api/events", eventSaveRoutes); // Event save endpoints
app.use("/api/events", checkinRoutes); // Check-in instruction endpoints

// Other routes
app.use("/api/vendors", vendorRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Start reminder service
startReminderService();

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});