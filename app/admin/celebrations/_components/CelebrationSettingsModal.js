"use client";

import { useState, useEffect } from "react";
import {
  X,
  Clock,
  Mail,
  Users,
  Save,
  AlertCircle,
  Loader2,
  Cake,
  Award,
  Heart,
  Globe,
} from "lucide-react";
import Swal from "sweetalert2";

function timeStringTo24Hour(timeStr) {
  if (!timeStr) return "09:00";
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return timeStr.includes(":") ? timeStr.slice(0, 5) : "09:00";
  let h = parseInt(match[1], 10);
  const m = match[2];
  const p = match[3]?.toUpperCase();
  if (p === "PM" && h < 12) h += 12;
  if (p === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${m}`;
}

function time24To12Hour(time24Str) {
  if (!time24Str) return "09:00 AM";
  const [hStr, mStr] = time24Str.split(":");
  let h = parseInt(hStr, 10);
  const m = mStr || "00";
  if (isNaN(h)) return "09:00 AM";
  const period = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${String(h).padStart(2, "0")}:${m} ${period}`;
}

const DEFAULT_TEMPLATES = {
  birthdayConfig: {
    enabled: true,
    subject: "🎉 Happy Birthday, {firstName}!",
    heading: "Wishing You a Fantastic Birthday, {firstName}!",
    bodyMessage:
      "On behalf of the entire team at PeoplePulse, we wish you a wonderful birthday filled with happiness, health, and success. Thank you for bringing your positive energy, dedication, and talent to our team every single day!",
    directCcEmails: [],
    directBccEmails: [],
  },
  workAnniversaryConfig: {
    enabled: true,
    subject: "🏆 Congratulations on Your Work Anniversary, {firstName}!",
    heading: "Congratulations on {years} Years, {firstName}!",
    bodyMessage:
      "Happy Work Anniversary! We truly appreciate your continuous dedication, commitment, and valuable contributions to our organization. Here is to celebrating your wonderful journey and achieving many more great milestones together!",
    directCcEmails: [],
    directBccEmails: [],
  },
  personalAnniversaryConfig: {
    enabled: true,
    subject: "💐 Warmest Wishes on Your Special Milestone, {firstName}!",
    heading: "Happy Milestone Celebration, {firstName}!",
    bodyMessage:
      "Sending our warmest thoughts and heartfelt wishes as you celebrate this special personal anniversary today! May your journey ahead continue to be filled with happiness, love, and prosperous achievements.",
    directCcEmails: [],
    directBccEmails: [],
  },
};

const DEFAULT_SETTINGS = {
  birthdayScheduleTime: "09:00 AM",
  workAnniversaryScheduleTime: "09:00 AM",
  personalAnniversaryScheduleTime: "10:00 AM",
  timezone: "Asia/Kolkata (IST)",
  globalDirectCcEmails: [],
  globalDirectBccEmails: [],
  ...DEFAULT_TEMPLATES,
};

function parseEmailString(str = "") {
  if (!str || typeof str !== "string") return [];
  return str
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => Boolean(e) && e.includes("@"));
}

