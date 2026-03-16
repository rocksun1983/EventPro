import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import attendeeRoutes from "./routes/attendeeRoutes.js"; 
import attendeeSelfRegistrationRoutes from "./routes/attendeeSelfRegistrationRoutes.js"; 
import checkinRoutes from "./routes/checkinRoutes.js"; 
import eventSaveRoutes from "./routes/eventSaveRoutes.js"; 
// import vendorRoutes from "./routes/vendorRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import smsRoutes from "./routes/smsRoutes.js";
import organizerDashboardRoutes from "./routes/organizerDashboardRoutes.js";

import startReminderService from "./utils/reminderScheduler.js";

dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Swagger docs
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "EventPro API",
      version: "1.0.0",
      description: "API documentation for EventPro."
    },
    servers: [{ url: "/api" }]
  },
  apis: ["./docs/swagger.js"]
});

app.get("/api/docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.get("/", (req, res) => {
  res.send("Welcome to the EventPro API");
});

app.use("/api/auth", authRoutes);

// Event-related routes
app.use("/api/events", eventRoutes); // Event management endpoints
app.use("/api/events", attendeeRoutes); // Attendee import endpoints
app.use("/api/events", attendeeSelfRegistrationRoutes); // Attendee self-registration
app.use("/api/events", eventSaveRoutes); // Event save endpoints
app.use("/api/events", checkinRoutes); // Check-in instruction endpoints

// Other routes
// app.use("/api/vendors", vendorRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/sms", smsRoutes);
app.use("/api/organizer/dashboard", organizerDashboardRoutes);

// Start reminder service
startReminderService();

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
