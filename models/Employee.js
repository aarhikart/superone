import mongoose from "mongoose";

const EmployeeSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    employeeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      default: "",
      trim: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    jobTitle: {
      type: String,
      required: true,
      trim: true,
    },
    dateOfJoining: {
      type: Date,
      required: true,
    },
    employmentStatus: {
      type: String,
      enum: ["Full-time", "Part-time", "Contract", "Intern"],
      default: "Full-time",
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    personalAnniversaryDate: {
      type: Date,
      default: null,
    },
    sendBirthdayEmail: {
      type: Boolean,
      default: true,
    },
    sendWorkAnniversaryEmail: {
      type: Boolean,
      default: true,
    },
    sendPersonalAnniversaryEmail: {
      type: Boolean,
      default: true,
    },
    avatar: {
      type: String,
      default: "",
      trim: true,
    },
    customImages: {
      birthdayImageUrl: { type: String, default: "" },
      workAnniversaryImageUrl: { type: String, default: "" },
      personalAnniversaryImageUrl: { type: String, default: "" },
    },
    status: {
      type: String,
      enum: ["Active", "On Leave", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Employee ||
  mongoose.model("Employee", EmployeeSchema);
