import mongoose from "mongoose";

const attendeeImportSchema = new mongoose.Schema({

  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  fileName: {
    type: String,
    trim: true
  },

  status: {
    type: String,
    enum: ["queued", "processing", "completed", "failed"],
    default: "queued"
  },

  progress: {
    totalRows: { type: Number, default: 0 },
    processedRows: { type: Number, default: 0 },
    percent: { type: Number, default: 0 }
  },

  summary: {
    totalRows: { type: Number, default: 0 },
    successful: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    duplicates: { type: Number, default: 0 }
  },

  importErrors: [{
    row: Number,
    field: String,
    message: String
  }],

  duplicates: [{
    row: Number,
    name: String,
    fields: [String]
  }]

}, {
  timestamps: true
});

export default mongoose.model("AttendeeImport", attendeeImportSchema);
