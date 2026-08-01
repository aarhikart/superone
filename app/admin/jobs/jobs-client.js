"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { confirmAndDelete } from "../delete-helper";

const initialSection = { title: "", description: "" };
const initialForm = {
  title: "",
  address: "",
  jobType: "Full Time",
  requirementsCount: "",
  experienceYears: "",
  salary: "",
  qualification: "",
  ctc: "",
};

const statusColors = {
  "Draft": "bg-slate-100 text-slate-700 border-slate-200",
  "Pending Review": "bg-amber-100 text-amber-700 border-amber-200",
  "Changes Requested": "bg-orange-100 text-orange-700 border-orange-200",
  "Approved": "bg-green-100 text-green-700 border-green-200",
  "Rejected": "bg-red-100 text-red-700 border-red-200",
  "Published": "bg-blue-100 text-blue-700 border-blue-200"
};

export default function JobsClient({ currentUser }) {
  const [form, setForm] = useState(initialForm);
  const [sections, setSections] = useState([{ ...initialSection }]);
  const [image, setImage] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [editId, setEditId] = useState(null);
  const [existingImage, setExistingImage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef(null);

  // Workflow states
  const [reviewers, setReviewers] = useState([]);
  const [selectedReviewerId, setSelectedReviewerId] = useState("");
  const [activeTab, setActiveTab] = useState("all_jobs");
  const [statusToSubmit, setStatusToSubmit] = useState("Draft");

  async function loadJobs() {
    const res = await fetch("/api/jobs", { cache: "no-store" });
    const data = await res.json();
    setJobs(data);
  }

  async function loadReviewers() {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        // Exclude current user and marketing roles from reviewer list
        const list = (data.users || []).filter(
          (u) => u.id !== currentUser?.id && u.role !== "Marketing"
        );
        setReviewers(list);
      }
    } catch (err) {
      console.error("Error loading reviewers:", err);
    }
  }

  useEffect(() => {
    async function init() {
      await Promise.all([loadJobs(), loadReviewers()]);
    }
    init();
  }, [currentUser]);

  function resetForm() {
    setForm(initialForm);
    setSections([{ ...initialSection }]);
    setImage(null);
    setEditId(null);
    setExistingImage("");
    setSelectedReviewerId("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleSectionChange(index, field, value) {
    setSections((current) =>
      current.map((section, sectionIndex) =>
        sectionIndex === index ? { ...section, [field]: value } : section
      )
    );
  }

  function addSection() {
    setSections((current) => [...current, { ...initialSection }]);
  }

  function removeSection(index) {
    setSections((current) => {
      if (current.length === 1) {
        return [{ ...initialSection }];
      }
      return current.filter((_, sectionIndex) => sectionIndex !== index);
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    if (statusToSubmit === "Pending Review" && !selectedReviewerId) {
      setError("Please select a reviewer before submitting for review.");
      setIsSubmitting(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("address", form.address);
      formData.append("jobType", form.jobType);
      formData.append("requirementsCount", form.requirementsCount);
      formData.append("experienceYears", form.experienceYears);
      formData.append("salary", form.salary);
      formData.append("qualification", form.qualification);
      formData.append("ctc", form.ctc);
      formData.append("sections", JSON.stringify(sections));
      formData.append("status", statusToSubmit);
      if (selectedReviewerId) {
        formData.append("reviewerId", selectedReviewerId);
      }

      if (image) {
        formData.append("image", image);
      }

      const endpoint = editId ? `/api/jobs/${editId}` : "/api/jobs";
      const method = editId ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Unable to save job.");
      }

      await loadJobs();
      resetForm();
      setSuccess(
        editId
          ? statusToSubmit === "Pending Review"
            ? "Job submitted for review successfully."
            : statusToSubmit === "Approved"
            ? "Job posted directly successfully."
            : "Job updated draft successfully."
          : statusToSubmit === "Pending Review"
          ? "Job created and submitted for review."
          : statusToSubmit === "Approved"
          ? "Job posted directly successfully."
          : "Job draft created successfully."
      );
    } catch (submitError) {
      setError(submitError.message || "Unable to save job.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleEdit(job) {
    setForm({
      title: job.title || "",
      address: job.address || "",
      jobType: job.jobType || "Full Time",
      requirementsCount: job.requirementsCount || "",
      experienceYears: job.experienceYears || "",
      salary: job.salary || "",
      qualification: job.qualification || "",
      ctc: job.ctc || "",
    });
    setSections(job.sections?.length ? job.sections : [{ ...initialSection }]);
    setEditId(job._id);
    setExistingImage(job.image || "");
    setSelectedReviewerId(job.reviewerId || "");
    setImage(null);
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id) {
    setError("");
    setSuccess("");

    const result = await confirmAndDelete({
      title: "Delete Job?",
      text: "Are you sure you want to delete this job? This action cannot be undone.",
      successText: "Job deleted successfully.",
      defaultErrorText: "Unable to delete job.",
      deleteFn: async () => {
        return await fetch(`/api/jobs/${id}`, {
          method: "DELETE",
        });
      }
    });

    if (result && result.success) {
      if (editId === id) {
        resetForm();
      }
      await loadJobs();
      setSuccess("Job deleted successfully.");
    } else if (result) {
      setError(result.error || "Unable to delete job.");
    }
  }

  const allPostingsCount = jobs.length;

  const myPostingsCount = jobs.filter(
    (job) => String(job.creatorId) === String(currentUser?.id) || !job.creatorId
  ).length;

  const assignedReviewsCount = jobs.filter(
    (job) => String(job.reviewerId) === String(currentUser?.id)
  ).length;

  const filteredJobs = jobs.filter((job) => {
    if (activeTab === "all_jobs") {
      return true;
    } else if (activeTab === "assigned_reviews") {
      return String(job.reviewerId) === String(currentUser?.id);
    } else { // activeTab === "my_jobs"
      return String(job.creatorId) === String(currentUser?.id) || !job.creatorId;
    }
  });

  const getStatusBadge = (status) => {
    const displayStatus = status || "Published";
    const colorClass = statusColors[displayStatus] || "bg-slate-100 text-slate-700 border-slate-200";
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${colorClass}`}>
        {displayStatus}
      </span>
    );
  };

  return (
    <div className="grid gap-8">
      <div className="rounded-[2rem] bg-[linear-gradient(120deg,#0f172a_0%,#1d4ed8_45%,#38bdf8_100%)] px-6 py-8 text-white shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-sky-200">
          Hiring Operations
        </p>
        <h1 className="mt-3 text-3xl font-bold sm:text-5xl">Jobs Management</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-sky-100 sm:text-base">
          Create drafts, assign reviewers, send positions for approval, and manage their workflow progression.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("all_jobs")}
          className={`px-6 py-3 text-sm font-semibold transition border-b-2 -mb-px flex items-center gap-2 ${
            activeTab === "all_jobs"
              ? "border-sky-500 text-sky-600 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <span>All Job Postings</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
            {allPostingsCount}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("my_jobs")}
          className={`px-6 py-3 text-sm font-semibold transition border-b-2 -mb-px flex items-center gap-2 ${
            activeTab === "my_jobs"
              ? "border-sky-500 text-sky-600 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <span>My Job Postings</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
            {myPostingsCount}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("assigned_reviews")}
          className={`px-6 py-3 text-sm font-semibold transition border-b-2 -mb-px flex items-center gap-2 ${
            activeTab === "assigned_reviews"
              ? "border-sky-500 text-sky-600 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <span>Assigned Reviews</span>
          {assignedReviewsCount > 0 && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 animate-pulse">
              {assignedReviewsCount}
            </span>
          )}
        </button>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.4fr_0.8fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">{editId ? "Edit Job" : "Create Job"}</h2>
              <p className="mt-1 text-sm text-slate-500">
                Build a complete role profile with review workflow integration.
              </p>
            </div>
            {editId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
              >
                Cancel Edit
              </button>
            ) : null}
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {[
              ["title", "Job Title"],
              ["address", "Address"],
              ["requirementsCount", "Requirements Count"],
              ["experienceYears", "Experience Years"],
              ["salary", "Salary"],
              ["qualification", "Qualification"],
              ["ctc", "CTC"],
            ].map(([name, label]) => (
              <label key={name} className="grid gap-2">
                <span className="text-sm font-medium">{label}</span>
                <input
                  type="text"
                  name={name}
                  value={form[name]}
                  onChange={handleChange}
                  required={name === "title"}
                  className="rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-sky-500"
                />
              </label>
            ))}

            <label className="grid gap-2">
              <span className="text-sm font-medium">Job Type</span>
              <select
                name="jobType"
                value={form.jobType}
                onChange={handleChange}
                className="rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-sky-500"
              >
                <option>Full Time</option>
                <option>Part Time</option>
              </select>
            </label>

            {/* Reviewer Selection */}
            <label className="grid gap-2 md:col-span-2">
              <span className="text-sm font-medium">Assigned Reviewer</span>
              <select
                value={selectedReviewerId}
                onChange={(e) => setSelectedReviewerId(e.target.value)}
                className="rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-sky-500 bg-white"
              >
                <option value="">-- Select Reviewer (HR or Admin) --</option>
                {reviewers.map((rev) => (
                  <option key={rev.id} value={rev.id}>
                    {rev.username} ({rev.role})
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="mt-5 grid gap-2">
            <span className="text-sm font-medium">Image Upload</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0] || null;
                if (file) {
                  if (!file.type.startsWith("image/")) {
                    setError("Only image files are allowed.");
                    setImage(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                    return;
                  }
                  if (file.size > 5 * 1024 * 1024) {
                    setError("Image size must be less than 5 MB.");
                    setImage(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                    return;
                  }
                }
                setError("");
                setImage(file);
              }}
              className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm"
            />
          </label>

          {existingImage ? (
            <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-3">
              <p className="mb-2 text-sm text-slate-500">Current image</p>
              <img
                src={existingImage}
                alt={form.title || "Current job"}
                className="h-48 w-full rounded-[1.5rem] object-cover"
              />
            </div>
          ) : null}

          <div className="mt-8 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold">Dynamic Sections</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Add multiple description blocks like responsibilities, requirements, and benefits.
                </p>
              </div>
              <button
                type="button"
                onClick={addSection}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-500 text-2xl font-light text-white transition hover:bg-slate-900"
                aria-label="Add section"
              >
                +
              </button>
            </div>

            <div className="mt-5 grid gap-4">
              {sections.map((section, index) => (
                <div
                  key={index}
                  className="rounded-[1.5rem] bg-white p-4 ring-1 ring-slate-200"
                >
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-500">
                      Section {index + 1}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeSection(index)}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-xl text-red-600 transition hover:bg-red-500 hover:text-white"
                      aria-label={`Remove section ${index + 1}`}
                    >
                      -
                    </button>
                  </div>

                  <div className="mt-4 grid gap-4">
                    <label className="grid gap-2">
                      <span className="text-sm font-medium">Section Title</span>
                      <input
                        type="text"
                        value={section.title}
                        onChange={(event) =>
                          handleSectionChange(index, "title", event.target.value)
                        }
                        className="rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-sky-500"
                      />
                    </label>

                    <label className="grid gap-2">
                      <span className="text-sm font-medium">Section Description</span>
                      <textarea
                        value={section.description}
                        onChange={(event) =>
                          handleSectionChange(index, "description", event.target.value)
                        }
                        rows="5"
                        className="rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-sky-500"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error ? (
            <p className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          ) : null}

          {success ? (
            <p className="mt-5 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-700">
              {success}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-4">
            <button
              type="submit"
              onClick={() => setStatusToSubmit("Draft")}
              disabled={isSubmitting}
              className="rounded-2xl bg-slate-700 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isSubmitting && statusToSubmit === "Draft" ? "Saving..." : editId ? "Update Draft" : "Save as Draft"}
            </button>
            <button
              type="submit"
              onClick={() => setStatusToSubmit("Pending Review")}
              disabled={isSubmitting}
              className="rounded-2xl bg-sky-500 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isSubmitting && statusToSubmit === "Pending Review" ? "Submitting..." : editId ? "Submit for Review" : "Send for Review"}
            </button>
            <button
              type="submit"
              onClick={() => setStatusToSubmit("Approved")}
              disabled={isSubmitting}
              className="rounded-2xl bg-green-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isSubmitting && statusToSubmit === "Approved" ? "Posting..." : editId ? "Direct Post Update" : "Direct Post Job"}
            </button>
          </div>
        </form>

        <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-2xl font-bold">Quick Stats</h2>
          <div className="mt-6 grid gap-4">
            <div className="rounded-[1.75rem] bg-slate-900 p-5 text-white">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-300">Jobs in Current Tab</p>
              <p className="mt-3 text-4xl font-bold">{filteredJobs.length}</p>
            </div>
            <div className="rounded-[1.75rem] bg-sky-100 p-5">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Operation Mode</p>
              <p className="mt-3 text-2xl font-bold text-slate-900">
                {editId ? "Editing" : "Creating"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">
              {activeTab === "all_jobs"
                ? "All Job Postings"
                : activeTab === "assigned_reviews"
                ? "Assigned For Review"
                : "My Postings"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {activeTab === "all_jobs"
                ? "All job postings currently in the system."
                : activeTab === "assigned_reviews"
                ? "Jobs that require your approval before publishing."
                : "Your created jobs. Drafts and pending approval appear here."}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredJobs.map((job) => {
            const isDraft = !job.status || job.status === "Draft";
            const isChanges = job.status === "Changes Requested";
            const isApproved = job.status === "Approved";
            const isPublished = job.status === "Published";

            const canEdit = isDraft || isChanges || isApproved || isPublished;
            const canDelete = isDraft || isApproved || isPublished;

            return (
              <article
                key={job._id}
                className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-50 flex flex-col justify-between"
              >
                <div>
                  {job.image ? (
                    <img
                      src={job.image}
                      alt={job.title || "Job image"}
                      className="h-56 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-56 items-center justify-center bg-slate-200 text-slate-500">
                      No image
                    </div>
                  )}
                  <div className="p-5 pb-0">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      {getStatusBadge(job.status)}
                      {job.reviewerName && (
                        <span className="text-xs text-slate-500 italic">
                          Reviewer: {job.reviewerName}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">{job.title || "Untitled Job"}</h3>
                    <p className="mt-2 text-sm text-slate-500">{job.address || "No address added"}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                        {job.jobType || "Job Type"}
                      </span>
                      <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                        {job.experienceYears || "Experience"}
                      </span>
                    </div>
                    <p className="mt-4 text-xs text-slate-500">
                      Created by: {job.creatorName || "legacy user"}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-4">
                  <div className="mt-auto flex flex-wrap gap-2">
                    <Link
                      href={`/admin/jobs/${job._id}`}
                      className="rounded-full bg-sky-100 border border-sky-200 px-4 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-200 flex-1 text-center"
                    >
                      View Details
                    </Link>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handleEdit(job)}
                        className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 flex-1"
                      >
                        Edit
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDelete(job._id)}
                        className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {filteredJobs.length === 0 ? (
          <div className="mt-6 rounded-[1.75rem] border border-dashed border-slate-300 px-6 py-12 text-center text-slate-500">
            No jobs found.
          </div>
        ) : null}
      </section>
    </div>
  );
}
