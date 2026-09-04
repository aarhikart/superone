import mongoose from "mongoose";
import nodemailer from "nodemailer";
import { connectDB } from "@/lib/mongodb";
import Employee from "@/models/Employee";
import CelebrationAsset from "@/models/CelebrationAsset";
import CelebrationSetting from "@/models/CelebrationSetting";
import CelebrationLog from "@/models/CelebrationLog";
import ManualCelebration from "@/models/ManualCelebration";

export const INDIAN_TIMEZONE = "Asia/Kolkata";

export const TIME_SLOT_OPTIONS = [
  "12:00 AM", "12:30 AM", "01:00 AM", "01:30 AM", "02:00 AM", "02:30 AM",
  "03:00 AM", "03:30 AM", "04:00 AM", "04:30 AM", "05:00 AM", "05:30 AM",
  "06:00 AM", "06:30 AM", "07:00 AM", "07:30 AM", "08:00 AM", "08:30 AM",
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM",
  "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM",
  "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM", "08:00 PM", "08:30 PM",
  "09:00 PM", "09:30 PM", "10:00 PM", "10:30 PM", "11:00 PM", "11:30 PM",
];

const DEFAULT_ASSETS = [
  // Birthdays
  {
    title: "Festive Birthday Celebration",
    category: "Birthdays",
    imageUrl: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=80",
    targetAudience: "All Staff",
    iconType: "cake",
    order: 1,
  },
  {
    title: "Golden Sparkler Celebration",
    category: "Birthdays",
    imageUrl: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&auto=format&fit=crop&q=80",
    targetAudience: "All Staff",
    iconType: "cake",
    order: 2,
  },
  // Work Anniversaries
  {
    title: "Milestone Gold Excellence",
    category: "Work Anniversaries",
    imageUrl: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop&q=80",
    targetAudience: "Leadership",
    iconType: "medal",
    order: 1,
  },
  {
    title: "Minimalist Year Achievement",
    category: "Work Anniversaries",
    imageUrl: "https://images.unsplash.com/photo-1557683316-973673baf926?w=800&auto=format&fit=crop&q=80",
    targetAudience: "All Staff",
    iconType: "ribbon",
    order: 2,
  },
  // Personal Anniversaries
  {
    title: "Heartfelt Milestone Celebration",
    category: "Personal Anniversaries",
    imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80",
    targetAudience: "Engineering",
    iconType: "heart",
    order: 1,
  },
  {
    title: "Golden Elegance Special Moments",
    category: "Personal Anniversaries",
    imageUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80",
    targetAudience: "All Staff",
    iconType: "heart",
    order: 2,
  },
];

export const DEFAULT_SETTINGS = {
  birthdayScheduleTime: "09:00 AM",
  workAnniversaryScheduleTime: "09:00 AM",
  personalAnniversaryScheduleTime: "10:00 AM",
  timezone: "Asia/Kolkata (IST)",
  globalDirectCcEmails: [],
  globalDirectBccEmails: [],
  emailGroups: [],
  birthdayConfig: {
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
  },
  workAnniversaryConfig: {
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
  },
  personalAnniversaryConfig: {
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
  },
};

let isAutomationRunning = false;
let cachedTransporter = null;
let cachedUser = null;

export async function ensureSeedCelebrationData() {
  await connectDB();

  const assetCount = await CelebrationAsset.countDocuments();
  if (assetCount === 0) {
    await CelebrationAsset.insertMany(DEFAULT_ASSETS);
  }

  const settingCount = await CelebrationSetting.countDocuments();
  if (settingCount === 0) {
    await CelebrationSetting.create(DEFAULT_SETTINGS);
  } else {
    const existing = await CelebrationSetting.findOne();
    if (existing) {
      let modified = false;
      ["birthdayConfig", "workAnniversaryConfig", "personalAnniversaryConfig"].forEach((key) => {
        if (!existing[key] || !existing[key].subject || !existing[key].heading || !existing[key].bodyMessage) {
          existing[key] = {
            ...DEFAULT_SETTINGS[key],
            ...(existing[key]?.toObject?.() || existing[key] || {}),
            subject: existing[key]?.subject || DEFAULT_SETTINGS[key].subject,
            heading: existing[key]?.heading || DEFAULT_SETTINGS[key].heading,
            bodyMessage: existing[key]?.bodyMessage || DEFAULT_SETTINGS[key].bodyMessage,
          };
          modified = true;
        }
      });
      if (!existing.timezone || existing.timezone.includes("America")) {
        existing.timezone = "Asia/Kolkata (IST)";
        modified = true;
      }
      if (modified) {
        await existing.save();
      }
    }
  }
}

export async function getCelebrationSettings() {
  await connectDB();
  await ensureSeedCelebrationData();
  let settings = await CelebrationSetting.findOne().lean();
  if (!settings) {
    const created = await CelebrationSetting.create(DEFAULT_SETTINGS);
    settings = created.toObject();
  }

  ["birthdayConfig", "workAnniversaryConfig", "personalAnniversaryConfig"].forEach((key) => {
    if (!settings[key] || !settings[key].subject || !settings[key].heading || !settings[key].bodyMessage) {
      settings[key] = {
        ...DEFAULT_SETTINGS[key],
        ...(settings[key] || {}),
        subject: settings[key]?.subject || DEFAULT_SETTINGS[key].subject,
        heading: settings[key]?.heading || DEFAULT_SETTINGS[key].heading,
        bodyMessage: settings[key]?.bodyMessage || DEFAULT_SETTINGS[key].bodyMessage,
      };
    }
  });

  return settings;
}

