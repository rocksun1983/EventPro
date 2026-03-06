import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema({

 guestName: String,

 guestEmail: String,

 eventId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Event"
 },

 ticketId: String,

 qrCode: String,

 checkedIn: {
  type: Boolean,
  default: false
 }

});

export default mongoose.model("Ticket", ticketSchema);