export default function CelebrationSettingsModal({
  isOpen,
  onClose,
  initialSettings,
  onSettingsUpdated,
}) {
  const [activeTab, setActiveTab] = useState("schedule"); // 'schedule', 'groups', 'templates'
  const [templateSubTab, setTemplateSubTab] = useState("birthday"); // 'birthday', 'work', 'personal'
  const [settings, setSettings] = useState(initialSettings || DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Dynamic Global CC / BCC text inputs
  const [globalCcText, setGlobalCcText] = useState("");
  const [globalBccText, setGlobalBccText] = useState("");

  // Dynamic Template-Specific CC / BCC text inputs
  const [birthdayCcText, setBirthdayCcText] = useState("");
  const [birthdayBccText, setBirthdayBccText] = useState("");
  const [workCcText, setWorkCcText] = useState("");
  const [workBccText, setWorkBccText] = useState("");
  const [personalCcText, setPersonalCcText] = useState("");
  const [personalBccText, setPersonalBccText] = useState("");

  const populateFieldsFromData = (data) => {
    if (!data) return;
    const merged = {
      ...DEFAULT_SETTINGS,
      ...data,
      birthdayConfig: {
        ...DEFAULT_TEMPLATES.birthdayConfig,
        ...(data.birthdayConfig || {}),
        subject: data.birthdayConfig?.subject || DEFAULT_TEMPLATES.birthdayConfig.subject,
        heading: data.birthdayConfig?.heading || DEFAULT_TEMPLATES.birthdayConfig.heading,
        bodyMessage: data.birthdayConfig?.bodyMessage || DEFAULT_TEMPLATES.birthdayConfig.bodyMessage,
      },
      workAnniversaryConfig: {
        ...DEFAULT_TEMPLATES.workAnniversaryConfig,
        ...(data.workAnniversaryConfig || {}),
        subject: data.workAnniversaryConfig?.subject || DEFAULT_TEMPLATES.workAnniversaryConfig.subject,
        heading: data.workAnniversaryConfig?.heading || DEFAULT_TEMPLATES.workAnniversaryConfig.heading,
        bodyMessage: data.workAnniversaryConfig?.bodyMessage || DEFAULT_TEMPLATES.workAnniversaryConfig.bodyMessage,
      },
      personalAnniversaryConfig: {
        ...DEFAULT_TEMPLATES.personalAnniversaryConfig,
        ...(data.personalAnniversaryConfig || {}),
        subject: data.personalAnniversaryConfig?.subject || DEFAULT_TEMPLATES.personalAnniversaryConfig.subject,
        heading: data.personalAnniversaryConfig?.heading || DEFAULT_TEMPLATES.personalAnniversaryConfig.heading,
        bodyMessage: data.personalAnniversaryConfig?.bodyMessage || DEFAULT_TEMPLATES.personalAnniversaryConfig.bodyMessage,
      },
    };

    setSettings(merged);

    // Populate Global CC / BCC
    setGlobalCcText((merged.globalDirectCcEmails || []).join(", "));
    setGlobalBccText((merged.globalDirectBccEmails || []).join(", "));

    // Populate Template Specific CC / BCC
    setBirthdayCcText((merged.birthdayConfig?.directCcEmails || []).join(", "));
    setBirthdayBccText((merged.birthdayConfig?.directBccEmails || []).join(", "));

    setWorkCcText((merged.workAnniversaryConfig?.directCcEmails || []).join(", "));
    setWorkBccText((merged.workAnniversaryConfig?.directBccEmails || []).join(", "));

    setPersonalCcText((merged.personalAnniversaryConfig?.directCcEmails || []).join(", "));
    setPersonalBccText((merged.personalAnniversaryConfig?.directBccEmails || []).join(", "));
  };

  // Always fetch fresh settings from database when opened
  useEffect(() => {
    if (isOpen) {
      if (initialSettings) {
        populateFieldsFromData(initialSettings);
      }

      setIsLoading(true);
      fetch("/api/celebrations/settings")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            populateFieldsFromData(data);
          }
        })
        .catch((err) => console.error("Error fetching live settings:", err))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen]);

  const updateConfigField = (configKey, field, value) => {
    setSettings((prev) => ({
      ...prev,
      [configKey]: {
        ...(prev[configKey] || DEFAULT_TEMPLATES[configKey]),
        [field]: value,
      },
    }));
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    setError("");
    try {
      const payload = {
        ...settings,
        timezone: "Asia/Kolkata (IST)",
        globalDirectCcEmails: parseEmailString(globalCcText),
        globalDirectBccEmails: parseEmailString(globalBccText),
        birthdayConfig: {
          ...(settings.birthdayConfig || DEFAULT_TEMPLATES.birthdayConfig),
          directCcEmails: parseEmailString(birthdayCcText),
          directBccEmails: parseEmailString(birthdayBccText),
        },
        workAnniversaryConfig: {
          ...(settings.workAnniversaryConfig || DEFAULT_TEMPLATES.workAnniversaryConfig),
          directCcEmails: parseEmailString(workCcText),
          directBccEmails: parseEmailString(workBccText),
        },
        personalAnniversaryConfig: {
          ...(settings.personalAnniversaryConfig || DEFAULT_TEMPLATES.personalAnniversaryConfig),
          directCcEmails: parseEmailString(personalCcText),
          directBccEmails: parseEmailString(personalBccText),
        },
      };

      const res = await fetch("/api/celebrations/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update settings.");
      }

      await Swal.fire({
        icon: "success",
        title: "Dynamic Settings Saved!",
        text: "Schedules, Global CC / BCC addresses, and dynamic Email Templates are active and saved in the database.",
        confirmButtonColor: "#4318FF",
        background: "#ffffff",
        color: "#0f172a",
        customClass: {
          popup: "rounded-3xl shadow-2xl border border-slate-100",
        },
      });

      if (onSettingsUpdated) {
        onSettingsUpdated(data.settings);
      }
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="relative w-full max-w-4xl rounded-3xl bg-white shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Celebration & Automation Settings
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Configure daily sending times, global CC/BCC recipients, and email templates.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Top Tabs */}
        <div className="px-8 border-b border-slate-100 flex items-center gap-6 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("schedule")}
            className={`py-3.5 border-b-2 transition flex items-center gap-2 ${
              activeTab === "schedule"
                ? "border-[#4318FF] text-[#4318FF]"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Automated Sending Schedules</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("groups")}
            className={`py-3.5 border-b-2 transition flex items-center gap-2 ${
              activeTab === "groups"
                ? "border-[#4318FF] text-[#4318FF]"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Global CC & BCC</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("templates")}
            className={`py-3.5 border-b-2 transition flex items-center gap-2 ${
              activeTab === "templates"
                ? "border-[#4318FF] text-[#4318FF]"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Mail className="h-4 w-4" />
            <span>Email Templates</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {isLoading && (
            <div className="flex items-center justify-center py-4 text-xs text-indigo-600 gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading latest settings from database...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-xs font-medium text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: SCHEDULE */}
          {activeTab === "schedule" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Automated Daily Sending Times
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Select the exact time automated milestone emails will be sent daily in Indian Standard Time.
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                    Timezone: Asia/Kolkata (IST)
                  </span>
                </div>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-5">
                  {/* Birthdays Time Selector */}
                  <div className="rounded-2xl bg-white p-4.5 border border-slate-200 shadow-2xs hover:border-[#4318FF]/40 transition">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-2">
                        <Cake className="h-4 w-4 text-pink-500" />
                        <span>🎂 Birthdays</span>
                      </label>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#4318FF] bg-indigo-50 px-2 py-0.5 rounded-full font-mono">
                        {settings.birthdayScheduleTime || "09:00 AM"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mb-2.5">
                      Pick exact hour and single minute
                    </p>
                    <div className="relative">
                      <input
                        type="time"
                        step="60"
                        value={timeStringTo24Hour(settings.birthdayScheduleTime || "09:00 AM")}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val) {
                            const t12 = time24To12Hour(val);
                            setSettings((p) => ({
                              ...p,
                              birthdayScheduleTime: t12,
                            }));
                          }
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-bold font-mono text-slate-800 focus:border-[#4318FF] focus:bg-white focus:outline-none transition cursor-pointer shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* Work Anniversaries Time Selector */}
                  <div className="rounded-2xl bg-white p-4.5 border border-slate-200 shadow-2xs hover:border-[#4318FF]/40 transition">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-2">
                        <Award className="h-4 w-4 text-indigo-600" />
                        <span>🏆 Work Anniversaries</span>
                      </label>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#4318FF] bg-indigo-50 px-2 py-0.5 rounded-full font-mono">
                        {settings.workAnniversaryScheduleTime || "09:00 AM"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mb-2.5">
                      Pick exact hour and single minute
                    </p>
                    <div className="relative">
                      <input
                        type="time"
                        step="60"
                        value={timeStringTo24Hour(settings.workAnniversaryScheduleTime || "09:00 AM")}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val) {
                            const t12 = time24To12Hour(val);
                            setSettings((p) => ({
                              ...p,
                              workAnniversaryScheduleTime: t12,
                            }));
                          }
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-bold font-mono text-slate-800 focus:border-[#4318FF] focus:bg-white focus:outline-none transition cursor-pointer shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* Personal Milestones Time Selector */}
                  <div className="rounded-2xl bg-white p-4.5 border border-slate-200 shadow-2xs hover:border-[#4318FF]/40 transition">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-2">
                        <Heart className="h-4 w-4 text-rose-500" />
                        <span>💐 Personal Milestones</span>
                      </label>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#4318FF] bg-indigo-50 px-2 py-0.5 rounded-full font-mono">
                        {settings.personalAnniversaryScheduleTime || "10:00 AM"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mb-2.5">
                      Pick exact hour and single minute
                    </p>
                    <div className="relative">
                      <input
                        type="time"
                        step="60"
                        value={timeStringTo24Hour(settings.personalAnniversaryScheduleTime || "10:00 AM")}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val) {
                            const t12 = time24To12Hour(val);
                            setSettings((p) => ({
                              ...p,
                              personalAnniversaryScheduleTime: t12,
                            }));
                          }
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-bold font-mono text-slate-800 focus:border-[#4318FF] focus:bg-white focus:outline-none transition cursor-pointer shadow-2xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                  <span>Application Timezone locked to Indian Standard Time (Mumbai / Kolkata)</span>
                  <span className="font-mono font-bold text-slate-800">Asia/Kolkata</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GLOBAL DIRECT CC & BCC */}
          {activeTab === "groups" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Globe className="h-4 w-4 text-[#4318FF]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Global Direct CC & BCC Addresses (Applied to All Celebrations)
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  Emails entered here are permanently saved in the database and automatically included as CC / BCC on <strong>all celebration types</strong> (Birthdays, Work Anniversaries, and Personal Anniversaries) across all future automated deliveries.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Global CC Email Addresses (comma-separated)
                    </label>
                    <textarea
                      rows={3}
                      value={globalCcText}
                      onChange={(e) => setGlobalCcText(e.target.value)}
                      placeholder="e.g. hr@peoplepulse.com, teamleads@peoplepulse.com"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-[#4318FF]"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      These email IDs will receive carbon copy (CC) of all celebration milestone greetings.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Global BCC Email Addresses (comma-separated)
                    </label>
                    <textarea
                      rows={3}
                      value={globalBccText}
                      onChange={(e) => setGlobalBccText(e.target.value)}
                      placeholder="e.g. admin@peoplepulse.com, records@peoplepulse.com"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-[#4318FF]"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      These email IDs will receive blind carbon copy (BCC) of all celebration milestone greetings.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: EMAIL TEMPLATES */}
          {activeTab === "templates" && (
            <div className="space-y-6">
              {/* Template Sub Tabs */}
              <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
                <button
                  type="button"
                  onClick={() => setTemplateSubTab("birthday")}
                  className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                    templateSubTab === "birthday"
                      ? "bg-pink-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  🎂 Birthday Template
                </button>

                <button
                  type="button"
                  onClick={() => setTemplateSubTab("work")}
                  className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                    templateSubTab === "work"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  🏆 Work Anniversary
                </button>

                <button
                  type="button"
                  onClick={() => setTemplateSubTab("personal")}
                  className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                    templateSubTab === "personal"
                      ? "bg-purple-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  💐 Personal Anniversary
                </button>
              </div>

              {/* Template Editor Body */}
              {(() => {
                let configKey = "birthdayConfig";
                let badgeColor = "text-pink-600 bg-pink-50 border-pink-200";
                let title = "🎂 Birthday Email Template";
                let ccVal = birthdayCcText;
                let setCcVal = setBirthdayCcText;
                let bccVal = birthdayBccText;
                let setBccVal = setBirthdayBccText;

                if (templateSubTab === "work") {
                  configKey = "workAnniversaryConfig";
                  badgeColor = "text-indigo-600 bg-indigo-50 border-indigo-200";
                  title = "🏆 Work Anniversary Email Template";
                  ccVal = workCcText;
                  setCcVal = setWorkCcText;
                  bccVal = workBccText;
                  setBccVal = setWorkBccText;
                } else if (templateSubTab === "personal") {
                  configKey = "personalAnniversaryConfig";
                  badgeColor = "text-purple-600 bg-purple-50 border-purple-200";
                  title = "💐 Personal Anniversary Email Template";
                  ccVal = personalCcText;
                  setCcVal = setPersonalCcText;
                  bccVal = personalBccText;
                  setBccVal = setPersonalBccText;
                }

                const fallback = DEFAULT_TEMPLATES[configKey] || {};
                const currentConfig = settings[configKey] || fallback;

                const currentSubject = currentConfig.subject ?? fallback.subject ?? "";
                const currentHeading = currentConfig.heading ?? fallback.heading ?? "";
                const currentBody = currentConfig.bodyMessage ?? fallback.bodyMessage ?? "";

                return (
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold border ${badgeColor}`}>
                        {title}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        Variables: <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600 font-mono">{"{firstName}"}</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600 font-mono">{"{years}"}</code>
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700">
                        Email Subject Line *
                      </label>
                      <input
                        type="text"
                        value={currentSubject}
                        onChange={(e) => updateConfigField(configKey, "subject", e.target.value)}
                        placeholder="e.g. Happy Celebration, {firstName}!"
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#4318FF]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700">
                        Card Heading / Headline *
                      </label>
                      <input
                        type="text"
                        value={currentHeading}
                        onChange={(e) => updateConfigField(configKey, "heading", e.target.value)}
                        placeholder="e.g. Wishing You a Fantastic Celebration, {firstName}!"
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#4318FF]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700">
                        Body Message Content *
                      </label>
                      <textarea
                        rows={4}
                        value={currentBody}
                        onChange={(e) => updateConfigField(configKey, "bodyMessage", e.target.value)}
                        placeholder="Warm celebratory message text..."
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#4318FF]"
                      />
                    </div>

                    {/* Optional Template-Specific CC / BCC */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                      <div>
                        <label className="block text-xs font-bold text-slate-700">
                          Template-Specific CC Emails (Optional)
                        </label>
                        <textarea
                          rows={2}
                          value={ccVal}
                          onChange={(e) => setCcVal(e.target.value)}
                          placeholder="Optional direct CC for this milestone only"
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#4318FF]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700">
                          Template-Specific BCC Emails (Optional)
                        </label>
                        <textarea
                          rows={2}
                          value={bccVal}
                          onChange={(e) => setBccVal(e.target.value)}
                          placeholder="Optional direct BCC for this milestone only"
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#4318FF]"
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-full border border-slate-300 bg-white px-5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-full bg-[#4318FF] px-6 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#3713d9] transition disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Saving Settings...</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                <span>Save All Settings</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
