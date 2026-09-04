import mongoose from "mongoose";

const EmailGroupSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  emails: [{ type: String, trim: true, lowercase: true }],
  description: { type: String, default: "", trim: true },
  groupType: {
    type: String,
    enum: ["CC", "BCC", "ALL"],
    default: "CC",
  },
});

const CelebrationConfigSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: true },
  subject: { type: String, required: true, default: "" },
  heading: { type: String, required: true, default: "" },
  bodyMessage: { type: String, required: true, default: "" },
  ccGroups: [{ type: String, trim: true }],
  bccGroups: [{ type: String, trim: true }],
  directCcEmails: [{ type: String, trim: true, lowercase: true }],
  directBccEmails: [{ type: String, trim: true, lowercase: true }],
  lastUsedAssetIndex: { type: Number, default: 0 },
});

const CelebrationSettingSchema = new mongoose.Schema(
  {
    birthdayScheduleTime: {
      type: String,
      default: "09:00 AM",
      trim: true,
    },
    workAnniversaryScheduleTime: {
      type: String,
      default: "09:00 AM",
      trim: true,
    },
    personalAnniversaryScheduleTime: {
      type: String,
      default: "10:00 AM",
      trim: true,
    },
    timezone: {
      type: String,
      default: "Asia/Kolkata (IST)",
      trim: true,
    },
    // Global dynamic CC and BCC email addresses applied to all celebration types
    globalDirectCcEmails: [{ type: String, trim: true, lowercase: true }],
    globalDirectBccEmails: [{ type: String, trim: true, lowercase: true }],
    emailGroups: [EmailGroupSchema],
    birthdayConfig: {
      type: CelebrationConfigSchema,
      default: () => ({
        enabled: true,
        subject: "🎉 Happy Birthday, {firstName}!",
        heading: "Wishing You a Fantastic Birthday, {firstName}!",
        bodyMessage:
          "On behalf of the entire team at PeoplePulse, we wish you a wonderful birthday filled with happiness, health, and success. Thank you for bringing your positive energy, dedication, and talent to our team every single day!",
        ccGroups: [],
        bccGroups: [],
        directCcEmails: [],
        directBccEmails: [],
        lastUsedAssetIndex: 0,
      }),
    },
    workAnniversaryConfig: {
      type: CelebrationConfigSchema,
      default: () => ({
        enabled: true,
        subject: "🏆 Congratulations on Your Work Anniversary, {firstName}!",
        heading: "Congratulations on {years} Years, {firstName}!",
        bodyMessage:
          "Happy Work Anniversary! We truly appreciate your continuous dedication, commitment, and valuable contributions to our organization. Here is to celebrating your wonderful journey and achieving many more great milestones together!",
        ccGroups: [],
        bccGroups: [],
        directCcEmails: [],
        directBccEmails: [],
        lastUsedAssetIndex: 0,
      }),
    },
    personalAnniversaryConfig: {
      type: CelebrationConfigSchema,
      default: () => ({
        enabled: true,
        subject: "💐 Warmest Wishes on Your Special Milestone, {firstName}!",
        heading: "Happy Milestone Celebration, {firstName}!",
        bodyMessage:
          "Sending our warmest thoughts and heartfelt wishes as you celebrate this special personal anniversary today! May your journey ahead continue to be filled with happiness, love, and prosperous achievements.",
        ccGroups: [],
        bccGroups: [],
        directCcEmails: [],
        directBccEmails: [],
        lastUsedAssetIndex: 0,
      }),
    },
  },
  { timestamps: true }
);

export default mongoose.models.CelebrationSetting ||
  mongoose.model("CelebrationSetting", CelebrationSettingSchema);
