import User from "../models/user.js";
import Event from "../models/event.js";
import AttendeeCheckin from "../models/attendeeCheckin.js";
import bcrypt from "bcryptjs";
import sendSMS from "../utils/sendSMS.js";

export const dashboardStats = async (req, res) => {

  const users = await User.countDocuments();

  const events = await Event.countDocuments();

  const checkins = await AttendeeCheckin.countDocuments();

  res.json({
    totalUsers: users,
    totalEvents: events,
    totalCheckins: checkins
  });

};

// SMS Configuration
export const getSMSConfig = async (req, res) => {
  try {
    const config = {
      accountSid: process.env.TWILIO_ACCOUNT_SID ? "configured" : "not configured",
      authToken: process.env.TWILIO_AUTH_TOKEN ? "configured" : "not configured",
      phoneNumber: process.env.TWILIO_PHONE_NUMBER || "not configured",
      isConfigured: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER)
    };
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: "Error fetching SMS config", error: error.message });
  }
};

export const testSMS = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    const result = await sendSMS(phoneNumber, "EventPro SMS Test: Your SMS configuration is working!");

    if (result.success) {
      res.json({ message: "SMS sent successfully", sid: result.sid });
    } else {
      res.status(500).json({ message: "Failed to send SMS", error: result.error });
    }
  } catch (error) {
    res.status(500).json({ message: "Error testing SMS", error: error.message });
  }
};

export const updateUserSMSSettings = async (req, res) => {
  try {
    const { userId, phone, smsEnabled } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (phone !== undefined) user.phone = phone;
    if (smsEnabled !== undefined) user.smsEnabled = smsEnabled;

    await user.save();

    res.json({ message: "User SMS settings updated successfully", user: { id: user._id, phone: user.phone, smsEnabled: user.smsEnabled } });
  } catch (error) {
    res.status(500).json({ message: "Error updating user SMS settings", error: error.message });
  }
};

export const getUsersWithSMS = async (req, res) => {
  try {
    const users = await User.find({ smsEnabled: true }).select("name email phone smsEnabled");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users with SMS enabled", error: error.message });
  }
};

export const getAllOrganizers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, sortBy = "createdAt", sortOrder = "desc" } = req.query;
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

    // Build query
    let query = { role: "organizer" };

    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    // Add status filter (if needed for future features)
    if (status) {
      query.isVerified = status === "verified";
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    const skip = (parsedPage - 1) * parsedLimit;

    // Get paginated organizers
    const organizers = await User.find(query)
      .select("name email phone role isVerified smsEnabled createdAt")
      .sort(sort)
      .limit(parsedLimit)
      .skip(skip);

    const total = await User.countDocuments(query);
    const organizerIds = organizers.map((organizer) => organizer._id);

    const statsByOrganizer = organizerIds.length > 0
      ? await Event.aggregate([
        { $match: { organizer: { $in: organizerIds } } },
        {
          $group: {
            _id: "$organizer",
            totalEvents: { $sum: 1 },
            upcomingEvents: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $gte: ["$date", new Date()] },
                      { $in: ["$status", ["draft", "published"]] }
                    ]
                  },
                  1,
                  0
                ]
              }
            }
          }
        }
      ])
      : [];

    const statsMap = new Map(
      statsByOrganizer.map((stats) => [
        stats._id.toString(),
        { totalEvents: stats.totalEvents, upcomingEvents: stats.upcomingEvents }
      ])
    );

    const organizersWithStats = organizers.map((organizer) => ({
      ...organizer.toObject(),
      stats: statsMap.get(organizer._id.toString()) || {
        totalEvents: 0,
        upcomingEvents: 0
      }
    }));

    res.json({
      organizers: organizersWithStats,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        pages: Math.ceil(total / parsedLimit)
      },
      summary: {
        totalOrganizers: total,
        verifiedOrganizers: organizersWithStats.filter(o => o.isVerified).length,
        smsEnabledOrganizers: organizersWithStats.filter(o => o.smsEnabled).length
      }
    });
  } catch (error) {
    console.error("Get all organizers error:", error);
    res.status(500).json({ message: "Error fetching organizers", error: error.message });
  }
};

export const getOrganizerDetails = async (req, res) => {
  try {
    const { organizerId } = req.params;

    const organizer = await User.findById(organizerId)
      .select("name email phone role isVerified smsEnabled createdAt");

    if (!organizer || organizer.role !== "organizer") {
      return res.status(404).json({ message: "Organizer not found" });
    }

    // Get organizer's events
    const events = await Event.find({ organizer: organizerId })
      .select("title date location status expectedAttendees createdAt")
      .sort({ createdAt: -1 })
      .limit(10);

    const eventStats = {
      totalEvents: await Event.countDocuments({ organizer: organizerId }),
      upcomingEvents: await Event.countDocuments({
        organizer: organizerId,
        date: { $gte: new Date() },
        status: { $in: ["draft", "published"] }
      }),
      completedEvents: await Event.countDocuments({
        organizer: organizerId,
        status: "completed"
      })
    };

    res.json({
      organizer: {
        ...organizer.toObject(),
        stats: eventStats
      },
      recentEvents: events
    });
  } catch (error) {
    console.error("Get organizer details error:", error);
    res.status(500).json({ message: "Error fetching organizer details", error: error.message });
  }
};

export const updateOrganizerStatus = async (req, res) => {
  try {
    const { organizerId } = req.params;
    const { isVerified, smsEnabled } = req.body;

    const organizer = await User.findById(organizerId);

    if (!organizer || organizer.role !== "organizer") {
      return res.status(404).json({ message: "Organizer not found" });
    }

    if (isVerified !== undefined) organizer.isVerified = isVerified;
    if (smsEnabled !== undefined) organizer.smsEnabled = smsEnabled;

    await organizer.save();

    res.json({
      message: "Organizer status updated successfully",
      organizer: {
        id: organizer._id,
        name: organizer.name,
        email: organizer.email,
        isVerified: organizer.isVerified,
        smsEnabled: organizer.smsEnabled
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating organizer status", error: error.message });
  }
};

export const resetOrganizerPassword = async (req, res) => {
  try {
    const { organizerId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters long" });
    }

    const organizer = await User.findById(organizerId);

    if (!organizer) {
      return res.status(404).json({ message: "Organizer not found" });
    }

    if (organizer.role !== "organizer") {
      return res.status(400).json({ message: "Target user is not an organizer" });
    }

    organizer.password = await bcrypt.hash(newPassword, 10);
    organizer.resetToken = undefined;
    await organizer.save();

    res.json({
      message: "Organizer password reset successfully",
      organizer: {
        id: organizer._id,
        name: organizer.name,
        email: organizer.email,
        role: organizer.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Error resetting organizer password", error: error.message });
  }
};
