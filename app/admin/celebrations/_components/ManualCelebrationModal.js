"use client";

import { useState, useEffect } from "react";
import { X, Sparkles, AlertCircle, Loader2 } from "lucide-react";
import Swal from "sweetalert2";

export default function ManualCelebrationModal({
  isOpen,
  onClose,
  onCelebrationCreated,
  employees = [],
}) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [celebrationType, setCelebrationType] = useState("Birthday");
  const [customTitle, setCustomTitle] = useState("");
  const [celebrationDate, setCelebrationDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleEmployeeSelect = (empId) => {
    setSelectedEmployeeId(empId);
    if (!empId) {
      setEmployeeName("");
      setEmployeeEmail("");
      setJobTitle("");
      setDepartment("");
      return;
    }

    const emp = employees.find((e) => (e.id || e._id) === empId);
    if (emp) {
      setEmployeeName(emp.name || `${emp.firstName} ${emp.lastName}`.trim());
      setEmployeeEmail(emp.email);
      setJobTitle(emp.jobTitle || "");
      setDepartment(emp.department || "");
      setCustomTitle(`Happy ${celebrationType}, ${emp.firstName}!`);
    }
  };

  useEffect(() => {
    if (employeeName) {
      const firstName = employeeName.split(" ")[0];
      if (celebrationType === "Birthday") {
        setCustomTitle(`Happy Birthday, ${firstName}! 🎂`);
      } else if (celebrationType === "Work Anniversary") {
        setCustomTitle(`Congratulations on Your Milestone, ${firstName}! 🏆`);
      } else {
        setCustomTitle(`Warmest Wishes on Your Special Milestone, ${firstName}! 💐`);
      }
    }
  }, [celebrationType, employeeName]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!employeeName.trim() || !employeeEmail.trim() || !customTitle.trim() || !celebrationDate) {
      setError("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/celebrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: selectedEmployeeId || null,
          employeeName: employeeName.trim(),
          employeeEmail: employeeEmail.trim(),
          jobTitle: jobTitle.trim(),
          department: department.trim(),
          celebrationType,
          customTitle: customTitle.trim(),
          celebrationDate,
          message: message.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create manual celebration.");
      }

      await Swal.fire({
        icon: "success",
        title: "Celebration Added!",
        text: "The custom celebration has been scheduled.",
        confirmButtonColor: "#4318FF",
        background: "#ffffff",
        color: "#0f172a",
        customClass: {
          popup: "rounded-3xl shadow-2xl border border-slate-100",
        },
      });

      if (onCelebrationCreated) {
        onCelebrationCreated();
      }
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create celebration.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-100 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-[#4318FF]">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Add Manual Celebration
              </h3>
              <p className="text-xs text-slate-500">
                Create a custom milestone or special recognition for an employee.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-medium text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Select Employee */}
          <div>
            <label className="block text-xs font-bold text-slate-700">
              Select Existing Employee (Optional)
            </label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => handleEmployeeSelect(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4318FF]/20"
            >
              <option value="">-- Choose Employee or Fill Manually --</option>
              {employees.map((emp) => (
                <option key={emp.id || emp._id} value={emp.id || emp._id}>
                  {emp.name || `${emp.firstName} ${emp.lastName}`} ({emp.employeeId} - {emp.department})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Employee Name *
              </label>
              <input
                type="text"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                placeholder="e.g. Alex Chen"
                required
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4318FF]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Employee Email *
              </label>
              <input
                type="email"
                value={employeeEmail}
                onChange={(e) => setEmployeeEmail(e.target.value)}
                placeholder="alex@peoplepulse.com"
                required
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4318FF]/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Celebration Type *
              </label>
              <select
                value={celebrationType}
                onChange={(e) => setCelebrationType(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4318FF]/20"
              >
                <option value="Birthday">Birthday</option>
                <option value="Work Anniversary">Work Anniversary</option>
                <option value="Personal Anniversary">Personal Anniversary</option>
                <option value="Custom">Custom Milestone</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Celebration Date *
              </label>
              <input
                type="date"
                value={celebrationDate}
                onChange={(e) => setCelebrationDate(e.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4318FF]/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Celebration Card Title *
            </label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="e.g. Congratulations on 5 Years, Sarah!"
              required
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4318FF]/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Custom Message (Optional)
            </label>
            <textarea
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Special recognition or celebratory note..."
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4318FF]/20"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-full bg-[#4318FF] px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#3713d9] transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Schedule Celebration</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
