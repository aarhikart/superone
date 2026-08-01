"use client";

import { useState } from "react";
// All necessary icons imported from lucide-react
import { Trash2, CheckCircle, Loader2, Eye, RefreshCw, X, ChevronLeft, ChevronRight, Calendar, CalendarDays, Layers, Search, XCircle } from "lucide-react"; 
import FilterDropdown from "../_components/FilterDropdown";
import { confirmAndDelete } from "../delete-helper";

const RECORDS_PER_PAGE = 20;

function getPaginationItems(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, "ellipsis", totalPages - 2, totalPages - 1, totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [1, 2, 3, "ellipsis", totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, "ellipsis-start", currentPage - 1, currentPage, currentPage + 1, "ellipsis-end", totalPages];
}

export default function AdminJobApplicationsTabs({ applications: initialApplications }) {
  const [activeTab, setActiveTab] = useState("new");
  const [applications, setApplications] = useState(initialApplications || []);
  const [isDeleting, setIsDeleting] = useState(null);
  const [isUpdating, setIsUpdating] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Month & Year Filter state (default to all months and all years)
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");

  // Modal control states
  const [statusModalApp, setStatusModalApp] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [viewModalApp, setViewModalApp] = useState(null);

  // SEPARATION ENGINE: "new" data stays on tab 1. Any update means it moves to tab 2 and STAYS there.
  const newApplications = applications.filter(app => app.status === "new");
  const reviewedApplications = applications.filter(app => app.status !== "new");
  const statusOptions = Array.from(new Set(reviewedApplications.map((app) => app.status).filter(Boolean)));

  const periodApplications = reviewedApplications.filter((app) => {
    if (!app.createdAt) return false;
    const date = new Date(app.createdAt);
    const monthMatch = selectedMonth === "all" || date.getMonth() === selectedMonth;
    const yearMatch = selectedYear === "all" || date.getFullYear() === selectedYear;
    return monthMatch && yearMatch;
  });

  const filteredApplications = periodApplications.filter((app) => {
    return statusFilter === "all" || app.status === statusFilter;
  });

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

  const standardStatuses = ["reviewed", "under review", "shortlisted", "not shortlisted"];
  const allDbStatuses = Array.from(new Set([...standardStatuses, ...reviewedApplications.map(app => app.status).filter(Boolean)]));

  const statusDropdownOptions = [
    {
      value: "all",
      label: "All Statuses",
      icon: <Layers size={16} />,
      badge: periodApplications.length,
      badgeColor: "bg-slate-100 text-slate-700 border border-slate-200"
    },
    ...allDbStatuses.map(status => {
      let icon = <Eye size={16} />;
      let badgeColor = "bg-blue-50 text-blue-700 border border-blue-200";
      if (status === "under review") {
        icon = <Search size={16} />;
        badgeColor = "bg-amber-50 text-amber-700 border border-amber-200";
      } else if (status === "shortlisted") {
        icon = <CheckCircle size={16} />;
        badgeColor = "bg-emerald-50 text-emerald-700 border border-emerald-200";
      } else if (status === "not shortlisted") {
        icon = <XCircle size={16} />;
        badgeColor = "bg-rose-50 text-rose-700 border border-rose-200";
      }
      
      const count = periodApplications.filter(app => app.status === status).length;
      
      return {
        value: status,
        label: status.charAt(0).toUpperCase() + status.slice(1),
        icon,
        badge: count,
        badgeColor
      };
    })
  ];

  const totalPages = Math.max(1, Math.ceil(filteredApplications.length / RECORDS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedApplications = filteredApplications.slice(
    (safeCurrentPage - 1) * RECORDS_PER_PAGE,
    safeCurrentPage * RECORDS_PER_PAGE
  );
  const paginationItems = getPaginationItems(safeCurrentPage, totalPages);

  // Format date helper for human scanning
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "shortlisted":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      case "not shortlisted":
        return "bg-rose-50 text-rose-700 border border-rose-200";
      case "under review":
        return "bg-amber-50 text-amber-700 border border-amber-200";
      case "reviewed":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      default:
        return "bg-slate-50 text-slate-700 border border-slate-200";
    }
  };

  // Sync state helper to accurately match current view data models
  const updateLocalAppInState = (id, updatedFields) => {
    setApplications(prev =>
      prev.map(app => (app._id === id ? { ...app, ...updatedFields } : app))
    );
    // Keep open view modal synced if open
    if (viewModalApp && viewModalApp._id === id) {
      setViewModalApp(prev => ({ ...prev, ...updatedFields }));
    }
  };

  // Status Update Handler for NEW tab (Moves item to 'reviewed')
  const handleMoveToReviewed = async (id) => {
    setIsUpdating(id);
    try {
      const res = await fetch(`/api/job-applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "reviewed" }),
      });

      const data = await res.json();

      if (res.ok && data.application) {
        // Sync local record with the exact updated model returned by the database
        updateLocalAppInState(id, data.application);
      } else {
        alert(data.error || "Failed to update status in the database.");
      }
    } catch (error) {
      console.error("Error updating application status:", error);
      alert("Something went wrong.");
    } finally {
      setIsUpdating(null);
    }
  };

  // Status Update Handler from Modal (Keeps data inside Reviewed Tab)
  const handleSaveStatusUpdate = async () => {
    if (!statusModalApp || !selectedStatus) return;
    
    const id = statusModalApp._id.toString();
    setIsUpdating(id);

    try {
      const res = await fetch(`/api/job-applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: selectedStatus }),
      });

      const data = await res.json();

      if (res.ok && data.application) {
        // Sync state seamlessly. Because status !== "new", it correctly stays in the reviewed tab!
        updateLocalAppInState(id, data.application);
        setStatusModalApp(null); 
      } else {
        alert(data.error || "Failed to update status.");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Something went wrong.");
    } finally {
      setIsUpdating(null);
    }
  };

  const handleDelete = async (id) => {
    try {
      const result = await confirmAndDelete({
        title: "Delete Application?",
        text: "Are you sure you want to delete this application? This action cannot be undone.",
        successText: "Application deleted successfully.",
        defaultErrorText: "Failed to delete application from database.",
        deleteFn: async () => {
          setIsDeleting(id);
          try {
            return await fetch(`/api/job-applications/${id}`, {
              method: "DELETE",
            });
          } finally {
            setIsDeleting(null);
          }
        }
      });

      if (result && result.success) {
        setApplications(applications.filter((app) => app._id !== id));
      }
    } catch (error) {
      console.error("Error deleting application:", error);
    }
  };

    const renderTable = (targetDataset, tabType) => (
    <div className="overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-200">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Name</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Email</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Phone</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Applied Role</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Resume</th>
              {/* Only show header if tab is reviewed */}
              {tabType === "reviewed" && (
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Current Status</th>
              )}
              <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {targetDataset.map((application) => {
              const appIdString = application._id.toString();
              return (
                <tr key={appIdString} className="hover:bg-slate-50">
                  <td className="px-6 py-5 text-sm font-semibold text-slate-900">
                    {application.firstName} {application.lastName}
                  </td>
                  <td className="px-6 py-5 text-sm text-slate-600">{application.email}</td>
                  <td className="px-6 py-5 text-sm text-slate-600">{application.phone}</td>
                  <td className="px-6 py-5 text-sm text-slate-600">{application.roleTitle}</td>
                  <td className="px-6 py-5">
                    <a
                      href={application.resumeUrl}
                      download={application.resumeFileName}
                      className="inline-flex rounded-full bg-[#00aeef] px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-900"
                    >
                      Download Resume
                    </a>
                  </td>
                  {/* Only show table data cell if tab is reviewed */}
                  {tabType === "reviewed" && (
                    <td className="px-6 py-5 text-sm font-medium">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusBadgeClass(application.status)}`}>
                        {application.status}
                      </span>
                    </td>
                  )}
                  <td className="px-6 py-5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      
                      {tabType === "new" && (
                        <>
                          <button
                            onClick={() => handleMoveToReviewed(appIdString)}
                            disabled={isUpdating === appIdString}
                            className="text-emerald-500 hover:text-emerald-700 transition-colors p-2 rounded-full hover:bg-emerald-50 disabled:opacity-50"
                            title="Mark as Reviewed"
                          >
                            {isUpdating === appIdString ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <CheckCircle size={18} />
                            )}
                          </button>

                          <button
                            onClick={() => handleDelete(appIdString)}
                            disabled={isDeleting === appIdString}
                            className="text-red-500 hover:text-red-700 transition-colors p-2 rounded-full hover:bg-red-50 disabled:opacity-50"
                            title="Delete Application"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}

                      {tabType === "reviewed" && (
                        <>
                          <button
                            onClick={() => {
                              // Find fresh app state parameters 
                              const freshApp = applications.find(a => a._id.toString() === appIdString);
                              setViewModalApp(freshApp || application);
                            }}
                            className="text-blue-500 hover:text-blue-700 transition-colors p-2 rounded-full hover:bg-blue-50"
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>

                          <button
                            onClick={() => {
                              const freshApp = applications.find(a => a._id.toString() === appIdString);
                              const currentApp = freshApp || application;
                              setStatusModalApp(currentApp);
                              setSelectedStatus(currentApp.status || "");
                            }}
                            disabled={isUpdating === appIdString}
                            className="text-amber-500 hover:text-amber-700 transition-colors p-2 rounded-full hover:bg-amber-50 disabled:opacity-50"
                            title="Update Status"
                          >
                            {isUpdating === appIdString ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <RefreshCw size={18} />
                            )}
                          </button>
                        </>
                      )}

                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>


          {targetDataset.length === 0 ? (
        <div className="px-6 py-14 text-center text-slate-500">
          No job applications found in this tab.
        </div>
      ) : null}
    </div>
  );
return (
    <>
      
      <div className="mt-8 flex justify-start">
        <div className="inline-flex items-center gap-1 rounded-full bg-[#00aeef] p-1.5 shadow-inner">
          <button
            onClick={() => setActiveTab("new")}
            className={`rounded-full px-6 py-2.5 text-sm font-semibold transition-all ${
              activeTab === "new"
                ? "bg-white text-[#00aeef] shadow-md"
                : "text-white hover:text-sky-100"
            }`}
          >
            New Applications ({newApplications.length})
          </button>
          <button
            onClick={() => setActiveTab("reviewed")}
            className={`rounded-full px-6 py-2.5 text-sm font-semibold transition-all ${
              activeTab === "reviewed"
                ? "bg-white text-[#00aeef] shadow-md"
                : "text-white hover:text-sky-100"
            }`}
          >
            Reviewed Applications ({reviewedApplications.length})
          </button>
        </div>
      </div>

      {/* Conditionally show active tab grid templates */}
      <div className="mt-6">
        {activeTab === "new" && renderTable(newApplications, "new")}
        {activeTab === "reviewed" && (
          <>
            <div className="mb-4 flex flex-col gap-4 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                  Reviewed Applications
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Showing {filteredApplications.length} of {periodApplications.length} reviewed records.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <label className="grid gap-2 text-sm font-semibold text-slate-700 sm:w-44">
                  Month
                  <FilterDropdown
                    value={selectedMonth}
                    onChange={(val) => {
                      setSelectedMonth(val);
                      setCurrentPage(1);
                    }}
                    options={monthOptions}
                    className="w-44"
                  />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-slate-700 sm:w-32">
                  Year
                  <FilterDropdown
                    value={selectedYear}
                    onChange={(val) => {
                      setSelectedYear(val);
                      setCurrentPage(1);
                    }}
                    options={yearOptions}
                    className="w-32"
                  />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-slate-700 sm:w-[220px]">
                  Status Filter
                  <FilterDropdown
                    value={statusFilter}
                    onChange={(val) => {
                      setStatusFilter(val);
                      setCurrentPage(1);
                    }}
                    options={statusDropdownOptions}
                    className="w-[220px]"
                  />
                </label>
              </div>
            </div>

            {renderTable(paginatedApplications, "reviewed")}

            {totalPages > 1 && (
              <div className="mt-6 flex justify-center">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={safeCurrentPage === 1}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400 shadow-sm transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div className="flex h-11 items-center gap-1 rounded-full bg-slate-100 px-2 shadow-sm">
                    {paginationItems.map((item) =>
                      typeof item === "string" ? (
                        <span key={item} className="px-3 text-sm font-semibold text-slate-500">
                          ...
                        </span>
                      ) : (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setCurrentPage(item)}
                          className={`h-8 min-w-8 rounded-full px-2 text-sm font-semibold transition ${
                            item === safeCurrentPage
                              ? "bg-violet-600 text-white shadow-lg shadow-violet-500/40"
                              : "text-slate-600 hover:bg-white"
                          }`}
                        >
                          {item}
                        </button>
                      )
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    disabled={safeCurrentPage === totalPages}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg shadow-violet-500/40 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-sm"
                    aria-label="Next page"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="hidden">
        <span>
          Page {safeCurrentPage} of {totalPages} · 20 records per page
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={safeCurrentPage === 1}
            className="rounded-full border border-slate-200 px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            disabled={safeCurrentPage === totalPages}
            className="rounded-full border border-slate-200 px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* MODAL 1: STATUS UPDATE MODAL */}
      {statusModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">Update Application Status</h3>
              <button 
                onClick={() => setStatusModalApp(null)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <p className="mt-3 text-sm text-slate-500">
              Set the selection status for <strong>{statusModalApp.firstName} {statusModalApp.lastName}</strong>.
            </p>

            <div className="mt-5 space-y-3">
              {["under review", "shortlisted", "not shortlisted"].map((statusOption) => (
                <label 
                  key={statusOption} 
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 cursor-pointer hover:bg-slate-50 transition"
                >
                  <input
                    type="radio"
                    name="applicationStatus"
                    value={statusOption}
                    checked={selectedStatus === statusOption}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="h-4 w-4 text-[#00aeef] focus:ring-[#00aeef] border-slate-300"
                  />
                  <span className="text-sm font-semibold capitalize text-slate-800">
                    {statusOption}
                  </span>
                </label>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                onClick={() => setStatusModalApp(null)}
                className="rounded-full px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStatusUpdate}
                disabled={isUpdating === statusModalApp._id.toString()}
                className="inline-flex items-center gap-2 rounded-full bg-[#00aeef] px-6 py-2 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:opacity-50"
              >
                {isUpdating === statusModalApp._id.toString() && <Loader2 size={16} className="animate-spin" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: VIEW DETAILS MODAL */}
      {viewModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200 max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">Application Details</h3>
              <button 
                onClick={() => setViewModalApp(null)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* General Meta Information Profile */}
            <div className="mt-4 grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl text-sm border border-slate-100">
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Full Name</span>
                <span className="font-semibold text-slate-900">{viewModalApp.firstName} {viewModalApp.lastName}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Applied Role</span>
                <span className="font-semibold text-slate-900">{viewModalApp.roleTitle}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Email Address</span>
                <span className="text-slate-700">{viewModalApp.email}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Phone Number</span>
                <span className="text-slate-700">{viewModalApp.phone}</span>
              </div>
            </div>

            {/* Current Status Badge Banner */}
            <div className="mt-5 flex items-center justify-between rounded-2xl border border-slate-200 p-4">
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Current Status</span>
                <span className={`text-sm font-bold uppercase tracking-wide capitalize px-3 py-1 rounded-full inline-block mt-1 ${getStatusBadgeClass(viewModalApp.status || "reviewed")}`}>
                  {viewModalApp.status || "reviewed"}
                </span>
              </div>
              <div className="text-right">
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Last Updated Date</span>
                <span className="text-sm font-medium text-slate-700 mt-1 block">
                  {formatDate(viewModalApp.statusUpdatedAt)}
                </span>
              </div>
            </div>


            {/* Status History Timeline Audit Trail */}
            <div className="mt-6">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">Status History </h4>
              
              {(!viewModalApp.statusHistory || viewModalApp.statusHistory.length === 0) ? (
                <div className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-dashed">
                  No historical logs found. (This applicant was marked as reviewed using legacy records).
                </div>
              ) : (
                <div className="relative border-l border-slate-200 pl-4 ml-2 space-y-4">
                  {viewModalApp.statusHistory.map((historyItem, idx) => (
                    <div key={idx} className="relative">
                      {/* Timeline dot */}
                      <span className="absolute -left-[21px] top-1 bg-white border-2 border-[#00aeef] h-3 w-3 rounded-full" />
                      <div className="flex justify-between items-start text-sm">
                        <div>
                          <span className="font-semibold text-slate-800 capitalize">
                            {historyItem.status}
                          </span>
                          {historyItem.updatedBy && (
                            <span className="text-xs text-slate-500 block mt-0.5">
                              by {historyItem.updatedBy}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400">
                          {formatDate(historyItem.updatedAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
           <div className="mt-6 border-t border-slate-100 pt-4 text-right">
              <button
                onClick={() => setViewModalApp(null)}
                className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Close View Window
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