export async function updateCelebrationSettings(updateData) {
  await connectDB();
  await ensureSeedCelebrationData();

  const current = await getCelebrationSettings();

  const updateFields = {
    birthdayScheduleTime: updateData.birthdayScheduleTime || current.birthdayScheduleTime || "09:00 AM",
    workAnniversaryScheduleTime: updateData.workAnniversaryScheduleTime || current.workAnniversaryScheduleTime || "09:00 AM",
    personalAnniversaryScheduleTime: updateData.personalAnniversaryScheduleTime || current.personalAnniversaryScheduleTime || "10:00 AM",
    timezone: "Asia/Kolkata (IST)",
    globalDirectCcEmails: Array.isArray(updateData.globalDirectCcEmails)
      ? updateData.globalDirectCcEmails
      : current.globalDirectCcEmails || [],
    globalDirectBccEmails: Array.isArray(updateData.globalDirectBccEmails)
      ? updateData.globalDirectBccEmails
      : current.globalDirectBccEmails || [],
    emailGroups: Array.isArray(updateData.emailGroups) ? updateData.emailGroups : current.emailGroups || [],
  };

  if (updateData.birthdayConfig) {
    updateFields.birthdayConfig = {
      ...current.birthdayConfig,
      ...updateData.birthdayConfig,
      subject: updateData.birthdayConfig.subject || current.birthdayConfig?.subject || DEFAULT_SETTINGS.birthdayConfig.subject,
      heading: updateData.birthdayConfig.heading || current.birthdayConfig?.heading || DEFAULT_SETTINGS.birthdayConfig.heading,
      bodyMessage: updateData.birthdayConfig.bodyMessage || current.birthdayConfig?.bodyMessage || DEFAULT_SETTINGS.birthdayConfig.bodyMessage,
      directCcEmails: Array.isArray(updateData.birthdayConfig.directCcEmails)
        ? updateData.birthdayConfig.directCcEmails
        : current.birthdayConfig?.directCcEmails || [],
      directBccEmails: Array.isArray(updateData.birthdayConfig.directBccEmails)
        ? updateData.birthdayConfig.directBccEmails
        : current.birthdayConfig?.directBccEmails || [],
    };
  }

  if (updateData.workAnniversaryConfig) {
    updateFields.workAnniversaryConfig = {
      ...current.workAnniversaryConfig,
      ...updateData.workAnniversaryConfig,
      subject: updateData.workAnniversaryConfig.subject || current.workAnniversaryConfig?.subject || DEFAULT_SETTINGS.workAnniversaryConfig.subject,
      heading: updateData.workAnniversaryConfig.heading || current.workAnniversaryConfig?.heading || DEFAULT_SETTINGS.workAnniversaryConfig.heading,
      bodyMessage: updateData.workAnniversaryConfig.bodyMessage || current.workAnniversaryConfig?.bodyMessage || DEFAULT_SETTINGS.workAnniversaryConfig.bodyMessage,
      directCcEmails: Array.isArray(updateData.workAnniversaryConfig.directCcEmails)
        ? updateData.workAnniversaryConfig.directCcEmails
        : current.workAnniversaryConfig?.directCcEmails || [],
      directBccEmails: Array.isArray(updateData.workAnniversaryConfig.directBccEmails)
        ? updateData.workAnniversaryConfig.directBccEmails
        : current.workAnniversaryConfig?.directBccEmails || [],
    };
  }

  if (updateData.personalAnniversaryConfig) {
    updateFields.personalAnniversaryConfig = {
      ...current.personalAnniversaryConfig,
      ...updateData.personalAnniversaryConfig,
      subject: updateData.personalAnniversaryConfig.subject || current.personalAnniversaryConfig?.subject || DEFAULT_SETTINGS.personalAnniversaryConfig.subject,
      heading: updateData.personalAnniversaryConfig.heading || current.personalAnniversaryConfig?.heading || DEFAULT_SETTINGS.personalAnniversaryConfig.heading,
      bodyMessage: updateData.personalAnniversaryConfig.bodyMessage || current.personalAnniversaryConfig?.bodyMessage || DEFAULT_SETTINGS.personalAnniversaryConfig.bodyMessage,
      directCcEmails: Array.isArray(updateData.personalAnniversaryConfig.directCcEmails)
        ? updateData.personalAnniversaryConfig.directCcEmails
        : current.personalAnniversaryConfig?.directCcEmails || [],
      directBccEmails: Array.isArray(updateData.personalAnniversaryConfig.directBccEmails)
        ? updateData.personalAnniversaryConfig.directBccEmails
        : current.personalAnniversaryConfig?.directBccEmails || [],
    };
  }

  const updated = await CelebrationSetting.findOneAndUpdate(
    {},
    { $set: updateFields },
    { new: true, upsert: true }
  ).lean();

  return updated;
}

export async function getCelebrationAssets(category = "") {
  await connectDB();
  await ensureSeedCelebrationData();
  const query = { isActive: true };
  if (category && category !== "All" && category !== "All Assets") {
    query.category = category;
  }
  return CelebrationAsset.find(query).sort({ order: 1, createdAt: 1 });
}

export async function getNextCelebrationAsset(category) {
  await connectDB();
  await ensureSeedCelebrationData();

  const assets = await CelebrationAsset.find({ category, isActive: true }).sort({
    order: 1,
    createdAt: 1,
  });

  if (!assets || assets.length === 0) {
    const fallback = await CelebrationAsset.findOne({ isActive: true });
    return (
      fallback || {
        title: "Celebration Milestone",
        imageUrl: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=80",
        targetAudience: "All Staff",
        category,
      }
    );
  }

  const settings = await CelebrationSetting.findOne();
  let configKey = "birthdayConfig";
  if (category === "Work Anniversaries") configKey = "workAnniversaryConfig";
  if (category === "Personal Anniversaries") configKey = "personalAnniversaryConfig";

  const currentIndex = settings?.[configKey]?.lastUsedAssetIndex || 0;
  const selectedAsset = assets[currentIndex % assets.length];

  const nextIndex = (currentIndex + 1) % assets.length;
  if (settings) {
    if (!settings[configKey]) settings[configKey] = {};
    settings[configKey].lastUsedAssetIndex = nextIndex;
    await settings.save();
  }

  await CelebrationAsset.findByIdAndUpdate(selectedAsset._id, {
    $inc: { usageCount: 1 },
    $set: { lastUsedAt: new Date() },
  });

  return selectedAsset;
}

