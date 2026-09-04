"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Calendar,
  Cake,
  Award,
  Heart,
  Plus,
  Clock,
  Pencil,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  SlidersHorizontal,
  ArrowUpDown,
  Send,
  Loader2,
  Image as ImageIcon,
  Settings,
  Sparkles,
  User,
  Mail,
  ChevronRight,
  Briefcase,
  Headphones,
  Code2,
  Camera,
} from "lucide-react";
import Swal from "sweetalert2";
import CelebrationGalleryModal from "./_components/CelebrationGalleryModal";
import CelebrationSettingsModal from "./_components/CelebrationSettingsModal";
import DeliveryLogsModal from "./_components/DeliveryLogsModal";
import ManualCelebrationModal from "./_components/ManualCelebrationModal";

function formatDisplayDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return "Recently";
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

  const timeStr = d.toLocaleTimeString("en-US", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
  });

  if (diffDays === 0) return `Today, ${timeStr}`;
  if (diffDays === 1) return `Yesterday, ${timeStr}`;
  return `${d.toLocaleDateString("en-US", { month: "short", day: "2-digit" })}, ${timeStr}`;
}

const PAGE_SIZE = 6;

export default function CelebrationsClient({ currentUser }) {
  const [data, setData] = useState({
    celebrations: [],
    stats: {
      upcomingThisMonth: 18,
      birthdayCount: 9,
      workAnniversaryCount: 6,
      personalAnniversaryCount: 3,
    },
    settings: {
      birthdayScheduleTime: "09:00 AM",
      workAnniversaryScheduleTime: "09:00 AM",
      personalAnniversaryScheduleTime: "10:00 AM",
      timezone: "Asia/Kolkata (IST)",
    },
    recentLogs: [],
  });

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");

  // Custom image assignment overrides per celebration card
  const [customImageOverrides, setCustomImageOverrides] = useState({});

  // Infinite Scroll state
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerTargetRef = useRef(null);

  // Modals
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [gallerySelectMode, setGallerySelectMode] = useState(false);
  const [galleryInitialTab, setGalleryInitialTab] = useState("All Assets");
  const [galleryLockCategory, setGalleryLockCategory] = useState(false);
  const [editingCardId, setEditingCardId] = useState(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isAutomating, setIsAutomating] = useState(false);

  const fetchCelebrations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (selectedType) params.append("celebrationType", selectedType);

      const [res, empRes] = await Promise.all([
        fetch(`/api/celebrations?${params.toString()}`),
        fetch(`/api/employees?all=true`),
      ]);

      if (res.ok) {
        const json = await res.json();
        setData(json);
      }

      if (empRes.ok) {
        const empJson = await empRes.json();
        setEmployees(empJson.employees || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedType]);

  useEffect(() => {
    fetchCelebrations();
  }, [fetchCelebrations]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, selectedType, selectedMonth, sortOrder]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          const total = data.celebrations?.length || 0;
          if (visibleCount < total) {
            setIsLoadingMore(true);
            setTimeout(() => {
              setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, total));
              setIsLoadingMore(false);
            }, 300);
          }
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTargetRef.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [loading, visibleCount, data.celebrations]);

  const handleOpenEditImage = (item) => {
    let cat = "Birthdays";
    if (item.celebrationType === "Work Anniversary") {
      cat = "Work Anniversaries";
    } else if (item.celebrationType === "Personal Anniversary" || item.celebrationType === "Custom") {
      cat = "Personal Anniversaries";
    }

    setEditingCardId(item.id);
    setGalleryInitialTab(cat);
    setGalleryLockCategory(true);
    setGallerySelectMode(true);
    setIsGalleryOpen(true);
  };

  const handleAssetSelected = async (asset) => {
    if (editingCardId) {
      const currentItem = data.celebrations.find((c) => c.id === editingCardId);

      // Instantly update local override state
      setCustomImageOverrides((prev) => ({
        ...prev,
        [editingCardId]: {
          assetId: asset._id,
          imageUrl: asset.imageUrl,
          title: asset.title,
        },
      }));

      // Optimistically update card image in celebrations list
      setData((prev) => ({
        ...prev,
        celebrations: prev.celebrations.map((c) =>
          c.id === editingCardId ? { ...c, emailImageUrl: asset.imageUrl } : c
        ),
      }));

      // Persist permanently in MongoDB
      try {
        await fetch("/api/celebrations/card-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cardId: editingCardId,
            employeeId: currentItem?.employeeId,
            celebrationType: currentItem?.celebrationType,
            imageUrl: asset.imageUrl,
          }),
        });
      } catch (e) {
        console.error("Failed to save card image in DB:", e);
      }

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Email Image Updated!",
        text: `Using "${asset.title}" for this celebration email.`,
        showConfirmButton: false,
        timer: 3000,
        background: "#ffffff",
        color: "#0f172a",
      });
    }
    setEditingCardId(null);
    setGallerySelectMode(false);
  };

  const handleSendCelebrationNow = async (item) => {
    const override = customImageOverrides[item.id];
    const finalImage = override?.imageUrl || item.emailImageUrl;
    const finalAssetId = override?.assetId || null;

    const result = await Swal.fire({
      title: `Send ${item.celebrationType} Email?`,
      text: `Send celebration greeting now to ${item.employeeName} (${item.email})?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#4318FF",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, Send Now",
      cancelButtonText: "Cancel",
      background: "#ffffff",
      color: "#0f172a",
      customClass: {
        popup: "rounded-3xl shadow-2xl border border-slate-100",
      },
    });

    if (result.isConfirmed) {
      Swal.fire({
        title: "Dispatching Email...",
        text: "Sending celebration email via configured SMTP",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      try {
        const res = await fetch("/api/celebrations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "sendNow",
            employeeId: item.employeeId,
            employeeName: item.employeeName,
            employeeEmail: item.email,
            celebrationType: item.celebrationType,
            yearsCompleted: item.yearsCompleted,
            assetId: finalAssetId,
            assetImageUrl: finalImage,
          }),
        });

        const resData = await res.json();

        if (!res.ok) {
          throw new Error(resData.error || "Failed to send celebration email.");
        }

        await Swal.fire({
          icon: "success",
          title: "Celebration Email Sent!",
          text: `Greeting successfully delivered to ${item.employeeName}.`,
          confirmButtonColor: "#4318FF",
          background: "#ffffff",
          color: "#0f172a",
          customClass: {
            popup: "rounded-3xl shadow-2xl border border-slate-100",
          },
        });

        fetchCelebrations();
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Send Failed",
          text: err.message || "Failed to deliver celebration email.",
          confirmButtonColor: "#4318FF",
        });
      }
    }
  };

  const handleRunAutomation = async () => {
    setIsAutomating(true);
    try {
      const res = await fetch("/api/celebrations/automate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: true }),
      });
      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.error || "Automation check failed.");
      }

      await Swal.fire({
        icon: "success",
        title: "Automation Check Complete!",
        text: `Checked ${resData.summary?.totalChecked || 0} milestone(s). Dispatched ${resData.summary?.sent || 0} email(s) today.`,
        confirmButtonColor: "#4318FF",
        background: "#ffffff",
        color: "#0f172a",
        customClass: {
          popup: "rounded-3xl shadow-2xl border border-slate-100",
        },
      });

      fetchCelebrations();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Automation Error",
        text: err.message || "Could not complete automation run.",
        confirmButtonColor: "#4318FF",
      });
    } finally {
      setIsAutomating(false);
    }
  };

  const sortedList = [...(data.celebrations || [])].filter((c) => {
    if (selectedMonth) {
      return new Date(c.date).getMonth() === parseInt(selectedMonth, 10);
    }
    return c.daysRemaining <= 5;
  }).sort((a, b) => {
    return sortOrder === "asc"
      ? a.daysRemaining - b.daysRemaining
      : b.daysRemaining - a.daysRemaining;
  });

  const displayedCelebrations = sortedList.slice(0, visibleCount);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Celebrations
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Stay ahead of important employee milestones and automatically celebrate your people.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Gallery View Button */}
          <button
            type="button"
            onClick={() => {
              setGallerySelectMode(false);
              setGalleryLockCategory(false);
              setGalleryInitialTab("All Assets");
              setIsGalleryOpen(true);
            }}
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 hover:text-slate-900 transition active:scale-95"
          >
            <ImageIcon className="h-4 w-4 text-slate-500" />
            <span>Gallery View</span>
          </button>

          {/* Settings Button */}
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 hover:text-slate-900 transition active:scale-95"
            title="Celebration Settings"
          >
            <Settings className="h-4 w-4 text-slate-500" />
            <span>Settings</span>
          </button>

          {/* New Celebration Button */}
          <button
            type="button"
            onClick={() => setIsManualOpen(true)}
            className="flex items-center gap-2 rounded-full bg-[#4318FF] px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-500/20 hover:bg-[#3713d9] transition active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>New Celebration</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Upcoming This Month */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              UPCOMING THIS MONTH
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
            {data.stats?.upcomingThisMonth || 18}
          </p>
        </div>

        {/* Card 2: Birthdays */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              BIRTHDAYS
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-pink-50 text-pink-600">
              <Cake className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
            {data.stats?.birthdayCount || 9}
          </p>
        </div>

        {/* Card 3: Work Anniversaries */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              WORK ANNIVERSARIES
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-[#4318FF]">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
            {data.stats?.workAnniversaryCount || 6}
          </p>
        </div>

        {/* Card 4: Personal Anniversaries */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              PERSONAL ANNIVERSARIES
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Heart className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
            {data.stats?.personalAnniversaryCount || 3}
          </p>
        </div>
      </div>

      {/* Main Grid: Left Celebrations Cards + Right Schedule & Log Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: UPCOMING CELEBRATIONS */}
        <div className="lg:col-span-2 space-y-5">
          {/* Header & Filter Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Upcoming Celebrations
              </h2>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                Showing {displayedCelebrations.length} of {sortedList.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Month Filter */}
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="">Next 5 Days</option>
                <option value="0">January</option>
                <option value="1">February</option>
                <option value="2">March</option>
                <option value="3">April</option>
                <option value="4">May</option>
                <option value="5">June</option>
                <option value="6">July</option>
                <option value="7">August</option>
                <option value="8">September</option>
                <option value="9">October</option>
                <option value="10">November</option>
                <option value="11">December</option>
              </select>

              {/* Type Filter */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="">All Types</option>
                <option value="Birthday">Birthdays</option>
                <option value="Work Anniversary">Work Anniversaries</option>
                <option value="Personal Anniversary">Personal Milestones</option>
              </select>

              {/* Sort Order Toggle */}
              <button
                type="button"
                onClick={() => setSortOrder((o) => (o === "asc" ? "desc" : "asc"))}
                className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 shadow-xs"
                title="Sort by date"
              >
                <ArrowUpDown className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          {loading ? (
            <div className="py-20 text-center rounded-3xl border border-slate-100 bg-white">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#4318FF]" />
              <p className="mt-3 text-xs text-slate-500">Loading upcoming celebrations...</p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {displayedCelebrations.map((item) => {
                  const override = customImageOverrides[item.id];
                  const emailImage = override?.imageUrl || item.emailImageUrl;

                  return (
                    <div
                      key={item.id}
                      className="group relative rounded-3xl border border-slate-100 bg-white overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
                    >
                      {/* Top Large Email Celebration Banner Image */}
                      <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={emailImage}
                          alt="Celebration Email Banner"
                          className="h-full w-full object-cover object-center transition duration-300 group-hover:scale-102"
                        />

                        {/* Edit Email Image Button on Banner */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditImage(item)}
                          className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-slate-900/80 hover:bg-slate-900 backdrop-blur-xs px-3 py-1 text-[11px] font-bold text-white shadow-md transition active:scale-95"
                          title="Click to choose a different gallery image for this email"
                        >
                          <Camera className="h-3.5 w-3.5 text-indigo-400" />
                          <span>Edit Email Image</span>
                        </button>

                        {/* Milestone Day Badge (Top Right) */}
                        <span
                          className={`absolute top-3 right-3 rounded-full px-3 py-1 text-[10px] font-bold shadow-sm backdrop-blur-xs ${item.badgeColor}`}
                        >
                          {item.badgeLabel}
                        </span>

                        {/* Small Circle Employee Profile Photo Overlay (Bottom Left) */}
                        <div className="absolute -bottom-4 left-5">
                          <div className="relative h-14 w-14 rounded-full border-3 border-white bg-white shadow-md overflow-hidden flex items-center justify-center">
                            {item.avatar ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.avatar}
                                alt={item.employeeName}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-base">
                                {item.firstName?.charAt(0)}
                                {item.lastName?.charAt(0)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Content Body */}
                      <div className="p-5 pt-7 flex-1 flex flex-col justify-between space-y-4">
                        <div>
                          <h3 className="text-base font-bold text-slate-900 leading-snug">
                            {item.title}
                          </h3>

                          <div className="mt-2 space-y-1">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                              <Briefcase className="h-3 w-3 text-slate-400" />
                              <span>{item.employeeName} · {item.jobTitle}</span>
                            </p>
                            <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                              <Calendar className="h-3 w-3 text-slate-400" />
                              <span>{formatDisplayDate(item.date)}</span>
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => handleSendCelebrationNow(item)}
                            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-indigo-100 bg-indigo-50/70 py-2.5 text-xs font-bold text-[#4318FF] hover:bg-indigo-100/80 transition"
                          >
                            <Send className="h-3.5 w-3.5" />
                            <span>Send Email Now</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Add Manual Celebration Card */}
                <div
                  onClick={() => setIsManualOpen(true)}
                  className="rounded-3xl border-2 border-dashed border-indigo-200 bg-indigo-50/20 p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-indigo-50/40 transition min-h-[300px]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-[#4318FF] mb-3 shadow-xs">
                    <Plus className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    Add Manual Celebration
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 max-w-xs">
                    Create a custom milestone for an employee
                  </p>
                </div>
              </div>

              {/* Scroll Sentinel */}
              <div ref={observerTargetRef} className="py-4 text-center">
                {isLoadingMore ? (
                  <div className="flex items-center justify-center gap-2 text-xs font-bold text-indigo-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading more celebrations on scroll...</span>
                  </div>
                ) : visibleCount < sortedList.length ? (
                  <p className="text-xs text-slate-400">Scroll down to view more upcoming celebrations</p>
                ) : (
                  <p className="text-xs text-slate-400">All {sortedList.length} celebrations loaded</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: GLOBAL SCHEDULE & DELIVERY LOG */}
        <div className="space-y-6">
          {/* Global Schedule Card */}
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#4318FF]" />
              <h3 className="text-base font-bold text-slate-900">
                Global Schedule
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Automated celebration emails are sent daily at these configured times in Indian Standard Time.
            </p>

            <div className="space-y-2.5 pt-2">
              {/* Birthdays schedule */}
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                <div className="flex items-center gap-2.5">
                  <Cake className="h-4 w-4 text-pink-500" />
                  <span className="text-xs font-bold text-slate-800">
                    Birthdays
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-mono font-bold text-slate-700 hover:bg-slate-50 shadow-2xs"
                >
                  <span>{data.settings?.birthdayScheduleTime || "09:00 AM"}</span>
                  <Pencil className="h-3 w-3 text-slate-400" />
                </button>
              </div>

              {/* Work Anniversaries schedule */}
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                <div className="flex items-center gap-2.5">
                  <Award className="h-4 w-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-800">
                    Work Anniversaries
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-mono font-bold text-slate-700 hover:bg-slate-50 shadow-2xs"
                >
                  <span>{data.settings?.workAnniversaryScheduleTime || "09:00 AM"}</span>
                  <Pencil className="h-3 w-3 text-slate-400" />
                </button>
              </div>

              {/* Personal Milestones schedule */}
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                <div className="flex items-center gap-2.5">
                  <Heart className="h-4 w-4 text-rose-500" />
                  <span className="text-xs font-bold text-slate-800">
                    Personal Milestones
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-mono font-bold text-slate-700 hover:bg-slate-50 shadow-2xs"
                >
                  <span>{data.settings?.personalAnniversaryScheduleTime || "10:00 AM"}</span>
                  <Pencil className="h-3 w-3 text-slate-400" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold pt-2 border-t border-slate-100">
              <span>Timezone</span>
              <span className="text-slate-800 font-mono font-bold">
                {data.settings?.timezone || "Asia/Kolkata (IST)"}
              </span>
            </div>

            {/* Run Automation Now button */}
            <button
              type="button"
              onClick={handleRunAutomation}
              disabled={isAutomating}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition shadow-xs disabled:opacity-50"
            >
              {isAutomating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Checking Schedules...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
                  <span>Check & Run Automation Now</span>
                </>
              )}
            </button>
          </div>

          {/* Delivery Log Card */}
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCw className="h-4 w-4 text-[#4318FF]" />
                <h3 className="text-base font-bold text-slate-900">
                  Delivery Log
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsLogsOpen(true)}
                className="text-xs font-bold text-[#4318FF] hover:underline"
              >
                View All
              </button>
            </div>

            {/* Recent Log Items */}
            <div className="space-y-3">
              {(data.recentLogs && data.recentLogs.length > 0
                ? data.recentLogs.slice(0, 4)
                : [
                    {
                      _id: "1",
                      employeeName: "Alex Chen",
                      celebrationType: "Birthday Message",
                      sentAt: new Date(),
                      status: "SENT",
                    },
                    {
                      _id: "2",
                      employeeName: "Maria Garcia",
                      celebrationType: "2 Yr Anniversary",
                      sentAt: new Date(Date.now() - 86400000),
                      status: "SENT",
                    },
                    {
                      _id: "3",
                      employeeName: "James Wilson",
                      celebrationType: "Birthday Message",
                      sentAt: new Date(Date.now() - 172800000),
                      status: "FAILED",
                    },
                  ]
              ).map((log) => {
                const isSent = log.status === "SENT";
                return (
                  <div
                    key={log._id}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5"
                  >
                    <div className="flex items-start gap-2.5">
                      {isSent ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-rose-500 mt-0.5" />
                      )}
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          {log.employeeName}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {log.celebrationType}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {formatRelativeTime(log.sentAt || log.createdAt)}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        isSent
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {log.status}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Bottom Link */}
            <div className="pt-2 text-center border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsLogsOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#4318FF] transition"
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>View Full Report</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CelebrationGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => {
          setIsGalleryOpen(false);
          setGallerySelectMode(false);
          setGalleryLockCategory(false);
        }}
        selectMode={gallerySelectMode}
        initialTab={galleryInitialTab}
        lockCategory={galleryLockCategory}
        onSelectAsset={handleAssetSelected}
      />

      <CelebrationSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        initialSettings={data.settings}
        onSettingsUpdated={(newSettings) =>
          setData((p) => ({ ...p, settings: newSettings }))
        }
      />

      <DeliveryLogsModal
        isOpen={isLogsOpen}
        onClose={() => setIsLogsOpen(false)}
      />

      <ManualCelebrationModal
        isOpen={isManualOpen}
        onClose={() => setIsManualOpen(false)}
        onCelebrationCreated={fetchCelebrations}
        employees={employees}
      />
    </div>
  );
}
