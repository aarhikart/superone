"use client";

import { useState } from "react";
import { Trash2, CheckCircle, Loader2, Eye, RefreshCw, X, ChevronLeft, ChevronRight, Calendar, CalendarDays, Layers, Search, XCircle } from "lucide-react"; 
import FilterDropdown from "../_components/FilterDropdown";
import Tooltip from "../_components/Tooltip";
import { confirmAndDelete } from "../delete-helper";

const RECORDS_PER_PAGE = 20;

function getPaginationItems(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3 || currentPage >= totalPages - 2) {
    return [1, 2, 3, "ellipsis", totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, "ellipsis-start", currentPage - 1, currentPage, currentPage + 1, "ellipsis-end", totalPages];
}

export default function AdminPocRequestsTabs({ requests: initialRequests }) {
  const [activeTab, setActiveTab] = useState("new");
  const [requests, setRequests] = useState(initialRequests || []);
  const [isDeleting, setIsDeleting] = useState(null);
  const [isUpdating, setIsUpdating] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Month & Year Filter state (default to all months and all years)
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");

  // Modal control states
  const [statusModalReq, setStatusModalReq] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [viewModalReq, setViewModalReq] = useState(null);

  // Separation engine
  const newRequests = requests.filter(req => req.status === "new");
  const reviewedRequests = requests.filter(req => req.status !== "new");
  const statusOptions = Array.from(new Set(reviewedRequests.map((req) => req.status).filter(Boolean)));

  const periodRequests = reviewedRequests.filter((req) => {
    if (!req.createdAt) return false;
    const date = new Date(req.createdAt);
    const monthMatch = selectedMonth === "all" || date.getMonth() === selectedMonth;
    const yearMatch = selectedYear === "all" || date.getFullYear() === selectedYear;
    return monthMatch && yearMatch;
  });

  const filteredRequests = periodRequests.filter((req) => {
    return statusFilter === "all" || req.status === statusFilter;
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

  const standardStatuses = ["reviewed", "under review", "approved", "rejected"];
  const allDbStatuses = Array.from(new Set([...standardStatuses, ...reviewedRequests.map(req => req.status).filter(Boolean)]));

  const statusDropdownOptions = [
    {
      value: "all",
      label: "All Statuses",
      icon: <Layers size={16} />,
      badge: periodRequests.length,
      badgeColor: "bg-slate-100 text-slate-700 border border-slate-200"
    },
    ...allDbStatuses.map(status => {
      let icon = <Eye size={16} />;
      let badgeColor = "bg-blue-50 text-blue-700 border border-blue-200";
      if (status === "under review") {
        icon = <Search size={16} />;
        badgeColor = "bg-amber-50 text-amber-700 border border-amber-200";
      } else if (status === "approved") {
        icon = <CheckCircle size={16} />;
        badgeColor = "bg-emerald-50 text-emerald-700 border border-emerald-200";
      } else if (status === "rejected") {
        icon = <XCircle size={16} />;
        badgeColor = "bg-rose-50 text-rose-700 border border-rose-200";
      }
      
      const count = periodRequests.filter(req => req.status === status).length;
      
      return {
        value: status,
        label: status.charAt(0).toUpperCase() + status.slice(1),
        icon,
        badge: count,
        badgeColor
      };
    })
  ];

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / RECORDS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedRequests = filteredRequests.slice(
    (safeCurrentPage - 1) * RECORDS_PER_PAGE,
    safeCurrentPage * RECORDS_PER_PAGE
  );
  const paginationItems = getPaginationItems(safeCurrentPage, totalPages);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "approved":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      case "rejected":
        return "bg-rose-50 text-rose-700 border border-rose-200";
      case "under review":
        return "bg-amber-50 text-amber-700 border border-amber-200";
      case "reviewed":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      default:
        return "bg-slate-50 text-slate-700 border border-slate-200";
    }
  };

  const updateLocalReqInState = (id, updatedFields) => {
    setRequests(prev =>
      prev.map(req => (req._id === id ? { ...req, ...updatedFields } : req))
    );
    if (viewModalReq && viewModalReq._id === id) {
      setViewModalReq(prev => ({ ...prev, ...updatedFields }));
    }
  };

  // Quick mark as reviewed from "new" tab
  const handleMoveToReviewed = async (id) => {
    setIsUpdating(id);
    try {
      const res = await fetch(`/api/poc-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "reviewed" }),
      });

      const data = await res.json();

      if (res.ok && data.pocRequest) {
        updateLocalReqInState(id, data.pocRequest);
      } else {
        alert(data.error || "Failed to update status in the database.");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Something went wrong.");
    } finally {
      setIsUpdating(null);
    }
  };

  // Detailed status update save from modal
  const handleSaveStatusUpdate = async () => {
    if (!statusModalReq || !selectedStatus) return;
    
    const id = statusModalReq._id.toString();
    setIsUpdating(id);

    try {
      const res = await fetch(`/api/poc-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: selectedStatus }),
      });

      const data = await res.json();

      if (res.ok && data.pocRequest) {
        updateLocalReqInState(id, data.pocRequest);
        setStatusModalReq(null); 
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
        title: "Delete POC Request?",
        text: "Are you sure you want to delete this POC request? This action cannot be undone.",
        successText: "POC request deleted successfully.",
        defaultErrorText: "Failed to delete request from database.",
        deleteFn: async () => {
          setIsDeleting(id);
          try {
            return await fetch(`/api/poc-requests/${id}`, {
              method: "DELETE",
            });
          } finally {
            setIsDeleting(null);
          }
        }
      });

      if (result && result.success) {
        setRequests(requests.filter((req) => req._id !== id));
      }
    } catch (error) {
      console.error("Error deleting request:", error);
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
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Company</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Industry</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Submitted</th>
              {tabType === "reviewed" && (
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Current Status</th>
              )}
              <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {targetDataset.map((req) => {
              const reqIdString = req._id.toString();
              return (
                <tr key={reqIdString} className="hover:bg-slate-50">
                  <td className="px-6 py-5 text-sm font-semibold text-slate-900">
                    {req.fullName || [req.firstName, req.lastName].filter(Boolean).join(" ")}
                  </td>
                  <td className="px-6 py-5 text-sm text-slate-600">{req.email}</td>
                  <td className="px-6 py-5 text-sm text-slate-600">{req.company || "—"}</td>
                  <td className="px-6 py-5 text-sm text-slate-600">
                    <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                      {req.industry || req.industries?.[0] || "—"}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-sm text-slate-600">{formatDate(req.createdAt)}</td>
                  {tabType === "reviewed" && (
                    <td className="px-6 py-5 text-sm font-medium">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusBadgeClass(req.status)}`}>
                        {req.status}
                      </span>
                    </td>
                  )}
                  <td className="px-6 py-5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Tooltip content="View Details">
                        <button
                          onClick={() => {
                            const freshReq = requests.find(r => r._id.toString() === reqIdString);
                            setViewModalReq(freshReq || req);
                          }}
                          className="text-blue-500 hover:text-blue-700 transition-colors p-2 rounded-full hover:bg-blue-50"
                        >
                          <Eye size={18} />
                        </button>
                      </Tooltip>

                      {tabType === "new" && (
                        <>
                          <Tooltip content="Mark as Reviewed">
                            <button
                              onClick={() => handleMoveToReviewed(reqIdString)}
                              disabled={isUpdating === reqIdString}
                              className="text-emerald-500 hover:text-emerald-700 transition-colors p-2 rounded-full hover:bg-emerald-50 disabled:opacity-50"
                            >
                              {isUpdating === reqIdString ? (
                                <Loader2 size={18} className="animate-spin" />
                              ) : (
                                <CheckCircle size={18} />
                              )}
                            </button>
                          </Tooltip>

                          <Tooltip content="Delete Request">
                            <button
                              onClick={() => handleDelete(reqIdString)}
                              disabled={isDeleting === reqIdString}
                              className="text-red-500 hover:text-red-700 transition-colors p-2 rounded-full hover:bg-red-50 disabled:opacity-50"
                            >
                              <Trash2 size={18} />
                            </button>
                          </Tooltip>
                        </>
                      )}

                      {tabType === "reviewed" && (
                        <>
                          <Tooltip content="Update Status">
                            <button
                              onClick={() => {
                                const freshReq = requests.find(r => r._id.toString() === reqIdString);
                                const currentReq = freshReq || req;
                                setStatusModalReq(currentReq);
                                setSelectedStatus(currentReq.status || "");
                              }}
                              disabled={isUpdating === reqIdString}
                              className="text-amber-500 hover:text-amber-700 transition-colors p-2 rounded-full hover:bg-amber-50 disabled:opacity-50"
                            >
                              {isUpdating === reqIdString ? (
                                <Loader2 size={18} className="animate-spin" />
                              ) : (
                                <RefreshCw size={18} />
                              )}
                            </button>
                          </Tooltip>
                          
                          <Tooltip content="Delete Request">
                            <button
                              onClick={() => handleDelete(reqIdString)}
                              disabled={isDeleting === reqIdString}
                              className="text-red-500 hover:text-red-700 transition-colors p-2 rounded-full hover:bg-red-50 disabled:opacity-50"
                            >
                              <Trash2 size={18} />
                            </button>
                          </Tooltip>
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
          No POC requests found in this tab.
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
            New Requests ({newRequests.length})
          </button>
          <button
            onClick={() => setActiveTab("reviewed")}
            className={`rounded-full px-6 py-2.5 text-sm font-semibold transition-all ${
              activeTab === "reviewed"
                ? "bg-white text-[#00aeef] shadow-md"
                : "text-white hover:text-sky-100"
            }`}
          >
            Reviewed Requests ({reviewedRequests.length})
          </button>
        </div>
      </div>

      <div className="mt-6">
        {activeTab === "new" && renderTable(newRequests, "new")}
        {activeTab === "reviewed" && (
          <>
            <div className="mb-4 flex flex-col gap-4 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                  Reviewed Requests
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Showing {filteredRequests.length} of {periodRequests.length} reviewed records.
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

            {renderTable(paginatedRequests, "reviewed")}

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

      {/* STATUS UPDATE MODAL */}
      {statusModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">Update Request Status</h3>
              <button 
                onClick={() => setStatusModalReq(null)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <p className="mt-3 text-sm text-slate-500">
              Set status for POC Request from <strong>{statusModalReq.fullName || [statusModalReq.firstName, statusModalReq.lastName].filter(Boolean).join(" ")}</strong>.
            </p>

            <div className="mt-5 space-y-3">
              {["under review", "approved", "rejected"].map((statusOption) => (
                <label 
                  key={statusOption} 
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 cursor-pointer hover:bg-slate-50 transition"
                >
                  <input
                    type="radio"
                    name="requestStatus"
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
                onClick={() => setStatusModalReq(null)}
                className="rounded-full px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStatusUpdate}
                disabled={isUpdating === statusModalReq._id.toString()}
                className="inline-flex items-center gap-2 rounded-full bg-[#00aeef] px-6 py-2 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:opacity-50"
              >
                {isUpdating === statusModalReq._id.toString() && <Loader2 size={16} className="animate-spin" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {viewModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200 max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">POC Request Details</h3>
              <button 
                onClick={() => setViewModalReq(null)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl text-sm border border-slate-100">
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Full Name</span>
                <span className="font-semibold text-slate-900">{viewModalReq.fullName || [viewModalReq.firstName, viewModalReq.lastName].filter(Boolean).join(" ")}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Email Address</span>
                <span className="text-slate-700">{viewModalReq.email}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Company</span>
                <span className="font-semibold text-slate-900">{viewModalReq.company || "—"}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Industry</span>
                <span className="font-semibold text-slate-900">{viewModalReq.industry || viewModalReq.industries?.[0] || "—"}</span>
              </div>
            </div>

            <div className="mt-4 bg-slate-50 p-4 rounded-2xl text-sm border border-slate-100">
              <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Message</span>
              <p className="mt-2 whitespace-pre-wrap text-slate-700 leading-6">{viewModalReq.message || "—"}</p>
            </div>

            <div className="mt-5 flex items-center justify-between rounded-2xl border border-slate-200 p-4">
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Current Status</span>
                <span className={`text-sm font-bold uppercase tracking-wide capitalize px-3 py-1 rounded-full inline-block mt-1 ${getStatusBadgeClass(viewModalReq.status || "reviewed")}`}>
                  {viewModalReq.status || "reviewed"}
                </span>
              </div>
              <div className="text-right">
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Last Updated Date</span>
                <span className="text-sm font-medium text-slate-700 mt-1 block">
                  {formatDate(viewModalReq.statusUpdatedAt)}
                </span>
              </div>
            </div>

            {/* Status History Timeline */}
            <div className="mt-6">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">Status History </h4>
              
              {(!viewModalReq.statusHistory || viewModalReq.statusHistory.length === 0) ? (
                <div className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-dashed">
                  No historical logs found. (This record was marked as reviewed using legacy records).
                </div>
              ) : (
                <div className="relative border-l border-slate-200 pl-4 ml-2 space-y-4">
                  {viewModalReq.statusHistory.map((historyItem, idx) => (
                    <div key={idx} className="relative">
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
                onClick={() => setViewModalReq(null)}
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
