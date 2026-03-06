import Ticket from "../models/Ticket.js";

export const getAttendanceStats = async (req, res) => {

 const totalGuests = await Ticket.countDocuments();

 const checkedInGuests = await Ticket.countDocuments({ checkedIn: true });

 const remainingGuests = totalGuests - checkedInGuests;

 const attendanceRate = ((checkedInGuests / totalGuests) * 100).toFixed(2);

 res.json({
  totalGuests,
  checkedInGuests,
  remainingGuests,
  attendanceRate
 });

};