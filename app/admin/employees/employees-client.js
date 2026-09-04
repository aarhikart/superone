"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Users,
  UserPlus,
  Cake,
  Trophy,
  Search,
  Filter,
  Plus,
  Download,
  Pencil,
  Trash2,
  X,
  ChevronDown,
  Loader2,
  AlertCircle,
  Sparkles,
  Heart,
  Upload,
  Camera,
} from "lucide-react";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";

const DEPARTMENTS = [
  "Engineering",
  "Marketing",
  "Design",
  "Sales",
  "HR",
  "Finance",
  "Operations",
  "Customer Support",
  "Product",
];

const EMPLOYMENT_STATUSES = ["Full-time", "Part-time", "Contract", "Intern"];

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

function formatDateForInput(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

function getInitials(firstName = "", lastName = "") {
  const f = firstName.trim().charAt(0).toUpperCase();
  const l = lastName.trim().charAt(0).toUpperCase();
  return `${f}${l}` || "EM";
}

const initialFormData = {
  firstName: "",
  lastName: "",
  employeeId: "",
  email: "",
  phoneNumber: "",
  dateOfBirth: "",
  personalAnniversaryDate: "",
  department: "",
  jobTitle: "",
  dateOfJoining: "",
  employmentStatus: "Full-time",
  sendBirthdayEmail: true,
  sendWorkAnniversaryEmail: true,
  sendPersonalAnniversaryEmail: true,
  avatar: "",
  status: "Active",
};

export default function EmployeesClient({ currentUser }) {
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    growthText: "↑ +12 from last month",
    newThisMonth: 0,
    birthdaysThisMonth: 0,
    workAnniversaries: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [celebrationFilter, setCelebrationFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Drawer / Modal states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (selectedDepartment) params.append("department", selectedDepartment);
      if (selectedStatus) params.append("status", selectedStatus);
      if (celebrationFilter) params.append("celebrationFilter", celebrationFilter);
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      const res = await fetch(`/api/employees?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to load employees.");
      }

      const data = await res.json();
      setEmployees(data.employees || []);
      setTotalCount(data.totalCount || 0);
      setTotalPages(data.totalPages || 1);
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedDepartment, selectedStatus, celebrationFilter, page, limit]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleOpenAddDrawer = () => {
    setIsEditing(false);
    setEditId(null);
    setFormData(initialFormData);
    setAvatarFile(null);
    setAvatarPreview("");
    setFormError("");
    setIsDrawerOpen(true);
  };

  const handleOpenEditDrawer = (emp) => {
    setIsEditing(true);
    setEditId(emp.id || emp._id);
    setFormData({
      firstName: emp.firstName || "",
      lastName: emp.lastName || "",
      employeeId: emp.employeeId || "",
      email: emp.email || "",
      phoneNumber: emp.phoneNumber || "",
      dateOfBirth: formatDateForInput(emp.dateOfBirth),
      personalAnniversaryDate: formatDateForInput(emp.personalAnniversaryDate),
      department: emp.department || "",
      jobTitle: emp.jobTitle || "",
      dateOfJoining: formatDateForInput(emp.dateOfJoining),
      employmentStatus: emp.employmentStatus || "Full-time",
      sendBirthdayEmail: emp.sendBirthdayEmail !== false,
      sendWorkAnniversaryEmail: emp.sendWorkAnniversaryEmail !== false,
      sendPersonalAnniversaryEmail: emp.sendPersonalAnniversaryEmail !== false,
      avatar: emp.avatar || "",
      status: emp.status || "Active",
    });
    setAvatarFile(null);
    setAvatarPreview(emp.avatar || "");
    setFormError("");
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setFormData(initialFormData);
    setAvatarFile(null);
    setAvatarPreview("");
    setFormError("");
    setIsEditing(false);
    setEditId(null);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setFormError("Profile image must be less than 5MB.");
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      setFormError("");
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (
      !formData.firstName.trim() ||
      !formData.lastName.trim() ||
      !formData.employeeId.trim() ||
      !formData.email.trim() ||
      !formData.department.trim() ||
      !formData.jobTitle.trim() ||
      !formData.dateOfJoining
    ) {
      setFormError("Please fill in all required fields marked with *.");
      return;
    }

    setIsSubmitting(true);

    try {
      const url = isEditing ? `/api/employees/${editId}` : `/api/employees`;
      const method = isEditing ? "PUT" : "POST";

      const data = new FormData();
      data.append("firstName", formData.firstName);
      data.append("lastName", formData.lastName);
      data.append("employeeId", formData.employeeId);
      data.append("email", formData.email);
      data.append("phoneNumber", formData.phoneNumber || "");
      data.append("department", formData.department);
      data.append("jobTitle", formData.jobTitle);
      data.append("dateOfJoining", formData.dateOfJoining);
      data.append("employmentStatus", formData.employmentStatus);
      if (formData.dateOfBirth) data.append("dateOfBirth", formData.dateOfBirth);
      if (formData.personalAnniversaryDate)
        data.append("personalAnniversaryDate", formData.personalAnniversaryDate);
      data.append("sendBirthdayEmail", String(formData.sendBirthdayEmail));
      data.append(
        "sendWorkAnniversaryEmail",
        String(formData.sendWorkAnniversaryEmail)
      );
      data.append(
        "sendPersonalAnniversaryEmail",
        String(formData.sendPersonalAnniversaryEmail)
      );
      data.append("status", formData.status);

      if (avatarFile) {
        data.append("avatarFile", avatarFile);
      } else if (formData.avatar) {
        data.append("avatar", formData.avatar);
      }

      const res = await fetch(url, {
        method,
        body: data,
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.error || "Failed to save employee.");
      }

      await Swal.fire({
        icon: "success",
        title: isEditing ? "Employee Updated!" : "Employee Added!",
        text: isEditing
          ? "The employee details and celebration settings have been updated."
          : "New employee has been registered successfully.",
        confirmButtonColor: "#4318FF",
        background: "#ffffff",
        color: "#0f172a",
        customClass: {
          popup: "rounded-3xl shadow-2xl border border-slate-100",
        },
      });

      handleCloseDrawer();
      fetchEmployees();
    } catch (err) {
      setFormError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEmployee = async (emp) => {
    const result = await Swal.fire({
      title: "Delete Employee?",
      text: `Are you sure you want to remove ${emp.name || `${emp.firstName} ${emp.lastName}`} (${emp.employeeId})? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      background: "#ffffff",
      color: "#0f172a",
      customClass: {
        popup: "rounded-3xl shadow-2xl border border-slate-100",
        confirmButton: "px-5 py-2.5 rounded-xl font-medium",
        cancelButton: "px-5 py-2.5 rounded-xl font-medium",
      },
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/employees/${emp.id || emp._id}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to delete employee.");
        }

        await Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Employee record removed successfully.",
          confirmButtonColor: "#4318FF",
          background: "#ffffff",
          color: "#0f172a",
          customClass: {
            popup: "rounded-3xl shadow-2xl border border-slate-100",
          },
        });

        fetchEmployees();
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: err.message || "Could not delete employee.",
          confirmButtonColor: "#4318FF",
        });
      }
    }
  };

  const handleExport = async () => {
    try {
      Swal.fire({
        title: "Exporting...",
        text: "Preparing employee directory data for export",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const res = await fetch("/api/employees?all=true");
      const data = await res.json();
      const exportList = data.employees || employees;

      const excelRows = exportList.map((emp) => ({
        "Employee ID": emp.employeeId,
        "First Name": emp.firstName,
        "Last Name": emp.lastName,
        "Full Name": `${emp.firstName} ${emp.lastName}`.trim(),
        "Work Email": emp.email,
        "Phone Number": emp.phoneNumber || "—",
        Department: emp.department,
        "Job Title": emp.jobTitle,
        "Date of Joining": formatDisplayDate(emp.dateOfJoining),
        "Date of Birth": formatDisplayDate(emp.dateOfBirth),
        "Personal Anniversary": formatDisplayDate(emp.personalAnniversaryDate),
        "Employment Status": emp.employmentStatus,
        Status: emp.status,
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Employees");

      const maxProps = Object.keys(excelRows[0] || {}).map((key) => ({
        wch: Math.max(
          key.length + 4,
          ...excelRows.map((r) => String(r[key] || "").length + 2)
        ),
      }));
      worksheet["!cols"] = maxProps;

      XLSX.writeFile(
        workbook,
        `Employees_Directory_${new Date().toISOString().split("T")[0]}.xlsx`
      );

      Swal.close();
      Swal.fire({
        icon: "success",
        title: "Export Complete!",
        text: "The employee directory has been downloaded as an Excel file.",
        confirmButtonColor: "#4318FF",
        timer: 2000,
        timerProgressBar: true,
      });
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Export Failed",
        text: "Could not export employees data.",
        confirmButtonColor: "#4318FF",
      });
    }
  };

  const handleClearFilters = () => {
    setSearch("");
    setSelectedDepartment("");
    setSelectedStatus("");
    setCelebrationFilter("");
    setPage(1);
  };

  const startEntry = totalCount === 0 ? 0 : (page - 1) * limit + 1;
  const endEntry = Math.min(page * limit, totalCount);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Employees
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage employee information, onboarding details, and important personal milestones.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 active:scale-95"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>Export</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddDrawer}
            className="flex items-center gap-2 rounded-full bg-[#4318FF] px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition hover:bg-[#3713d9] active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Employees */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Employees
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-4xl font-extrabold tracking-tight text-slate-900">
              {stats.totalEmployees || totalCount || 248}
            </p>
            <p className="mt-2 text-xs font-semibold text-emerald-600">
              {stats.growthText || "↑ +12 from last month"}
            </p>
          </div>
        </div>

        {/* Card 2: New This Month */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              New This Month
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
              <UserPlus className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-4xl font-extrabold tracking-tight text-slate-900">
              {stats.newThisMonth || 14}
            </p>
            <p className="mt-2 text-xs text-slate-400 font-medium">
              Recent onboardings
            </p>
          </div>
        </div>

        {/* Card 3: Birthdays This Month */}
        <div className="rounded-2xl border border-pink-100 bg-[#FDE8EE] p-6 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-800">
              Birthdays This Month
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-200/70 text-pink-700">
              <Cake className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-4xl font-extrabold tracking-tight text-slate-900">
              {stats.birthdaysThisMonth || 8}
            </p>
            <p className="mt-2 text-xs font-semibold text-pink-600">
              Upcoming celebrations
            </p>
          </div>
        </div>

        {/* Card 4: Work Anniversaries */}
        <div className="rounded-2xl border border-sky-100 bg-[#E0F2FE] p-6 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-800">
              Work Anniversaries
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-200/70 text-sky-700">
              <Trophy className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-4xl font-extrabold tracking-tight text-slate-900">
              {stats.workAnniversaries || 6}
            </p>
            <p className="mt-2 text-xs font-semibold text-sky-700">
              Milestones reached
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by ID, Name, or Email..."
            className="w-full rounded-xl bg-slate-50/70 pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4318FF]/20 border border-transparent focus:border-[#4318FF]/30 transition"
          />
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Celebrations Filter */}
          <div className="relative">
            <select
              value={celebrationFilter}
              onChange={(e) => {
                setCelebrationFilter(e.target.value);
                setPage(1);
              }}
              className="appearance-none rounded-xl border border-slate-200 bg-white pl-4 pr-9 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#4318FF]/20 cursor-pointer shadow-xs transition"
            >
              <option value="">Celebrations</option>
              <option value="birthdays_this_month">🎂 Birthdays This Month</option>
              <option value="work_anniversaries_this_month">🏆 Work Anniversaries</option>
              <option value="personal_anniversaries_this_month">💐 Personal Milestones</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          </div>

          {/* Department Dropdown */}
          <div className="relative">
            <select
              value={selectedDepartment}
              onChange={(e) => {
                setSelectedDepartment(e.target.value);
                setPage(1);
              }}
              className="appearance-none rounded-xl border border-slate-200 bg-white pl-4 pr-9 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#4318FF]/20 cursor-pointer shadow-xs transition"
            >
              <option value="">Department</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          </div>

          {/* Status Dropdown */}
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="appearance-none rounded-xl border border-slate-200 bg-white pl-4 pr-9 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#4318FF]/20 cursor-pointer shadow-xs transition"
            >
              <option value="">Status</option>
              <option value="Active">Active</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Intern">Intern</option>
              <option value="On Leave">On Leave</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          </div>

          {/* Filter Reset / Toggle Button */}
          <button
            type="button"
            onClick={handleClearFilters}
            className={`flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
              search || selectedDepartment || selectedStatus || celebrationFilter
                ? "border-indigo-300 bg-indigo-50 text-[#4318FF] hover:bg-indigo-100"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
            title="Reset Filters"
          >
            <Filter className="h-4 w-4" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Employees Table Container */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                <th className="py-4 px-6 text-xs font-semibold tracking-wider text-slate-600">
                  Employee
                </th>
                <th className="py-4 px-6 text-xs font-semibold tracking-wider text-slate-600">
                  ID
                </th>
                <th className="py-4 px-6 text-xs font-semibold tracking-wider text-slate-600">
                  Department
                </th>
                <th className="py-4 px-6 text-xs font-semibold tracking-wider text-slate-600">
                  Joining Date
                </th>
                <th className="py-4 px-6 text-right text-xs font-semibold tracking-wider text-slate-600">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#4318FF]" />
                    <p className="mt-3 text-sm text-slate-500">
                      Loading employees...
                    </p>
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                      <Users className="h-7 w-7" />
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-slate-800">
                      No employees found
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {search || selectedDepartment || selectedStatus || celebrationFilter
                        ? "Try adjusting your search filters."
                        : "Click 'Add Employee' to register your first team member."}
                    </p>
                  </td>
                </tr>
              ) : (
                employees.map((emp) => {
                  const empName = `${emp.firstName} ${emp.lastName}`.trim();
                  const initials = getInitials(emp.firstName, emp.lastName);

                  return (
                    <tr
                      key={emp.id || emp._id}
                      className="group transition hover:bg-slate-50/70"
                    >
                      {/* Employee Column */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3.5">
                          {emp.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={emp.avatar}
                              alt={empName}
                              className="h-10 w-10 rounded-full object-cover ring-2 ring-white shadow-xs"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4318FF] text-xs font-bold text-white shadow-xs">
                              {initials}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                              <span>{empName}</span>
                              {emp.isBirthdayThisMonth && (
                                <span
                                  title="Birthday this month!"
                                  className="inline-flex items-center text-pink-500"
                                >
                                  <Cake className="h-3.5 w-3.5" />
                                </span>
                              )}
                              {emp.isAnniversaryThisMonth && (
                                <span
                                  title="Work anniversary this month!"
                                  className="inline-flex items-center text-sky-600"
                                >
                                  <Sparkles className="h-3.5 w-3.5" />
                                </span>
                              )}
                              {emp.isPersonalAnniversaryThisMonth && (
                                <span
                                  title="Personal milestone this month!"
                                  className="inline-flex items-center text-indigo-500"
                                >
                                  <Heart className="h-3.5 w-3.5" />
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 font-normal mt-0.5">
                              {emp.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* ID Column */}
                      <td className="py-4 px-6 text-sm font-medium text-slate-700">
                        {emp.employeeId}
                      </td>

                      {/* Department Column */}
                      <td className="py-4 px-6 text-sm text-slate-700">
                        {emp.department}
                      </td>

                      {/* Joining Date Column */}
                      <td className="py-4 px-6 text-sm text-slate-700">
                        {formatDisplayDate(emp.dateOfJoining)}
                      </td>

                      {/* Actions Column */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditDrawer(emp)}
                            title="Edit Employee"
                            className="rounded-lg p-1.5 text-indigo-600 transition hover:bg-indigo-50 hover:text-indigo-800"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteEmployee(emp)}
                            title="Delete Employee"
                            className="rounded-lg p-1.5 text-rose-500 transition hover:bg-rose-50 hover:text-rose-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer & Pagination */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-slate-100 px-6 py-4">
          <p className="text-xs font-medium text-slate-500">
            Showing {startEntry} to {endEntry} of {totalCount} entries
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Prev
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setPage(pageNum)}
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition ${
                    page === pageNum
                      ? "bg-[#4318FF] text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {pageNum}
                </button>
              )
            )}

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Employee Slide-Over Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300"
            onClick={handleCloseDrawer}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md md:max-w-xl bg-white shadow-2xl flex flex-col justify-between">
              {/* Drawer Header */}
              <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">
                    {isEditing ? "Edit Employee" : "Add New Employee"}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Add employee details to enable onboarding and automated milestone emails
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCloseDrawer}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Drawer Form Body */}
              <form
                id="employee-form"
                onSubmit={handleFormSubmit}
                className="flex-1 overflow-y-auto px-6 py-6 space-y-6"
              >
                {formError && (
                  <div className="flex items-center gap-2 rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-xs font-medium text-rose-700">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Profile Photo Upload Manager */}
                <div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                  <div className="relative">
                    {avatarPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarPreview}
                        alt="Profile preview"
                        className="h-16 w-16 rounded-full object-cover ring-2 ring-indigo-500 shadow-sm"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-[#4318FF]">
                        <Camera className="h-7 w-7" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-800">
                      Employee Photo
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Upload profile picture for celebration cards (Max 5MB)
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        <span>{avatarPreview ? "Change Photo" : "Upload Photo"}</span>
                      </button>
                      {avatarPreview && (
                        <button
                          type="button"
                          onClick={() => {
                            setAvatarFile(null);
                            setAvatarPreview("");
                            setFormData((p) => ({ ...p, avatar: "" }));
                          }}
                          className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 1: Basic Information */}
                <div>
                  <h3 className="text-xs font-bold tracking-wider text-[#4318FF] uppercase">
                    BASIC INFORMATION
                  </h3>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* First Name */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        First Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleFormChange}
                        placeholder="e.g. Sarah"
                        required
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#4318FF] focus:outline-none focus:ring-2 focus:ring-[#4318FF]/20"
                      />
                    </div>

                    {/* Last Name */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Last Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleFormChange}
                        placeholder="e.g. Johnson"
                        required
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#4318FF] focus:outline-none focus:ring-2 focus:ring-[#4318FF]/20"
                      />
                    </div>

                    {/* Employee ID */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Employee ID <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="employeeId"
                        value={formData.employeeId}
                        onChange={handleFormChange}
                        placeholder="EMP-000"
                        required
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm uppercase text-slate-900 placeholder:text-slate-400 focus:border-[#4318FF] focus:outline-none focus:ring-2 focus:ring-[#4318FF]/20"
                      />
                    </div>

                    {/* Work Email */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Work Email <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleFormChange}
                        placeholder="name@peoplepulse.com"
                        required
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#4318FF] focus:outline-none focus:ring-2 focus:ring-[#4318FF]/20"
                      />
                    </div>

                    {/* Phone Number */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleFormChange}
                        placeholder="+1 (555) 000-0000"
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#4318FF] focus:outline-none focus:ring-2 focus:ring-[#4318FF]/20"
                      />
                    </div>

                    {/* Date of Birth */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Date of Birth (Birthday)
                      </label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleFormChange}
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#4318FF] focus:outline-none focus:ring-2 focus:ring-[#4318FF]/20"
                      />
                    </div>

                    {/* Personal Anniversary Date */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Personal Anniversary Date
                      </label>
                      <input
                        type="date"
                        name="personalAnniversaryDate"
                        value={formData.personalAnniversaryDate}
                        onChange={handleFormChange}
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#4318FF] focus:outline-none focus:ring-2 focus:ring-[#4318FF]/20"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Employment Details */}
                <div>
                  <h3 className="text-xs font-bold tracking-wider text-[#4318FF] uppercase">
                    EMPLOYMENT DETAILS
                  </h3>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Department */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Department <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative mt-1.5">
                        <select
                          name="department"
                          value={formData.department}
                          onChange={handleFormChange}
                          required
                          className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 pr-8 py-2.5 text-sm text-slate-900 focus:border-[#4318FF] focus:outline-none focus:ring-2 focus:ring-[#4318FF]/20"
                        >
                          <option value="">Select Department</option>
                          {DEPARTMENTS.map((dept) => (
                            <option key={dept} value={dept}>
                              {dept}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      </div>
                    </div>

                    {/* Job Title */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Job Title <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="jobTitle"
                        value={formData.jobTitle}
                        onChange={handleFormChange}
                        placeholder="e.g. Senior Designer"
                        required
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#4318FF] focus:outline-none focus:ring-2 focus:ring-[#4318FF]/20"
                      />
                    </div>

                    {/* Date of Joining */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Date of Joining / Work Anniversary <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="dateOfJoining"
                        value={formData.dateOfJoining}
                        onChange={handleFormChange}
                        required
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#4318FF] focus:outline-none focus:ring-2 focus:ring-[#4318FF]/20"
                      />
                    </div>

                    {/* Employment Status */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Employment Status <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative mt-1.5">
                        <select
                          name="employmentStatus"
                          value={formData.employmentStatus}
                          onChange={handleFormChange}
                          required
                          className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 pr-8 py-2.5 text-sm text-slate-900 focus:border-[#4318FF] focus:outline-none focus:ring-2 focus:ring-[#4318FF]/20"
                        >
                          {EMPLOYMENT_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Automation Preferences (Matching Image 4) */}
                <div className="border-t border-slate-100 pt-5">
                  <h3 className="text-xs font-bold tracking-wider text-[#4318FF] uppercase">
                    AUTOMATION PREFERENCES
                  </h3>

                  <div className="mt-4 space-y-4">
                    {/* Birthday switch */}
                    <label className="flex items-center justify-between cursor-pointer py-1">
                      <span className="text-sm font-medium text-slate-800">
                        Send Birthday Email
                      </span>
                      <div className="relative inline-flex items-center">
                        <input
                          type="checkbox"
                          name="sendBirthdayEmail"
                          checked={formData.sendBirthdayEmail}
                          onChange={handleFormChange}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4318FF]"></div>
                      </div>
                    </label>

                    {/* Work anniversary switch */}
                    <label className="flex items-center justify-between cursor-pointer py-1">
                      <span className="text-sm font-medium text-slate-800">
                        Send Work Anniversary Email
                      </span>
                      <div className="relative inline-flex items-center">
                        <input
                          type="checkbox"
                          name="sendWorkAnniversaryEmail"
                          checked={formData.sendWorkAnniversaryEmail}
                          onChange={handleFormChange}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4318FF]"></div>
                      </div>
                    </label>

                    {/* Personal anniversary switch */}
                    <label className="flex items-center justify-between cursor-pointer py-1">
                      <span className="text-sm font-medium text-slate-800">
                        Send Personal Anniversary Email
                      </span>
                      <div className="relative inline-flex items-center">
                        <input
                          type="checkbox"
                          name="sendPersonalAnniversaryEmail"
                          checked={formData.sendPersonalAnniversaryEmail}
                          onChange={handleFormChange}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4318FF]"></div>
                      </div>
                    </label>
                  </div>
                </div>
              </form>

              {/* Drawer Footer */}
              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
                <button
                  type="button"
                  onClick={handleCloseDrawer}
                  disabled={isSubmitting}
                  className="rounded-full border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  form="employee-form"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 rounded-full bg-[#4318FF] px-7 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition hover:bg-[#3713d9] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{isEditing ? "Update Employee" : "Save Employee"}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
