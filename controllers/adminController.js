import User from "../models/User.js";
import Event from "../models/Event.js";
import Vendor from "../models/Vendor.js";

export const dashboardStats = async (req, res) => {

  const users = await User.countDocuments();

  const events = await Event.countDocuments();

  const vendors = await Vendor.countDocuments();

  res.json({
    totalUsers: users,
    totalEvents: events,
    totalVendors: vendors
  });

};