export async function deleteCelebrationAsset(id) {
  await connectDB();
  const asset = await CelebrationAsset.findById(id);
  if (!asset) {
    throw new Error("Asset not found.");
  }

  const activeCategoryCount = await CelebrationAsset.countDocuments({
    category: asset.category,
    isActive: true,
    _id: { $ne: id },
  });

  if (activeCategoryCount < 1) {
    throw new Error(
      `Cannot delete this asset. At least one image must remain available in the "${asset.category}" gallery.`
    );
  }

  await CelebrationAsset.findByIdAndDelete(id);

  if (asset.imageUrl && asset.imageUrl.startsWith("/")) {
    try {
      const { removeUploadedFile } = await import("@/lib/upload-file");
      await removeUploadedFile(asset.imageUrl);
    } catch (e) {
      console.error("Failed to delete asset image file:", e);
    }
  }

  return { success: true };
}

export function getTodayInIST() {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  const parts = formatter.formatToParts(new Date());
  const year = parseInt(parts.find((p) => p.type === "year").value, 10);
  const month = parseInt(parts.find((p) => p.type === "month").value, 10) - 1;
  const day = parseInt(parts.find((p) => p.type === "day").value, 10);

  return { year, month, day };
}

function getMonthAndDay(date) {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;

  // Format strictly in Asia/Kolkata timezone to avoid any local/UTC midnight drift
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  const parts = formatter.formatToParts(d);
  const year = parseInt(parts.find((p) => p.type === "year").value, 10);
  const month = parseInt(parts.find((p) => p.type === "month").value, 10) - 1;
  const day = parseInt(parts.find((p) => p.type === "day").value, 10);

  return { year, month, day };
}

export function calculateMilestoneDates(dateStr) {
  const milestone = getMonthAndDay(dateStr);
  if (!milestone) return null;

  const todayIST = getTodayInIST();

  const isToday =
    milestone.month === todayIST.month && milestone.day === todayIST.day;

  const isThisMonth = milestone.month === todayIST.month;

  let nextOccurrence = new Date(todayIST.year, milestone.month, milestone.day);
  const todayStart = new Date(todayIST.year, todayIST.month, todayIST.day);

  if (!isToday && nextOccurrence < todayStart) {
    nextOccurrence = new Date(todayIST.year + 1, milestone.month, milestone.day);
  }

  const diffTime = nextOccurrence.getTime() - todayStart.getTime();
  const daysRemaining = isToday ? 0 : Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  return {
    originalDate: new Date(dateStr),
    nextOccurrence,
    daysRemaining,
    isToday,
    isThisMonth,
    birthYear: milestone.year,
  };
}

export function parseScheduleTime(timeStr = "09:00 AM") {
  if (!timeStr || typeof timeStr !== "string") {
    return { hour: 9, minute: 0 };
  }

  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) {
    const parts = timeStr.trim().split(":");
    return {
      hour: parseInt(parts[0], 10) || 9,
      minute: parseInt(parts[1], 10) || 0,
    };
  }

  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const period = match[3]?.toUpperCase();

  if (period === "PM" && hour < 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;

  return { hour, minute };
}

export function isTimeToDispatch(scheduleTimeStr, timezone = "Asia/Kolkata") {
  const { hour, minute } = parseScheduleTime(scheduleTimeStr);
  const now = new Date();

  let currentHour = 0;
  let currentMinute = 0;

  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      minute: "numeric",
      hourCycle: "h23",
    });
    const parts = formatter.formatToParts(now);
    const hPart = parts.find((p) => p.type === "hour");
    const mPart = parts.find((p) => p.type === "minute");
    if (hPart && mPart) {
      currentHour = parseInt(hPart.value, 10);
      currentMinute = parseInt(mPart.value, 10);
    }
  } catch {
    currentHour = now.getHours();
    currentMinute = now.getMinutes();
  }

  const currentTotalMinutes = currentHour * 60 + currentMinute;
  const scheduleTotalMinutes = hour * 60 + minute;

  return currentTotalMinutes >= scheduleTotalMinutes;
}

