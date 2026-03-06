import User from "../models/user.js";
import Event from "../models/event.js";
import Vendor from "../models/vendor.js";

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