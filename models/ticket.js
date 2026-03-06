import mongoose from "mongoose"

const ticketSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event"
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    qrCode: {
      type: String,
      unique: true
    },

    smsCode: String,

    checkedIn: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
)

export default mongoose.model("Ticket", ticketSchema)