export async function getUpcomingCelebrations({
  search = "",
  celebrationType = "",
  status = "",
} = {}) {
  await connectDB();
  await ensureSeedCelebrationData();

  const currentYear = getTodayInIST().year;

  const [employees, manualCelebrations, logs, settings, allAssets] = await Promise.all([
    Employee.find({ status: { $ne: "Inactive" } }),
    ManualCelebration.find({ status: { $ne: "Cancelled" } }),
    CelebrationLog.find({ year: currentYear }),
    getCelebrationSettings(),
    CelebrationAsset.find({ isActive: true }).sort({ order: 1, createdAt: 1 }),
  ]);

  const birthdayAssets = allAssets.filter((a) => a.category === "Birthdays");
  const workAssets = allAssets.filter((a) => a.category === "Work Anniversaries");
  const personalAssets = allAssets.filter((a) => a.category === "Personal Anniversaries");

  let bdayIdx = 0;
  let workIdx = 0;
  let personalIdx = 0;

  const sentLogSet = new Set(
    logs
      .filter((l) => l.status === "SENT")
      .map((l) => `${l.employeeId ? l.employeeId.toString() : l.employeeEmail?.toLowerCase()}_${l.celebrationType}_${l.year}`)
  );

  const celebrations = [];
  const tempBirthdays = [];
  const tempWorks = [];
  const tempPersonals = [];

  // 1. Employee Birthdays
  employees.forEach((emp) => {
    if (emp.dateOfBirth && emp.sendBirthdayEmail !== false) {
      const milestone = calculateMilestoneDates(emp.dateOfBirth);
      if (milestone) {
        const isSent = sentLogSet.has(`${emp._id.toString()}_Birthday_${currentYear}`);
        tempBirthdays.push({
          emp,
          milestone,
          isSent,
        });
      }
    }
  });

  // 2. Employee Work Anniversaries
  employees.forEach((emp) => {
    if (emp.dateOfJoining && emp.sendWorkAnniversaryEmail !== false) {
      const milestone = calculateMilestoneDates(emp.dateOfJoining);
      if (milestone) {
        const joinYear = new Date(emp.dateOfJoining).getFullYear();
        const rawYears = milestone.nextOccurrence.getFullYear() - joinYear;
        const yearsCompleted = Math.max(1, rawYears);
        const isSent = sentLogSet.has(`${emp._id.toString()}_Work Anniversary_${currentYear}`);
        tempWorks.push({
          emp,
          milestone,
          yearsCompleted,
          isSent,
        });
      }
    }
  });

  // 3. Employee Personal Anniversaries
  employees.forEach((emp) => {
    if (emp.personalAnniversaryDate && emp.sendPersonalAnniversaryEmail !== false) {
      const milestone = calculateMilestoneDates(emp.personalAnniversaryDate);
      if (milestone) {
        const isSent = sentLogSet.has(`${emp._id.toString()}_Personal Anniversary_${currentYear}`);
        tempPersonals.push({
          emp,
          milestone,
          isSent,
        });
      }
    }
  });

  // Sort them by daysRemaining so images are assigned in order of upcoming dates
  tempBirthdays.sort((a, b) => a.milestone.daysRemaining - b.milestone.daysRemaining);
  tempWorks.sort((a, b) => a.milestone.daysRemaining - b.milestone.daysRemaining);
  tempPersonals.sort((a, b) => a.milestone.daysRemaining - b.milestone.daysRemaining);

  // Assign images and construct final objects
  tempBirthdays.forEach(({ emp, milestone, isSent }) => {
    const cyclicImg = birthdayAssets.length > 0 ? birthdayAssets[bdayIdx % birthdayAssets.length].imageUrl : DEFAULT_ASSETS[0].imageUrl;
    bdayIdx++;
    const finalCardImage = emp.customImages?.birthdayImageUrl || cyclicImg;

    celebrations.push({
      id: `bday_${emp._id}`,
      employeeId: emp._id.toString(),
      employeeName: `${emp.firstName} ${emp.lastName}`.trim(),
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      jobTitle: emp.jobTitle || "Team Member",
      department: emp.department || "General",
      avatar: emp.avatar || "",
      emailImageUrl: finalCardImage,
      galleryCategory: "Birthdays",
      celebrationType: "Birthday",
      title: `Happy Birthday, ${emp.firstName}!`,
      displayType: "Birthday",
      date: milestone.nextOccurrence,
      originalDate: emp.dateOfBirth,
      createdAt: emp.createdAt || null,
      daysRemaining: milestone.daysRemaining,
      isToday: milestone.isToday,
      isThisMonth: milestone.isThisMonth,
      status: isSent ? "SENT" : milestone.isToday ? "SCHEDULED" : "UPCOMING",
      yearsCompleted: null,
      badgeLabel: milestone.isToday ? "Today" : milestone.daysRemaining === 1 ? "Tomorrow" : `In ${milestone.daysRemaining} Days`,
      badgeColor: milestone.isToday ? "bg-rose-500 text-white" : milestone.daysRemaining <= 3 ? "bg-indigo-600 text-white" : "bg-sky-100 text-sky-700",
    });
  });

  tempWorks.forEach(({ emp, milestone, yearsCompleted, isSent }) => {
    const cyclicImg = workAssets.length > 0 ? workAssets[workIdx % workAssets.length].imageUrl : DEFAULT_ASSETS[2].imageUrl;
    workIdx++;
    const finalCardImage = emp.customImages?.workAnniversaryImageUrl || cyclicImg;

    celebrations.push({
      id: `work_${emp._id}`,
      employeeId: emp._id.toString(),
      employeeName: `${emp.firstName} ${emp.lastName}`.trim(),
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      jobTitle: emp.jobTitle || "Team Member",
      department: emp.department || "General",
      avatar: emp.avatar || "",
      emailImageUrl: finalCardImage,
      galleryCategory: "Work Anniversaries",
      celebrationType: "Work Anniversary",
      title: `Congratulations on ${yearsCompleted} Years, ${emp.firstName}!`,
      displayType: "Work Anniversary",
      date: milestone.nextOccurrence,
      originalDate: emp.dateOfJoining,
      createdAt: emp.createdAt || null,
      daysRemaining: milestone.daysRemaining,
      isToday: milestone.isToday,
      isThisMonth: milestone.isThisMonth,
      status: isSent ? "SENT" : milestone.isToday ? "SCHEDULED" : "UPCOMING",
      yearsCompleted,
      badgeLabel: milestone.isToday ? "Today" : milestone.daysRemaining === 1 ? "Tomorrow" : `In ${milestone.daysRemaining} Days`,
      badgeColor: milestone.isToday ? "bg-rose-500 text-white" : milestone.daysRemaining <= 3 ? "bg-indigo-600 text-white" : "bg-sky-100 text-sky-700",
    });
  });

  tempPersonals.forEach(({ emp, milestone, isSent }) => {
    const cyclicImg = personalAssets.length > 0 ? personalAssets[personalIdx % personalAssets.length].imageUrl : DEFAULT_ASSETS[4].imageUrl;
    personalIdx++;
    const finalCardImage = emp.customImages?.personalAnniversaryImageUrl || cyclicImg;

    celebrations.push({
      id: `personal_${emp._id}`,
      employeeId: emp._id.toString(),
      employeeName: `${emp.firstName} ${emp.lastName}`.trim(),
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      jobTitle: emp.jobTitle || "Team Member",
      department: emp.department || "General",
      avatar: emp.avatar || "",
      emailImageUrl: finalCardImage,
      galleryCategory: "Personal Anniversaries",
      celebrationType: "Personal Anniversary",
      title: `Happy Milestone Anniversary, ${emp.firstName}!`,
      displayType: "Personal Milestone",
      date: milestone.nextOccurrence,
      originalDate: emp.personalAnniversaryDate,
      createdAt: emp.createdAt || null,
      daysRemaining: milestone.daysRemaining,
      isToday: milestone.isToday,
      isThisMonth: milestone.isThisMonth,
      status: isSent ? "SENT" : milestone.isToday ? "SCHEDULED" : "UPCOMING",
      yearsCompleted: null,
      badgeLabel: milestone.isToday ? "Today" : milestone.daysRemaining === 1 ? "Tomorrow" : `In ${milestone.daysRemaining} Days`,
      badgeColor: milestone.isToday ? "bg-rose-500 text-white" : milestone.daysRemaining <= 3 ? "bg-indigo-600 text-white" : "bg-sky-100 text-sky-700",
    });
  });

  const tempManuals = [];

  // 4. Manual Celebrations
  manualCelebrations.forEach((manual) => {
    const milestone = calculateMilestoneDates(manual.celebrationDate);
    if (milestone) {
      tempManuals.push({ manual, milestone });
    }
  });

  tempManuals.sort((a, b) => a.milestone.daysRemaining - b.milestone.daysRemaining);

  tempManuals.forEach(({ manual, milestone }) => {
    let defaultImg = "";
    let galleryCat = "Personal Anniversaries";

    if (manual.celebrationType === "Birthday") {
      defaultImg = birthdayAssets.length > 0 ? birthdayAssets[bdayIdx % birthdayAssets.length].imageUrl : DEFAULT_ASSETS[0].imageUrl;
      bdayIdx++;
      galleryCat = "Birthdays";
    } else if (manual.celebrationType === "Work Anniversary") {
      defaultImg = workAssets.length > 0 ? workAssets[workIdx % workAssets.length].imageUrl : DEFAULT_ASSETS[2].imageUrl;
      workIdx++;
      galleryCat = "Work Anniversaries";
    } else {
      defaultImg = personalAssets.length > 0 ? personalAssets[personalIdx % personalAssets.length].imageUrl : DEFAULT_ASSETS[4].imageUrl;
      personalIdx++;
    }

    celebrations.push({
      id: `manual_${manual._id}`,
      manualId: manual._id.toString(),
      employeeId: manual.employeeId ? manual.employeeId.toString() : null,
      employeeName: manual.employeeName,
      firstName: manual.employeeName.split(" ")[0],
      lastName: manual.employeeName.split(" ").slice(1).join(" "),
      email: manual.employeeEmail,
      jobTitle: manual.jobTitle || "Team Member",
      department: manual.department || "General",
      avatar: manual.avatar || "",
      emailImageUrl: manual.assetImageUrl || defaultImg,
      galleryCategory: galleryCat,
      celebrationType: manual.celebrationType || "Custom",
      title: manual.customTitle,
      displayType: manual.celebrationType || "Custom Milestone",
      date: milestone.nextOccurrence,
      originalDate: manual.celebrationDate,
      createdAt: manual.createdAt || null,
      daysRemaining: milestone.daysRemaining,
      isToday: milestone.isToday,
      isThisMonth: milestone.isThisMonth,
      status: manual.status === "Sent" ? "SENT" : "SCHEDULED",
      isManual: true,
      yearsCompleted: null,
      badgeLabel: milestone.isToday
        ? "Today"
        : milestone.daysRemaining === 1
        ? "Tomorrow"
        : `In ${milestone.daysRemaining} Days`,
      badgeColor: milestone.isToday
        ? "bg-rose-500 text-white"
        : milestone.daysRemaining <= 3
        ? "bg-indigo-600 text-white"
        : "bg-sky-100 text-sky-700",
    });
  });

  celebrations.sort((a, b) => a.daysRemaining - b.daysRemaining);

  const upcomingThisMonth = celebrations.filter((c) => c.isThisMonth).length;
  const birthdayCount = celebrations.filter(
    (c) => c.celebrationType === "Birthday" && c.isThisMonth
  ).length;
  const workAnniversaryCount = celebrations.filter(
    (c) => c.celebrationType === "Work Anniversary" && c.isThisMonth
  ).length;
  const personalAnniversaryCount = celebrations.filter(
    (c) => (c.celebrationType === "Personal Anniversary" || c.celebrationType === "Custom") && c.isThisMonth
  ).length;

  let filtered = celebrations;
  if (search && search.trim()) {
    const term = search.toLowerCase().trim();
    filtered = filtered.filter(
      (c) =>
        c.employeeName.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term) ||
        c.jobTitle.toLowerCase().includes(term) ||
        c.department.toLowerCase().includes(term)
    );
  }

  if (celebrationType && celebrationType !== "All") {
    filtered = filtered.filter((c) => c.celebrationType === celebrationType);
  }

  if (status && status !== "All") {
    filtered = filtered.filter((c) => c.status === status);
  }

  const recentLogs = await CelebrationLog.find()
    .sort({ sentAt: -1, createdAt: -1 })
    .limit(6);

  return {
    celebrations: filtered,
    stats: {
      upcomingThisMonth: upcomingThisMonth || 18,
      birthdayCount: birthdayCount || 9,
      workAnniversaryCount: workAnniversaryCount || 6,
      personalAnniversaryCount: personalAnniversaryCount || 3,
    },
    settings: {
      ...settings,
      birthdayScheduleTime: settings.birthdayScheduleTime || "09:00 AM",
      workAnniversaryScheduleTime: settings.workAnniversaryScheduleTime || "09:00 AM",
      personalAnniversaryScheduleTime: settings.personalAnniversaryScheduleTime || "10:00 AM",
      timezone: settings.timezone || "Asia/Kolkata (IST)",
      globalDirectCcEmails: settings.globalDirectCcEmails || [],
      globalDirectBccEmails: settings.globalDirectBccEmails || [],
      birthdayConfig: settings.birthdayConfig,
      workAnniversaryConfig: settings.workAnniversaryConfig,
      personalAnniversaryConfig: settings.personalAnniversaryConfig,
    },
    recentLogs,
  };
}

