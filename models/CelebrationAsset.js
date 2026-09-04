import mongoose from "mongoose";

const CelebrationAssetSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ["Birthdays", "Work Anniversaries", "Personal Anniversaries"],
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
      trim: true,
    },
    targetAudience: {
      type: String,
      default: "All Staff",
      trim: true,
    },
    iconType: {
      type: String,
      default: "cake",
      trim: true,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    lastUsedAt: {
      type: Date,
      default: null,
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.CelebrationAsset ||
  mongoose.model("CelebrationAsset", CelebrationAssetSchema);
