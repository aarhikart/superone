"use client";

import { useState } from "react";
import { Calendar, CalendarDays } from "lucide-react";
import DashboardCharts from "./dashboard-charts";
import RecentAlerts from "./recent-alerts";
import FilterDropdown from "./FilterDropdown";

function formatCount(value) {
  return value.toLocaleString("en-IN");
}

export default function AdminDashboardClient({
  currentUser,
  jobs,
  articles,
  pressReleases,
  totalBlogs,
  jobApps,
  pocReqs,
  contactMsgs,
  visitorCounter,
  recentAlertsList,
  topBlogs,
}) {
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");

  const monthOptions = [
    { value: "all", label: "All Months", icon: <Calendar size={16} /> },
    { value: 0, label: "January", icon: <Calendar size={16} /> },
    { value: 1, label: "February", icon: <Calendar size={16} /> },
    { value: 2, label: "March", icon: <Calendar size={16} /> },
    { value: 3, label: "April", icon: <Calendar size={16} /> },
    { value: 4, label: "May", icon: <Calendar size={16} /> },
    { value: 5, label: "June", icon: <Calendar size={16} /> },
    { value: 6, label: "July", icon: <Calendar size={16} /> },
    { value: 7, label: "August", icon: <Calendar size={16} /> },
    { value: 8, label: "September", icon: <Calendar size={16} /> },
    { value: 9, label: "October", icon: <Calendar size={16} /> },
    { value: 10, label: "November", icon: <Calendar size={16} /> },
    { value: 11, label: "December", icon: <Calendar size={16} /> },
  ];

  const currentYearVal = new Date().getFullYear();
  const yearOptions = [
    { value: "all", label: "All Years", icon: <CalendarDays size={16} /> },
    ...Array.from({ length: 6 }, (_, i) => {
      const y = currentYearVal - i;
      return { value: y, label: String(y), icon: <CalendarDays size={16} /> };
    }),
  ];

  // Filter lists based on selectedMonth and selectedYear
  const filteredJobApps = jobApps.filter((app) => {
    if (!app.createdAt) return false;
    const date = new Date(app.createdAt);
    const monthMatch = selectedMonth === "all" || date.getMonth() === selectedMonth;
    const yearMatch = selectedYear === "all" || date.getFullYear() === selectedYear;
    return monthMatch && yearMatch;
  });

  const filteredPocReqs = pocReqs.filter((req) => {
    if (!req.createdAt) return false;
    const date = new Date(req.createdAt);
    const monthMatch = selectedMonth === "all" || date.getMonth() === selectedMonth;
    const yearMatch = selectedYear === "all" || date.getFullYear() === selectedYear;
    return monthMatch && yearMatch;
  });

  const filteredContactMsgs = contactMsgs.filter((msg) => {
    if (!msg.createdAt) return false;
    const date = new Date(msg.createdAt);
    const monthMatch = selectedMonth === "all" || date.getMonth() === selectedMonth;
    const yearMatch = selectedYear === "all" || date.getFullYear() === selectedYear;
    return monthMatch && yearMatch;
  });

  // Re-compute Job Applications Stats for the selected period
  const totalJobApps = filteredJobApps.length;
  const underReviewJobApps = filteredJobApps.filter((app) => app.status === "under review").length;
  const shortlistedJobApps = filteredJobApps.filter((app) => app.status === "shortlisted").length;
  const notShortlistedJobApps = filteredJobApps.filter((app) => app.status === "not shortlisted").length;

  // Re-compute POC Requests Stats for the selected period
  const totalPocs = filteredPocReqs.length;
  const underReviewPocs = filteredPocReqs.filter((req) => req.status === "under review").length;
  const approvedPocs = filteredPocReqs.filter((req) => req.status === "approved").length;
  const rejectedPocs = filteredPocReqs.filter((req) => req.status === "rejected").length;

  // Re-compute Contact Messages Stats for the selected period
  const totalContacts = filteredContactMsgs.length;
  const underReviewContacts = filteredContactMsgs.filter((msg) => msg.status === "under review").length;
  const contactedContacts = filteredContactMsgs.filter((msg) => msg.status === "contacted").length;
  const ignoredContacts = filteredContactMsgs.filter((msg) => msg.status === "ignored").length;

  const totalVisitors = visitorCounter?.total || 0;

  return (
    <div className="grid gap-8">
      {/* 1. Header Hero Card */}
      <section className="rounded-[2.5rem] bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.28),_transparent_30%),linear-gradient(145deg,#020617_0%,#0f172a_38%,#155e75_120%)] px-6 py-8 text-white shadow-xl sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-cyan-300/90">
          Executive Overview
        </p>
        <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="max-w-3xl text-3xl font-bold leading-tight sm:text-5xl">
              Welcome back, {currentUser.username}. Admin dashboard is live.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200 sm:text-base">
              Monitor incoming candidate applications, business POC requests, contact inquiries, and operational metrics.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-white/10 px-5 py-4 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Current Role</p>
            <p className="mt-2 text-2xl font-semibold">{currentUser.role}</p>
          </div>
        </div>
      </section>

      {/* Shared Global Dashboard Filter Card */}
      <section className="flex flex-col gap-4 rounded-[2.5rem] bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-950">Dashboard Period</h2>
          <p className="text-sm text-slate-500">Filter stats and overview charts by month and year.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Month
            <FilterDropdown
              value={selectedMonth}
              onChange={(val) => setSelectedMonth(val)}
              options={monthOptions}
              className="w-44 text-slate-800"
            />
          </label>
          <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Year
            <FilterDropdown
              value={selectedYear}
              onChange={(val) => setSelectedYear(val)}
              options={yearOptions}
              className="w-32 text-slate-800"
            />
          </label>
        </div>
      </section>

      {/* 2. Statistical Breakdown Grid */}
      <section className="grid gap-6 md:grid-cols-3">
        <article className="rounded-[2.5rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-3">
            <span className="text-2xl">Visits</span>
            <h3 className="text-xl font-bold text-slate-900">Website Visitors</h3>
          </div>
          <div className="mt-5">
            <p className="text-4xl font-extrabold text-slate-950">{formatCount(totalVisitors)}</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-1">
              Landing page total
            </p>
          </div>
          <p className="mt-6 border-t border-slate-100 pt-5 text-sm leading-6 text-slate-500">
            Counts new landing-page visits once per browser every 24 hours.
          </p>
        </article>

        {/* Job Applications Stats Card */}
        <article className="rounded-[2.5rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📄</span>
            <h3 className="text-xl font-bold text-slate-900">Job Applications</h3>
          </div>
          <div className="mt-5">
            <p className="text-4xl font-extrabold text-slate-950">{formatCount(totalJobApps)}</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-1">Total Received</p>
          </div>
          <div className="mt-6 border-t border-slate-100 pt-5 space-y-3.5">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-slate-600 font-medium">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                Under Review
              </span>
              <span className="font-bold text-slate-900">{formatCount(underReviewJobApps)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-slate-600 font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Shortlisted
              </span>
              <span className="font-bold text-slate-900">{formatCount(shortlistedJobApps)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-slate-600 font-medium">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                Not Shortlisted
              </span>
              <span className="font-bold text-slate-900">{formatCount(notShortlistedJobApps)}</span>
            </div>
          </div>
        </article>

        {/* POC Requests Stats Card */}
        <article className="rounded-[2.5rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📌</span>
            <h3 className="text-xl font-bold text-slate-900">POC Requests</h3>
          </div>
          <div className="mt-5">
            <p className="text-4xl font-extrabold text-slate-950">{formatCount(totalPocs)}</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-1">Total Submissions</p>
          </div>
          <div className="mt-6 border-t border-slate-100 pt-5 space-y-3.5">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-slate-600 font-medium">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                Under Review
              </span>
              <span className="font-bold text-slate-900">{formatCount(underReviewPocs)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-slate-600 font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Approved
              </span>
              <span className="font-bold text-slate-900">{formatCount(approvedPocs)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-slate-600 font-medium">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                Rejected
              </span>
              <span className="font-bold text-slate-900">{formatCount(rejectedPocs)}</span>
            </div>
          </div>
        </article>

        {/* Contact Messages Stats Card */}
        <article className="rounded-[2.5rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📩</span>
            <h3 className="text-xl font-bold text-slate-900">Contact Messages</h3>
          </div>
          <div className="mt-5">
            <p className="text-4xl font-extrabold text-slate-950">{formatCount(totalContacts)}</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-1">Total Inquiries</p>
          </div>
          <div className="mt-6 border-t border-slate-100 pt-5 space-y-3.5">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-slate-600 font-medium">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                Under Review
              </span>
              <span className="font-bold text-slate-900">{formatCount(underReviewContacts)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-slate-600 font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Contacted
              </span>
              <span className="font-bold text-slate-900">{formatCount(contactedContacts)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-slate-600 font-medium">
                <span className="h-2 w-2 rounded-full bg-slate-950" />
                Ignored
              </span>
              <span className="font-bold text-slate-900">{formatCount(ignoredContacts)}</span>
            </div>
          </div>
        </article>
      </section>

      {/* 3. Bar Chart & Live Alerts Section */}
      <section className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          {/* Job Applications Overview Chart */}
          <DashboardCharts
            data={filteredJobApps}
            title="Job Applications Overview"
            subtitle="Monitor applicant traffic patterns across days, months, and years."
            valueSuffix="applications"
          />
          {/* POC Requests Overview Chart */}
          <DashboardCharts
            data={filteredPocReqs}
            title="POC Requests Overview"
            subtitle="Monitor POC request traffic patterns across days, months, and years."
            valueSuffix="requests"
          />
        </div>

        <div className="space-y-6">
          {/* Live Alerts Feed Component */}
          <RecentAlerts initialAlerts={recentAlertsList} />

          {/* Top 5 Most Viewed Blogs Widget */}
          <article className="rounded-[2.5rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-2xl font-bold text-slate-950">Top 5 Most Viewed Blogs</h2>
            <p className="mt-1 text-sm text-slate-500 font-medium">
              The most popular blog posts by visitor views.
            </p>

            <div className="mt-6 space-y-4">
              {topBlogs && topBlogs.length > 0 ? (
                topBlogs.map((blog, idx) => (
                  <div
                    key={blog._id}
                    className="flex items-start gap-4 rounded-[1.5rem] border border-slate-100 bg-slate-50/50 p-4 transition hover:bg-slate-50"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-600 font-bold text-sm shadow-sm border border-cyan-500/10">
                      #{idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-950 truncate" title={blog.title}>
                          {blog.title}
                        </p>
                        <span className="text-xs font-bold text-cyan-600 shrink-0 bg-cyan-50 px-2.5 py-0.5 rounded-full">
                          {blog.views || 0} views
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs text-slate-500">
                        Published: {blog.date || (blog.createdAt ? new Date(blog.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A")}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center py-6 text-sm text-slate-400">No blog views recorded yet.</p>
              )}
            </div>
          </article>
        </div>
      </section>

      {/* 4. Details / Admin Metadata Section */}
      <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <article className="rounded-[2.5rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-2xl font-bold text-slate-950">Admin Panel Coverage</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Secure administrative console modules protected by JWT authentication and role-based middleware control.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              "Protected session cookie verification layers",
              "Role-based sidebar navigation state mappings",
              "Direct dashboard metrics updates integration",
              "Preserved background CRUD collections",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-5 text-sm text-slate-700 font-medium"
              >
                {item}
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[2.5rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-2xl font-bold text-slate-950">Active Modules Summary</h2>
          <div className="mt-6 space-y-4">
            {[
              ["Jobs Available", `${jobs.length} postings active`],
              ["Editorial Blogs", `${formatCount(totalBlogs)} blog entries`],
              ["System Articles", `${articles.length} news articles`],
              ["Press Releases", `${pressReleases.length} corporate assets`],
            ].map(([label, detail]) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-[1.5rem] border border-slate-100 px-5 py-4 bg-slate-50/20"
              >
                <div>
                  <p className="text-base font-semibold text-slate-950">{label}</p>
                  <p className="mt-0.5 text-sm text-slate-500">{detail}</p>
                </div>
                <div className="h-2.5 w-2.5 rounded-full bg-cyan-500" />
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
