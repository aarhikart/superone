"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getNavItemsForRole } from "@/lib/admin-access";

import {
  LayoutDashboard,
  Users,
  PartyPopper,
  BookOpen,
  Newspaper,
  Briefcase,
  Megaphone,
  FileText,
  FolderGit2,
  HelpCircle,
  MessageSquare,
  ShieldCheck,
  LogOut,
  X,
  ChevronRight,
} from "lucide-react";

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
};

function getNavIcon(href) {
  switch (href) {
    case "/admin":
      return LayoutDashboard;
    case "/admin/employees":
      return Users;
    case "/admin/celebrations":
      return PartyPopper;
    case "/admin/blogs":
      return BookOpen;
    case "/admin/articles":
      return Newspaper;
    case "/admin/jobs":
      return Briefcase;
    case "/admin/press-releases":
      return Megaphone;
    case "/admin/job-applications":
      return FileText;
    case "/admin/employee-extensions":
      return FolderGit2;
    case "/admin/poc-requests":
      return HelpCircle;
    case "/admin/contact-messages":
      return MessageSquare;
    case "/admin/login-management":
      return ShieldCheck;
    default:
      return LayoutDashboard;
  }
}

export default function AdminShell({ currentUser, children }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const [notifications, setNotifications] = useState([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const dropdownRef = useRef(null);

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  }

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (currentUser && currentUser.role !== "Marketing") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 15000); // Poll every 15s
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleMarkAllAsRead() {
    try {
      const res = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readAll: true }),
      });
      if (res.ok) {
        setNotifications((current) => current.map((n) => ({ ...n, read: true })));
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleMarkAsRead(id) {
    try {
      const res = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setNotifications((current) =>
          current.map((n) => (n._id === id ? { ...n, read: true } : n))
        );
      }
    } catch (err) {
      console.error(err);
    }
  }

  const isLoginPage = pathname === "/admin/login";
  const navItems = currentUser?.role ? getNavItemsForRole(currentUser.role) : [];

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      setIsLoggingOut(false);
      window.location.replace("/admin/login");
    }
  }

  if (isLoginPage) {
    return children;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.22),_transparent_28%),linear-gradient(180deg,#f8fafc_0%,#eef4ff_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-800/80 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-5 text-slate-100 shadow-2xl backdrop-blur transition-transform duration-300 lg:static lg:translate-x-0 flex flex-col justify-between ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex flex-col min-h-0 flex-1">
            {/* Top Logo & Branding */}
            <div className="flex items-center justify-between pb-5 border-b border-white/10">
              <Link href="/admin" className="flex items-center gap-3 group">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 border border-white/15 p-1.5 shadow-inner transition group-hover:bg-white/15">
                  <img
                    src="/uploads/logo.png"
                    alt="Logo"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold tracking-tight text-white group-hover:text-cyan-300 transition truncate">
                    PeoplePulse
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-wider uppercase text-cyan-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    Control Room
                  </span>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                className="rounded-full border border-white/10 p-2 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden transition"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Signed-in User Card */}
            <div className="mt-4 rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-3 backdrop-blur-sm shadow-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#00AEEF] to-[#4318FF] text-white font-bold text-xs shadow-md">
                  {currentUser?.username ? currentUser.username[0].toUpperCase() : "A"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-white capitalize">
                    {currentUser?.username || "Admin"}
                  </p>
                  <span className="inline-block mt-0.5 rounded-md bg-cyan-400/15 border border-cyan-400/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-300">
                    {currentUser?.role || "Staff"}
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Items with Real Icons */}
            <nav className="mt-5 flex-1 space-y-1 overflow-y-auto pr-1">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                const IconComponent = getNavIcon(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`group flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200 ${
                      isActive
                        ? "bg-[#00AEEF] text-white shadow-lg shadow-sky-500/25 translate-x-0.5"
                        : "text-slate-300 hover:bg-white/8 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-white/5 text-slate-400 group-hover:bg-white/10 group-hover:text-cyan-300"
                        }`}
                      >
                        <IconComponent className="h-4 w-4" />
                      </span>
                      <span className="truncate">{item.label}</span>
                    </div>
                    {isActive && (
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-white/80" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer Logout */}
          <div className="pt-4 border-t border-white/10 mt-3">
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-rose-500/15 hover:border-rose-500/30 hover:text-rose-300 transition"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>{isLoggingOut ? "Signing out..." : "Sign Out"}</span>
            </button>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/75 px-4 py-4 backdrop-blur lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(true)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium shadow-sm lg:hidden"
                >
                  Menu
                </button>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
                    Admin Dashboard
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-950">
                    Professional content and hiring operations
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Notifications Bell */}
                {currentUser && currentUser.role !== "Marketing" && mounted && (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                      className="relative rounded-2xl border border-slate-200 bg-white p-3 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 shadow-sm"
                      aria-label="Notifications"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="h-6 w-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                        />
                      </svg>
                      {notifications.filter((n) => !n.read).length > 0 && (
                        <span className="absolute right-2.5 top-2.5 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                      )}
                    </button>

                    {isNotificationsOpen && (
                      <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-3xl border border-slate-200 bg-white p-4 shadow-xl ring-1 ring-black/5 z-50">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <h3 className="font-bold text-slate-900">Notifications</h3>
                          {notifications.filter((n) => !n.read).length > 0 && (
                            <button
                              type="button"
                              onClick={handleMarkAllAsRead}
                              className="text-xs font-semibold text-sky-600 hover:text-slate-900 transition"
                            >
                              Mark all as read
                            </button>
                          )}
                        </div>

                        <div className="mt-3 max-h-72 overflow-y-auto divide-y divide-slate-100">
                          {notifications.length === 0 ? (
                            <p className="py-4 text-center text-sm text-slate-500">
                              No notifications yet
                            </p>
                          ) : (
                            notifications.map((n) => (
                              <div
                                key={n._id}
                                className={`py-3 transition ${n.read ? "opacity-60" : "font-medium"}`}
                              >
                                <Link
                                  href={
                                    n.action === "New Application"
                                      ? "/admin/job-applications"
                                      : n.action === "New POC Request"
                                      ? "/admin/poc-requests"
                                      : n.action === "New Contact Message"
                                      ? "/admin/contact-messages"
                                      : `/admin/jobs/${n.job}`
                                  }
                                  onClick={() => {
                                    handleMarkAsRead(n._id);
                                    setIsNotificationsOpen(false);
                                  }}
                                  className="block hover:text-sky-600 text-sm text-slate-800"
                                >
                                  {n.message}
                                </Link>
                                 <span className="text-[10px] text-slate-400 mt-1 block" suppressHydrationWarning>
                                   {formatDate(n.createdAt)}
                                 </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {isLoggingOut ? "Signing out..." : "Logout"}
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 lg:p-8">{children}</main>
        </div>
      </div>

      {isSidebarOpen ? (
        <button
          type="button"
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
          aria-label="Close sidebar overlay"
        />
      ) : null}
    </div>
  );
}