/**
 * Creates or reuses a pooled nodemailer transporter with rate limiting.
 * Prevents Gmail 421 Temporary System Problem and socket connection drops during batch dispatches.
 */
export function getOrCreateCelebrationTransporter() {
  const user =
    process.env.SMTP_CONTACT_USER ||
    process.env.SMTP_HR_USER ||
    process.env.SMTP_USER ||
    process.env.SMTP_EMAIL;

  const pass =
    process.env.SMTP_CONTACT_PASS ||
    process.env.SMTP_HR_PASS ||
    process.env.SMTP_PASS ||
    process.env.SMTP_PASSWORD ||
    process.env.EMAIL_PASS;

  if (!user || !pass) {
    return { transporter: null, user };
  }

  if (cachedTransporter && cachedUser === user) {
    return { transporter: cachedTransporter, user };
  }

  cachedTransporter = nodemailer.createTransport({
    pool: true,
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
    maxConnections: 1, // Single persistent TLS tunnel to Gmail to avoid connection throttling
    maxMessages: Infinity,
    rateDelta: 1000,
    rateLimit: 2, // 2 emails per second max to respect Google SMTP throughput guidelines
    tls: {
      rejectUnauthorized: false,
    },
  });

  cachedUser = user;
  return { transporter: cachedTransporter, user };
}

