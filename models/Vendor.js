import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema({

  name: String,

  serviceType: String,

  phone: String,

  email: String,

  assignedEvent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event"
  }

});

export default mongoose.model("Vendor", vendorSchema);