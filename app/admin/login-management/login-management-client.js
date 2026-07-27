"use client";

import { useState } from "react";

const emptyForm = {
  username: "",
  password: "",
  role: "Admin",
  email: "",
};

export default function LoginManagementClient({ initialUsers, currentUserId }) {
  const [users, setUsers] = useState(initialUsers);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const isEditing = Boolean(editingId);
      const response = await fetch(
        isEditing ? `/api/admin/users/${editingId}` : "/api/admin/users",
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to save user.");
      }

      if (isEditing) {
        setUsers((current) =>
          current.map((user) => (user.id === editingId ? data.user : user))
        );
        setSuccess("Login access updated successfully.");
      } else {
        setUsers((current) => [data.user, ...current]);
        setSuccess("Login access created successfully.");
      }

      resetForm();
    } catch (submitError) {
      setError(submitError.message || "Unable to save user.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleEdit(user) {
    setEditingId(user.id);
    setForm({
      username: user.username,
      password: "",
      role: user.role,
      email: user.email || "",
    });
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id) {
    setError("");
    setSuccess("");

    const response = await fetch(`/api/admin/users/${id}`, {
      method: "DELETE",
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "Unable to delete user.");
      return;
    }

    setUsers((current) => current.filter((user) => user.id !== id));

    if (editingId === id) {
      resetForm();
    }

    setSuccess("Login access removed successfully.");
  }

  return (
    <div className="grid gap-8">
      <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-700">
              Admin Only
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-950">Login Management</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Create and control admin dashboard access without changing the existing CRUD
              structure.
            </p>
          </div>
          <div className="rounded-3xl bg-slate-950 px-5 py-4 text-white">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-300">Total Users</p>
            <p className="mt-2 text-3xl font-semibold">{users.length}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-5 lg:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Username</span>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-cyan-500"
              required
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">
              Password {editingId ? "(leave blank to keep current)" : ""}
            </span>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-cyan-500"
              required={!editingId}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Email ID</span>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="admin@company.com"
              className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-cyan-500"
              required
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Role</span>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-cyan-500"
            >
              <option value="Admin">Admin</option>
              <option value="HR">HR</option>
              <option value="Marketing">Marketing</option>
            </select>
          </label>

          <div className="flex items-end gap-3 lg:col-span-2 lg:justify-end mt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full lg:w-auto rounded-2xl bg-slate-950 px-8 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isSubmitting
                ? "Saving..."
                : editingId
                  ? "Update Access"
                  : "Create Access"}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>

        {error ? (
          <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {success ? (
          <p className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </p>
        ) : null}
      </section>

      <section className="overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-200">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-2xl font-semibold text-slate-950">Login Access List</h2>
          <p className="mt-1 text-sm text-slate-500">
            Admin users can edit roles, rotate passwords, and remove unused access.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                {["Username", "Email ID", "Role", "Status", "Actions"].map((header) => (
                  <th
                    key={header}
                    className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.25em] text-slate-500"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-6 py-5 text-sm font-semibold text-slate-900">{user.username}</td>
                  <td className="px-6 py-5 text-sm text-slate-600 font-medium">{user.email || "—"}</td>
                  <td className="px-6 py-5 text-sm text-slate-600">{user.role}</td>
                  <td className="px-6 py-5 text-sm text-slate-600">
                    {user.id === currentUserId ? "Current session" : "Active"}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => handleEdit(user)}
                        className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(user.id)}
                        className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