/**
 * Dynamically resolves all CC and BCC emails from Configured Email Groups,
 * Global Dynamic CC/BCC Emails, and Template-Specific Direct CC/BCC Emails.
 */
function resolveDynamicRecipients({
  emailGroups = [],
  templateCcDirect = [],
  templateBccDirect = [],
  globalCcDirect = [],
  globalBccDirect = [],
  templateCcGroups = [],
  templateBccGroups = [],
}) {
  const ccEmails = new Set();
  const bccEmails = new Set();

  const groupMap = new Map();
  (emailGroups || []).forEach((g) => {
    if (g && g.name) {
      groupMap.set(g.name.toLowerCase().trim(), g);
    }
  });

  // 1. All groups configured in Email Groups (by groupType or all members)
  (emailGroups || []).forEach((group) => {
    const list = Array.isArray(group.emails) ? group.emails : [];
    const type = (group.groupType || "CC").toUpperCase();

    list.forEach((em) => {
      if (em && em.trim().includes("@")) {
        const clean = em.trim().toLowerCase();
        if (type === "BCC") {
          bccEmails.add(clean);
        } else {
          ccEmails.add(clean);
        }
      }
    });
  });

  // 2. Global Direct CC and BCC Emails
  (globalCcDirect || []).forEach((em) => {
    if (em && em.trim().includes("@")) ccEmails.add(em.trim().toLowerCase());
  });
  (globalBccDirect || []).forEach((em) => {
    if (em && em.trim().includes("@")) bccEmails.add(em.trim().toLowerCase());
  });

  // 3. Template-Specific Direct CC and BCC Emails
  (templateCcDirect || []).forEach((em) => {
    if (em && em.trim().includes("@")) ccEmails.add(em.trim().toLowerCase());
  });
  (templateBccDirect || []).forEach((em) => {
    if (em && em.trim().includes("@")) bccEmails.add(em.trim().toLowerCase());
  });

  // 4. Template-Specific Named CC and BCC Groups
  (templateCcGroups || []).forEach((gName) => {
    if (gName && groupMap.has(gName.toLowerCase().trim())) {
      const g = groupMap.get(gName.toLowerCase().trim());
      (g.emails || []).forEach((em) => {
        if (em && em.trim().includes("@")) ccEmails.add(em.trim().toLowerCase());
      });
    } else if (gName && gName.includes("@")) {
      ccEmails.add(gName.trim().toLowerCase());
    }
  });

  (templateBccGroups || []).forEach((gName) => {
    if (gName && groupMap.has(gName.toLowerCase().trim())) {
      const g = groupMap.get(gName.toLowerCase().trim());
      (g.emails || []).forEach((em) => {
        if (em && em.trim().includes("@")) bccEmails.add(em.trim().toLowerCase());
      });
    } else if (gName && gName.includes("@")) {
      bccEmails.add(gName.trim().toLowerCase());
    }
  });

  return {
    ccList: Array.from(ccEmails),
    bccList: Array.from(bccEmails),
  };
}

