import mongoose from "mongoose";

const CelebrationLogSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: false,
    },
    employeeName: {
      type: String,
      required: true,
      trim: true,
    },
    employeeEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    celebrationType: {
      type: String,
      enum: ["Birthday", "Work Anniversary", "Personal Anniversary", "Custom"],
      required: true,
    },
    celebrationDate: {
      type: Date,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    assetImageUrl: {
      type: String,
      default: "",
    },
    assetTitle: {
      type: String,
      default: "",
    },
    subject: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["SENT", "FAILED", "SENDING", "PENDING"],
      default: "SENDING",
    },
    errorMessage: {
      type: String,
      default: "",
    },
    to: [{ type: String, trim: true }],
    cc: [{ type: String, trim: true }],
    bcc: [{ type: String, trim: true }],
    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Prevent duplicate sends for the same employee, celebration type, and year
CelebrationLogSchema.index(
  { employeeId: 1, celebrationType: 1, year: 1 },
  { unique: true, sparse: true }
);

export default mongoose.models.CelebrationLog ||
  mongoose.model("CelebrationLog", CelebrationLogSchema);
