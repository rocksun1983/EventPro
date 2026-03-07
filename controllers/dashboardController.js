import Ticket from "../models/ticket.js";

export const getAttendanceStats = async (req, res) => {

 const totalGuests = await Ticket.countDocuments();

 const checkedInGuests = await Ticket.countDocuments({ checkedIn: true });

 const remainingGuests = totalGuests - checkedInGuests;

 const attendanceRate = totalGuests > 0
  ? ((checkedInGuests / totalGuests) * 100).toFixed(2)
  : "0.00";

 res.json({
  totalGuests,
  checkedInGuests,
  remainingGuests,
  attendanceRate
 });

};
