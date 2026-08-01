"use client";

import { useEffect, useState, useRef } from "react";
import { confirmAndDelete } from "../delete-helper";

const initialForm = {
  title: "",
  description: "",
  liveUrl: "",
};

export default function PressReleasesClient() {
  const [form, setForm] = useState(initialForm);
  const [image, setImage] = useState(null);
  const [pressReleases, setPressReleases] = useState([]);
  const [editId, setEditId] = useState(null);
  const [existingImage, setExistingImage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef(null);

  async function loadPressReleases() {
    const res = await fetch("/api/press-releases", { cache: "no-store" });
    const data = await res.json();
    setPressReleases(data);
  }

  useEffect(() => {
    async function fetchPressReleases() {
      await loadPressReleases();
    }

    fetchPressReleases();
  }, []);

  function resetForm() {
    setForm(initialForm);
    setImage(null);
    setEditId(null);
    setExistingImage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("liveUrl", form.liveUrl);

      if (image) {
        formData.append("image", image);
      }

      const endpoint = editId ? `/api/press-releases/${editId}` : "/api/press-releases";
      const method = editId ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Request failed.");
      }

      await loadPressReleases();
      resetForm();
      setSuccess(
        editId
          ? "Press release updated successfully."
          : "Press release created successfully."
      );
    } catch (submitError) {
      setError(submitError.message || "Unable to save press release.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleEdit(pressRelease) {
    setForm({
      title: pressRelease.title || "",
      description: pressRelease.description || "",
      liveUrl: pressRelease.liveUrl || "",
    });
    setEditId(pressRelease._id);
    setExistingImage(pressRelease.image || "");
    setImage(null);
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id) {
    setError("");
    setSuccess("");

    const result = await confirmAndDelete({
      title: "Delete Press Release?",
      text: "Are you sure you want to delete this press release? This action cannot be undone.",
      successText: "Press release deleted successfully.",
      defaultErrorText: "Unable to delete press release.",
      deleteFn: async () => {
        return await fetch(`/api/press-releases/${id}`, {
          method: "DELETE",
        });
      }
    });

    if (result && result.success) {
      if (editId === id) {
        resetForm();
      }
      await loadPressReleases();
      setSuccess("Press release deleted successfully.");
    } else if (result) {
      setError(result.error || "Unable to delete press release.");
    }
  }
 const [activeViewArticle, setActiveViewArticle] = useState(null);
  return (
    <div className="grid gap-8">
      <div className="rounded-3xl bg-gradient-to-r from-sky-500 via-cyan-300 to-emerald-300 px-6 py-8 shadow-lg">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-900/75">
          Brand Communications
        </p>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Press Release Management</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-900/80 sm:text-base">
          Add, edit, and remove press releases while preserving your current MongoDB-backed flow.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">
                {editId ? "Edit Press Release" : "Create Press Release"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Fill the form and save to update the press releases collection.
              </p>
            </div>
            {editId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
              >
                Cancel Edit
              </button>
            ) : null}
          </div>

          <div className="mt-6 grid gap-5">
            <label className="grid gap-2">
              <span className="text-sm font-medium">Press Release Title</span>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Enter press release title"
                className="rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-sky-500"
                required
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium">Press Release Description</span>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Write a short press release description"
                rows="5"
                className="rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-sky-500"
                required
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium">Live Press Release URL</span>
              <input
                type="url"
                name="liveUrl"
                value={form.liveUrl}
                onChange={handleChange}
                placeholder="https://example.com/press-release"
                className="rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-sky-500"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium">
                {editId ? "Replace Image (optional)" : "Upload Image"}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
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
                required={!editId}
              />
            </label>

            {existingImage ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="mb-2 text-sm text-slate-500">Current image</p>
                <img
                  src={existingImage}
                  alt={form.title || "Current press release"}
                  className="h-40 w-full rounded-2xl object-cover"
                />
              </div>
            ) : null}

            {error ? (
              <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
            ) : null}

            {success ? (
              <p className="rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-700">{success}</p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isSubmitting
                ? "Saving..."
                : editId
                  ? "Update Press Release"
                  : "Add Press Release"}
            </button>
          </div>
        </form>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-2xl font-semibold">Quick Stats</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl bg-slate-900 p-5 text-white">
              <p className="text-sm uppercase tracking-[0.3em] text-white/70">
                Total Press Releases
              </p>
              <p className="mt-3 text-4xl font-bold">{pressReleases.length}</p>
            </div>
            <div className="rounded-3xl bg-sky-100 p-5">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Mode</p>
              <p className="mt-3 text-2xl font-bold text-slate-900">
                {editId ? "Editing" : "Creating"}
              </p>
            </div>
          </div>
        </div>
      </div>

    <section className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-stone-200">
  {/* Section Header */}
  <div className="flex items-center justify-between gap-4">
    <div>
      <h2 className="text-2xl font-semibold text-stone-900">Saved Press Releases</h2>
      <p className="mt-1 text-sm text-stone-500">
        Newly created or updated press releases appear here immediately.
      </p>
    </div>
  </div>

  {/* Responsive Row List Layout */}
  <div className="mt-6 flex flex-col gap-4">
    {pressReleases.map((pressRelease) => (
      <article
        key={pressRelease._id}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-lg border border-stone-200 bg-white p-4 shadow-sm transition hover:shadow-md"
      >
        {/* Left Section: Image, Title, and Link */}
        <div className="flex flex-1 flex-col sm:flex-row sm:items-center gap-4 min-w-0">
          {/* Rounded Brand/Article Image */}
          <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl bg-stone-100">
            <img
              src={pressRelease.image}
              alt={pressRelease.title || "Press release image"}
              className="h-full w-full object-cover"
            />
          </div>

          {/* Grid of Text Information */}
          <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2 items-center">
            {/* Title */}
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold text-stone-900">{pressRelease.title}</h3>
            </div>

            {/* Live External Link */}
            {pressRelease.liveUrl ? (
              <div>
                <a
                  href={pressRelease.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-600 transition hover:bg-orange-100"
                >
                  <span>View Live</span>
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            ) : null}
          </div>
        </div>

        {/* Right Section: Short Description Snippet & Action Icons */}
        <div className="flex items-center justify-between lg:justify-end gap-6 border-t border-stone-100 pt-3 lg:border-t-0 lg:pt-0">
          {/* Description Snippet Data */}
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <p className="truncate text-sm font-bold text-slate-900 max-w-[150px]">
              {pressRelease.description}
            </p>
          </div>

          {/* Inline Action Buttons */}
          <div className="flex items-center gap-1">
            {/* View Eye Icon Button */}
            <button
              type="button"
              onClick={() => setActiveViewArticle?.(pressRelease)}
              className="rounded-lg p-2 text-stone-400 hover:bg-stone-50 hover:text-emerald-600 transition"
              aria-label="View press release details"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>

            {/* Edit Icon Button */}
            <button
              type="button"
              onClick={() => handleEdit(pressRelease)}
              className="rounded-lg p-2 text-stone-400 hover:bg-stone-50 hover:text-blue-600 transition"
              aria-label="Edit press release"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>

            {/* Delete Icon Button */}
            <button
              type="button"
              onClick={() => handleDelete(pressRelease._id)}
              className="rounded-lg p-2 text-stone-400 hover:bg-stone-50 hover:text-red-600 transition"
              aria-label="Delete press release"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </article>
    ))}
  </div>

  {/* Empty State UI */}
  {pressReleases.length === 0 && (
    <div className="mt-6 rounded-lg border border-dashed border-stone-300 px-6 py-12 text-center text-stone-500">
      No press releases found yet. Add your first press release from the form above.
    </div>
  )}


   {/* Article Detail View Popup Modal */}
      {activeViewArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg overflow-hidden rounded-lg bg-white shadow-2xl transition-all border border-stone-100">
            {/* Header image / banner wrapper */}
            <div className="relative h-48 w-full bg-stone-100">
              <img 
                src={activeViewArticle.image} 
                alt={activeViewArticle.title} 
                className="h-full w-full object-cover" 
              />
              <button 
                type="button"
                onClick={() => setActiveViewArticle(null)}
                className="absolute top-3 right-3 rounded-full bg-stone-900/50 p-2 text-white hover:bg-stone-900/80 transition"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6">
              <h2 className="text-xl font-extrabold text-stone-900">{activeViewArticle.title}</h2>
              
              <div className="mt-4 border-t border-stone-100 pt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">Description</h4>
                <p className="mt-1 text-sm text-stone-600 leading-relaxed max-h-40 overflow-y-auto pr-1">
                  {activeViewArticle.description}
                </p>
              </div>

              {/* Action Actions inside Modal Footer */}
              <div className="mt-6 flex items-center justify-between border-t border-stone-100 pt-4">
                {activeViewArticle.liveUrl ? (
                  <a
                    href={activeViewArticle.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-orange-500 px-4 py-1.5 text-xs font-semibold text-orange-600 transition hover:bg-orange-50"
                  >
                    <span>Visit Live Page</span>
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                ) : <div />}
                
                <span className="text-[11px] text-stone-400 font-mono">
                  Ref: {activeViewArticle._id.substring(0, 10)}...
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
</section>

    </div>
  );
}