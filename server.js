import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import attendeeRoutes from "./routes/attendeeRoutes.js"; // Attendee import/template routes (new)
// import checkinRoutes from "./routes/checkinRoutes.js"; // Attendee check-in instructions (new)
import vendorRoutes from "./routes/vendorRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import checkinRoutes from "./routes/checkinRoutes.js";

import startReminderService from "./utils/reminderScheduler.js";

dotenv.config();

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

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

app.use("/api/auth", authRoutes);

// Attendee import endpoints live under the events base path.
app.use("/api/events", attendeeRoutes);
// Check-in instruction endpoints live under the events base path.
app.use("/api/events", checkinRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/checkin", checkinRoutes);

startReminderService();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
