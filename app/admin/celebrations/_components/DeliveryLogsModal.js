"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X,
  Search,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Mail,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Swal from "sweetalert2";

function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return `${d.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  })} at ${d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export default function DeliveryLogsModal({ isOpen, onClose }) {
  const [logs, setLogs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);
      params.append("page", page.toString());
      params.append("limit", "10");

      const res = await fetch(`/api/celebrations/logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotalCount(data.totalCount || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen, fetchLogs]);

  const handleRetrySend = async (log) => {
    setRetryingId(log._id);
    try {
      const res = await fetch("/api/celebrations/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logId: log._id }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Retry failed.");
      }

      await Swal.fire({
        icon: "success",
        title: "Retry Dispatched!",
        text: "The celebration email has been re-sent.",
        confirmButtonColor: "#4318FF",
        background: "#ffffff",
        color: "#0f172a",
        customClass: {
          popup: "rounded-3xl shadow-2xl border border-slate-100",
        },
      });

      fetchLogs();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Retry Failed",
        text: err.message || "Failed to resend email.",
        confirmButtonColor: "#4318FF",
      });
    } finally {
      setRetryingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="relative w-full max-w-5xl rounded-3xl bg-white shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-8 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900">
                Automated Celebration Delivery Logs
              </h2>
              <span className="rounded-full bg-slate-100 px-3 py-0.5 text-xs font-bold text-slate-700">
                {totalCount} Total Dispatches
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Audit log of automated milestone emails sent to employees and groups.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search recipient or subject..."
                className="w-48 sm:w-56 rounded-full bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4318FF]/20 border border-slate-200"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="SENT">SENT (Success)</option>
              <option value="FAILED">FAILED (Error)</option>
            </select>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Table Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="py-20 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#4318FF]" />
              <p className="mt-3 text-xs text-slate-500">Loading delivery logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-20 text-center">
              <Mail className="mx-auto h-10 w-10 text-slate-300" />
              <h3 className="mt-3 text-sm font-bold text-slate-800">
                No delivery records found
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Automated email records will be displayed here as celebrations trigger.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 font-semibold text-slate-600">
                    <th className="py-3 px-4">Employee (To)</th>
                    <th className="py-3 px-4">CC Recipients</th>
                    <th className="py-3 px-4">Celebration</th>
                    <th className="py-3 px-4">Dispatched At</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log) => {
                    const isSent = log.status === "SENT";
                    const toEmail = log.to?.[0] || log.employeeEmail;
                    const ccEmails = Array.isArray(log.cc) ? log.cc : [];
                    return (
                      <tr key={log._id} className="hover:bg-slate-50/50">
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900">
                            {log.employeeName}
                          </p>
                          <div className="mt-1 flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-[#4318FF] bg-indigo-50 px-1.5 py-0.5 rounded-sm">
                              TO
                            </span>
                            <span className="text-[11px] text-slate-600 font-mono">
                              {toEmail}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 max-w-[200px]">
                          {ccEmails.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {ccEmails.map((email) => (
                                <span
                                  key={email}
                                  className="inline-block bg-slate-100 text-slate-700 font-mono px-2 py-0.5 rounded text-[10px] truncate max-w-[180px]"
                                  title={email}
                                >
                                  {email}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">None</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-800">
                            {log.celebrationType}
                          </span>
                          <p className="text-[11px] text-slate-400 truncate max-w-xs">
                            {log.subject}
                          </p>
                        </td>

                        <td className="py-3.5 px-4 text-slate-600">
                          {formatDateTime(log.sentAt || log.createdAt)}
                        </td>

                        <td className="py-3.5 px-4">
                          {isSent ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>SENT</span>
                            </span>
                          ) : (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-bold text-rose-700">
                                <AlertCircle className="h-3 w-3" />
                                <span>FAILED</span>
                              </span>
                              {log.errorMessage && (
                                <p className="text-[10px] text-rose-600 max-w-xs truncate" title={log.errorMessage}>
                                  {log.errorMessage}
                                </p>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleRetrySend(log)}
                            disabled={retryingId === log._id}
                            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-bold transition shadow-xs ${
                              isSent
                                ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                            } disabled:opacity-50`}
                          >
                            <RotateCw
                              className={`h-3 w-3 ${
                                retryingId === log._id ? "animate-spin" : ""
                              }`}
                            />
                            <span>{isSent ? "Resend" : "Retry"}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer & Pagination */}
        <div className="px-8 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 text-xs">
          <p className="text-slate-500 font-medium">
            Page {page} of {totalPages} ({totalCount} logs)
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
