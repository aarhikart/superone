import mongoose from "mongoose";

const ManualCelebrationSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
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
    jobTitle: {
      type: String,
      default: "Team Member",
      trim: true,
    },
    department: {
      type: String,
      default: "General",
      trim: true,
    },
    celebrationType: {
      type: String,
      enum: ["Birthday", "Work Anniversary", "Personal Anniversary", "Custom"],
      default: "Custom",
    },
    customTitle: {
      type: String,
      required: true,
      trim: true,
    },
    celebrationDate: {
      type: Date,
      required: true,
    },
    message: {
      type: String,
      default: "",
      trim: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    assetImageUrl: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["Scheduled", "Sent", "Cancelled"],
      default: "Scheduled",
    },
  },
  { timestamps: true }
);

export default mongoose.models.ManualCelebration ||
  mongoose.model("ManualCelebration", ManualCelebrationSchema);