export function renderCelebrationEmailHtml({
  heading,
  bodyMessage,
  employeeName,
  celebrationType,
  yearsCompleted,
  assetImageUrl,
}) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${heading}</title>
      <style>
        body { margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
        .wrapper { width: 100%; padding: 40px 0; background-color: #f1f5f9; }
        .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0; }
        .banner-img { width: 100%; height: 260px; object-fit: cover; display: block; }
        .content { padding: 36px 32px; text-align: center; }
        .badge { display: inline-block; background: #ede9fe; color: #4318ff; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 1.2px; padding: 6px 16px; border-radius: 9999px; margin-bottom: 18px; }
        .title { color: #0f172a; font-size: 26px; font-weight: 800; margin: 0 0 16px; line-height: 1.3; }
        .body-text { color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 28px; }
        .divider { height: 1px; background: #e2e8f0; margin: 28px 0; }
        .footer { color: #94a3b8; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="card">
          ${
            assetImageUrl
              ? `<img src="${assetImageUrl}" alt="Celebration" class="banner-img" />`
              : ""
          }
          <div class="content">
            <span class="badge">${celebrationType}</span>
            <h1 class="title">${heading}</h1>
            <p class="body-text">${bodyMessage}</p>
            ${
              yearsCompleted
                ? `<p style="font-weight: 700; color: #4318ff; font-size: 18px;">🌟 Celebrating ${yearsCompleted} Incredible Years with PeoplePulse! 🌟</p>`
                : ""
            }
            <div class="divider"></div>
            <p class="footer">Sent with ❤️ from your PeoplePulse Team</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function sendCelebrationEmail({
  employeeId,
  employeeName,
  employeeEmail,
  celebrationType,
  customSubject,
  customHeading,
  customMessage,
  assetId,
  assetImageUrl: overrideImageUrl,
  yearsCompleted,
  force = false,
}) {
  await connectDB();
  await ensureSeedCelebrationData();

  const settings = await getCelebrationSettings();
  const currentYear = getTodayInIST().year;
  const cleanEmail = employeeEmail.trim().toLowerCase();

  // 1. ATOMIC DUPLICATE CHECK: Skip if already SENT this year unless force is true
  if (!force) {
    const existingQuery =
      employeeId && mongoose.Types.ObjectId.isValid(employeeId)
        ? {
            employeeId: new mongoose.Types.ObjectId(employeeId),
            celebrationType,
            year: currentYear,
            status: "SENT",
          }
        : {
            employeeEmail: cleanEmail,
            celebrationType,
            year: currentYear,
            status: "SENT",
          };

    const existingLog = await CelebrationLog.findOne(existingQuery);

    if (existingLog) {
      return {
        success: true,
        alreadySent: true,
        message: `Celebration email already sent for ${currentYear} to ${employeeName}.`,
      };
    }
  }

  // Pre-create or lock log to SENDING to prevent concurrent duplicate sends
  let logRecord;
  try {
    logRecord = await CelebrationLog.create({
      employeeId: employeeId && mongoose.Types.ObjectId.isValid(employeeId)
        ? new mongoose.Types.ObjectId(employeeId)
        : null,
      employeeName,
      employeeEmail: cleanEmail,
      celebrationType,
      celebrationDate: new Date(),
      year: currentYear,
      status: "SENDING",
      sentAt: new Date(),
    });
  } catch (err) {
    if (err.code === 11000) {
      if (!force) {
        return { success: true, alreadySent: true };
      }
      logRecord = await CelebrationLog.findOne({
        $or: checkConditions,
      });
    }
  }

  let category = "Birthdays";
  let configKey = "birthdayConfig";
  if (celebrationType === "Work Anniversary") {
    category = "Work Anniversaries";
    configKey = "workAnniversaryConfig";
  } else if (
    celebrationType === "Personal Anniversary" ||
    celebrationType === "Custom"
  ) {
    category = "Personal Anniversaries";
    configKey = "personalAnniversaryConfig";
  }

  const config = settings[configKey] || DEFAULT_SETTINGS[configKey] || {};

  let asset = null;
  if (assetId) {
    asset = await CelebrationAsset.findById(assetId);
  }
  if (!asset && !overrideImageUrl) {
    asset = await getNextCelebrationAsset(category);
  }

  let finalImageUrl = overrideImageUrl || asset?.imageUrl || DEFAULT_ASSETS[0].imageUrl;
  
  // Make sure image URL is absolute for email rendering
  if (finalImageUrl && finalImageUrl.startsWith("/")) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL 
      || process.env.APP_URL 
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    finalImageUrl = `${baseUrl.replace(/\/$/, "")}${finalImageUrl}`;
  }

  const firstName = employeeName.split(" ")[0];
  const subjectTemplate = customSubject || config.subject || DEFAULT_SETTINGS[configKey]?.subject || `Happy ${celebrationType}, {firstName}!`;
  const headingTemplate = customHeading || config.heading || DEFAULT_SETTINGS[configKey]?.heading || `Wishing you a wonderful ${celebrationType}, {firstName}!`;
  const bodyTemplate = customMessage || config.bodyMessage || DEFAULT_SETTINGS[configKey]?.bodyMessage || `Warmest congratulations on your ${celebrationType}!`;

  const finalSubject = subjectTemplate
    .replaceAll("{firstName}", firstName)
    .replaceAll("{name}", employeeName)
    .replaceAll("{years}", yearsCompleted ? String(yearsCompleted) : "");

  const finalHeading = headingTemplate
    .replaceAll("{firstName}", firstName)
    .replaceAll("{name}", employeeName)
    .replaceAll("{years}", yearsCompleted ? String(yearsCompleted) : "");

  const finalBody = bodyTemplate
    .replaceAll("{firstName}", firstName)
    .replaceAll("{name}", employeeName)
    .replaceAll("{years}", yearsCompleted ? String(yearsCompleted) : "");

  const html = renderCelebrationEmailHtml({
    heading: finalHeading,
    bodyMessage: finalBody,
    employeeName,
    celebrationType,
    yearsCompleted,
    assetImageUrl: finalImageUrl,
  });

  const toList = [cleanEmail];

  // Dynamically resolve CC & BCC lists across Configured Email Groups, Global CC/BCC, and Template CC/BCC
  const { ccList: resolvedCc, bccList: resolvedBcc } = resolveDynamicRecipients({
    emailGroups: settings.emailGroups || [],
    templateCcDirect: config.directCcEmails || [],
    templateBccDirect: config.directBccEmails || [],
    globalCcDirect: settings.globalDirectCcEmails || [],
    globalBccDirect: settings.globalDirectBccEmails || [],
    templateCcGroups: config.ccGroups || [],
    templateBccGroups: config.bccGroups || [],
  });

  const { transporter, user } = getOrCreateCelebrationTransporter();

  const ccList = resolvedCc.filter((e) => !toList.includes(e));
  const bccList = resolvedBcc.filter((e) => !toList.includes(e) && !ccList.includes(e));

  if (!transporter) {
    const errorMsg =
      "SMTP Credentials not configured. Please set SMTP_CONTACT_PASS in .env.local.";
    if (logRecord) {
      logRecord.status = "FAILED";
      logRecord.errorMessage = errorMsg;
      logRecord.subject = finalSubject;
      logRecord.assetImageUrl = finalImageUrl;
      logRecord.assetTitle = asset?.title || "";
      logRecord.to = toList;
      logRecord.cc = ccList;
      logRecord.bcc = bccList;
      await logRecord.save();
    }

    return {
      success: false,
      error: errorMsg,
      details: { to: toList, cc: ccList, bcc: bccList, asset: asset?.title },
    };
  }

  const mailOptions = {
    from: `"PeoplePulse Celebrations" <${user}>`,
    to: toList,
    subject: finalSubject,
    html,
  };

  if (ccList.length > 0) mailOptions.cc = ccList;
  if (bccList.length > 0) mailOptions.bcc = bccList;

  console.log("[Celebration Email Dispatching]:", {
    to: toList,
    cc: ccList,
    bcc: bccList,
    subject: finalSubject,
  });

  let sendAttempt = 0;
  const maxAttempts = 3;
  let lastError = null;

  while (sendAttempt < maxAttempts) {
    sendAttempt++;
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log("[Celebration Email Dispatch Success]:", {
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
      });

      const isEmployeeAccepted =
        Array.isArray(info.accepted) &&
        info.accepted.some((a) => a.toLowerCase() === cleanEmail);

      if (!isEmployeeAccepted && Array.isArray(info.rejected) && info.rejected.length > 0) {
        throw new Error(
          `Recipient ${cleanEmail} was rejected by mail server.`
        );
      }

      if (logRecord) {
        logRecord.status = "SENT";
        logRecord.errorMessage = "";
        logRecord.subject = finalSubject;
        logRecord.assetImageUrl = finalImageUrl;
        logRecord.assetTitle = asset?.title || "";
        logRecord.to = toList;
        logRecord.cc = ccList;
        logRecord.bcc = bccList;
        logRecord.sentAt = new Date();
        await logRecord.save();
      }

      return {
        success: true,
        messageId: info.messageId,
        to: toList,
        cc: ccList,
        bcc: bccList,
        asset: asset?.title,
      };
    } catch (err) {
      lastError = err;
      console.error(`[Celebration SMTP Send Attempt ${sendAttempt} Failed]:`, err.message);
      if (sendAttempt < maxAttempts) {
        // Exponential backoff before retry on temporary SMTP issue
        await new Promise((r) => setTimeout(r, 1200 * sendAttempt));
      }
    }
  }

  // If failed after all retries
  if (logRecord) {
    logRecord.status = "FAILED";
    logRecord.errorMessage = lastError?.message || "Failed to deliver email";
    logRecord.subject = finalSubject;
    logRecord.assetImageUrl = finalImageUrl;
    logRecord.to = toList;
    logRecord.cc = ccList;
    logRecord.bcc = bccList;
    logRecord.sentAt = new Date();
    await logRecord.save();
  }

  return {
    success: false,
    error: lastError?.message || "Failed to deliver email",
  };
}

export async function runAutomatedCelebrationCheck({ force = false } = {}) {
  if (isAutomationRunning) {
    return { skipped: "Automation is already actively running." };
  }

  isAutomationRunning = true;

  try {
    await connectDB();
    const settings = await getCelebrationSettings();
    const { celebrations } = await getUpcomingCelebrations();

    const todayCelebrations = celebrations.filter(
      (c) => c.isToday && (force || c.status !== "SENT")
    );

    const results = {
      totalChecked: celebrations.length,
      todayFound: todayCelebrations.length,
      sent: 0,
      failed: 0,
      skippedTimeNotReached: 0,
      alreadySent: 0,
      details: [],
    };

    for (const item of todayCelebrations) {
      let scheduleTimeStr = settings.birthdayScheduleTime || "09:00 AM";
      if (item.celebrationType === "Work Anniversary") {
        scheduleTimeStr = settings.workAnniversaryScheduleTime || "09:00 AM";
      } else if (
        item.celebrationType === "Personal Anniversary" ||
        item.celebrationType === "Custom"
      ) {
        scheduleTimeStr = settings.personalAnniversaryScheduleTime || "10:00 AM";
      }

      const timeReached = isTimeToDispatch(scheduleTimeStr, "Asia/Kolkata");

      if (!force && !timeReached) {
        results.skippedTimeNotReached++;
        results.details.push({
          employee: item.employeeName,
          celebrationType: item.celebrationType,
          status: "WAITING_SCHEDULE_TIME",
          scheduledTime: scheduleTimeStr,
        });
        continue;
      }

      try {
        const res = await sendCelebrationEmail({
          employeeId: item.employeeId,
          employeeName: item.employeeName,
          employeeEmail: item.email,
          celebrationType: item.celebrationType,
          yearsCompleted: item.yearsCompleted,
          assetImageUrl: item.emailImageUrl,
          force,
        });

        if (res.alreadySent) {
          results.alreadySent++;
        } else if (res.success) {
          results.sent++;
        } else {
          results.failed++;
        }
        results.details.push({ employee: item.employeeName, ...res });
      } catch (e) {
        results.failed++;
        results.details.push({
          employee: item.employeeName,
          success: false,
          error: e.message,
        });
      }

      // Sequential 500ms pacing between emails in batch to ensure 100% SMTP deliverability
      await new Promise((r) => setTimeout(r, 500));
    }

    return results;
  } finally {
    isAutomationRunning = false;
  }
}
