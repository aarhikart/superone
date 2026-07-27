import mongoose from "mongoose";

const AdminUserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["Admin", "HR", "Marketing"],
      required: true,
    },
    createdBy: {
      type: String,
      default: "system",
      trim: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    otpCode: {
      type: String,
      default: null,
    },
    otpExpiresAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.models.AdminUser ||
  mongoose.model("AdminUser", AdminUserSchema);
