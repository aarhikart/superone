"use client";

import { useEffect, useState } from "react";
import { confirmAndDelete } from "../delete-helper";

export default function BlogsClient() {
  const [title, setTitle] = useState("");
  const [subTitle, setSubTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [image, setImage] = useState(null);
  const [editId, setEditId] = useState(null);
  const [existingImage, setExistingImage] = useState("");
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function fetchPosts() {
    const res = await fetch("/api/posts", { cache: "no-store" });
    const data = await res.json();
    setPosts(data);
  }

  useEffect(() => {
    async function loadInitialPosts() {
      await fetchPosts();
    }

    loadInitialPosts();
  }, []);

  function resetForm() {
    setTitle("");
    setSubTitle("");
    setDescription("");
    setDate("");
    setImage(null);
    setEditId(null);
    setExistingImage("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      if (editId) {
        const formData = new FormData();
        formData.append("id", editId);
        formData.append("title", title);
        formData.append("subTitle", subTitle);
        formData.append("description", description);
        formData.append("date", date);

        if (image) {
          formData.append("image", image);
        }

        const response = await fetch("/api/posts", {
          method: "PUT",
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Unable to update blog.");
        }

        setSuccess("Blog updated successfully.");
      } else {
        const formData = new FormData();
        formData.append("title", title);
        formData.append("subTitle", subTitle);
        formData.append("description", description);
        formData.append("date", date);
        formData.append("image", image);

        const response = await fetch("/api/posts", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Unable to create blog.");
        }

        setSuccess("Blog created successfully.");
      }

      resetForm();
      await fetchPosts();
    } catch (submitError) {
      setError(submitError.message || "Unable to save blog.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id) {
    setError("");
    setSuccess("");

    const result = await confirmAndDelete({
      title: "Delete Blog?",
      text: "Are you sure you want to delete this blog? This action cannot be undone.",
      successText: "Blog deleted successfully.",
      defaultErrorText: "Unable to delete blog.",
      deleteFn: async () => {
        return await fetch("/api/posts", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id }),
        });
      }
    });

    if (result && result.success) {
      await fetchPosts();
      setSuccess("Blog deleted successfully.");
    } else if (result) {
      setError(result.error || "Unable to delete blog.");
    }
  }

  function handleEdit(post) {
    setTitle(post.title || "");
    setSubTitle(post.subTitle || "");
    setDescription(post.description || "");
    setDate(post.date || "");
    setEditId(post._id);
    setExistingImage(post.image || "");
    setImage(null);
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="grid gap-8">
      <div className="rounded-[2rem] bg-[linear-gradient(120deg,#111827_0%,#0f766e_42%,#5eead4_100%)] px-6 py-8 text-white shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-100/80">
          Editorial Publishing
        </p>
        <h1 className="mt-3 text-3xl font-bold sm:text-5xl">Blogs Management</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-emerald-50 sm:text-base">
          Manage blog posts through the existing post API while operating from the new dashboard
          shell.
        </p>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">{editId ? "Edit Blog" : "Create Blog"}</h2>
              <p className="mt-1 text-sm text-slate-500">
                Publish new posts or edit existing ones without changing the current CRUD behavior.
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
            <label className="grid gap-2">
              <span className="text-sm font-medium">Title</span>
              <input
                className="rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500"
                placeholder="Blog title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium">Sub Title</span>
              <input
                className="rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500"
                placeholder="Blog sub title"
                value={subTitle}
                onChange={(e) => setSubTitle(e.target.value)}
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium">Publish Date</span>
              <input
                type="date"
                className="rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </label>

            <label className="grid min-w-0 gap-2 md:col-span-2">
              <span className="text-sm font-medium">
                {editId ? "Replace Image (optional)" : "Feature Image"}
              </span>
              <input
                type="file"
                className="block w-full min-w-0 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
                required={!editId}
              />
            </label>

            <label className="md:col-span-2 grid gap-2">
              <span className="text-sm font-medium">Description</span>
              <textarea
                className="rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500"
                placeholder="Blog description"
                rows="5"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </label>

            {existingImage ? (
              <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="mb-2 text-sm text-slate-500">Current image</p>
                <img
                  src={existingImage}
                  alt={title || "Current blog"}
                  className="h-40 w-full rounded-2xl object-cover"
                />
              </div>
            ) : null}
          </div>

          {error ? (
            <p className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          ) : null}

          {success ? (
            <p className="mt-5 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-700">
              {success}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSubmitting ? "Saving..." : editId ? "Update Blog" : "Add Blog"}
          </button>
        </form>

        <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-2xl font-bold">Quick Stats</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-[1.75rem] bg-slate-900 p-5 text-white">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-300">Total Blogs</p>
              <p className="mt-3 text-4xl font-bold">{posts.length}</p>
            </div>
            <div className="rounded-[1.75rem] bg-emerald-100 p-5">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Mode</p>
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
            <h2 className="text-2xl font-bold">Saved Blogs</h2>
            <p className="mt-1 text-sm text-slate-500">
              Existing and newly created posts appear here instantly.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {posts.map((post) => (
            <article
              key={post._id}
              className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-50"
            >
              <img
                src={post.image}
                alt={post.title || "Post image"}
                className="h-56 w-full object-cover"
              />
              <div className="p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">
                  {post.date}
                </p>
                <h3 className="mt-3 text-xl font-bold text-slate-950">{post.title}</h3>
                <p className="mt-2 text-sm font-medium text-slate-500">{post.subTitle}</p>
                <p className="mt-4 line-clamp-4 text-sm leading-6 text-slate-600">
                  {post.description}
                </p>
                <div className="mt-5 flex gap-3">
                  <button
                    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                    onClick={() => handleEdit(post)}
                  >
                    Edit
                  </button>

                  <button
                    className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
                    onClick={() => handleDelete(post._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
