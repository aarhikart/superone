"use client";

import { useState, useTransition } from "react";

const initialState = {
  username: "",
  password: "",
};

export default function LoginForm() {
  const [form, setForm] = useState(initialState);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  // Forgot password modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState("email"); // email | otp | reset
  const [modalEmail, setModalEmail] = useState("");
  const [modalOtp, setModalOtp] = useState("");
  const [modalPassword, setModalPassword] = useState("");
  const [modalConfirmPassword, setModalConfirmPassword] = useState("");
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");
  const [isModalSubmitting, setIsModalSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "Unable to log in.");
      return;
    }

    startTransition(() => {
      window.location.replace("/admin");
    });
  }

  function openModal() {
    setIsModalOpen(true);
    setModalStep("email");
    setModalEmail("");
    setModalOtp("");
    setModalPassword("");
    setModalConfirmPassword("");
    setModalError("");
    setModalSuccess("");
    setIsModalSubmitting(false);
  }

  function closeModal() {
    setIsModalOpen(false);
  }

  async function handleSendOtp(e) {
    e.preventDefault();
    setModalError("");
    setModalSuccess("");
    setIsModalSubmitting(true);

    try {
      const response = await fetch("/api/admin/forgot-password/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: modalEmail }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to send OTP.");
      }
      setModalSuccess("OTP has been sent to your email.");
      setTimeout(() => {
        setModalSuccess("");
        setModalStep("otp");
      }, 1500);
    } catch (err) {
      setModalError(err.message);
    } finally {
      setIsModalSubmitting(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setModalError("");
    setModalSuccess("");
    setIsModalSubmitting(true);

    try {
      const response = await fetch("/api/admin/forgot-password/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: modalEmail, otp: modalOtp }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Invalid OTP.");
      }
      setModalSuccess("OTP verified successfully.");
      setTimeout(() => {
        setModalSuccess("");
        setModalStep("reset");
      }, 1500);
    } catch (err) {
      setModalError(err.message);
    } finally {
      setIsModalSubmitting(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setModalError("");
    setModalSuccess("");

    if (!modalPassword || !modalConfirmPassword) {
      setModalError("Both password fields are required.");
      return;
    }

    if (modalPassword !== modalConfirmPassword) {
      setModalError("Passwords do not match.");
      return;
    }

    setIsModalSubmitting(true);

    try {
      const response = await fetch("/api/admin/forgot-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: modalEmail,
          otp: modalOtp,
          password: modalPassword,
          confirmPassword: modalConfirmPassword,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password.");
      }
      setModalSuccess("Password reset successfully!");
      setSuccessMessage("Password reset successfully. You can now log in with your new password.");
      setTimeout(() => {
        closeModal();
      }, 2000);
    } catch (err) {
      setModalError(err.message);
    } finally {
      setIsModalSubmitting(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">Username</span>
          <input
            type="text"
            name="username"
            value={form.username}
            onChange={handleChange}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 placeholder:text-slate-400 outline-none transition focus:border-cyan-500"
            placeholder="Enter your username"
            suppressHydrationWarning
            required
          />
        </label>

        <label className="grid gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Password</span>
            <button
              type="button"
              onClick={openModal}
              className="text-xs font-semibold text-cyan-600 hover:text-cyan-800 transition underline focus:outline-none"
            >
              Forgot Password?
            </button>
          </div>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 placeholder:text-slate-400 outline-none transition focus:border-cyan-500"
            placeholder="Enter your password"
            suppressHydrationWarning
            required
          />
        </label>

        {successMessage ? (
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </p>
        ) : null}

        {error ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:bg-slate-400"
          suppressHydrationWarning
        >
          {isPending ? "Redirecting..." : "Login to Dashboard"}
        </button>
      </form>

      {/* Forgot Password Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] bg-white p-8 shadow-2xl ring-1 ring-slate-200 transition-all duration-300">
            {/* Close Button */}
            <button
              type="button"
              onClick={closeModal}
              className="absolute right-6 top-6 text-slate-400 hover:text-slate-600 transition"
              aria-label="Close"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {modalStep === "email" && (
              <form onSubmit={handleSendOtp} className="grid gap-5">
                <div>
                  <h3 className="text-2xl font-bold text-slate-950">Forgot Password</h3>
                  <p className="mt-2 text-sm text-slate-500 font-medium">
                    Enter the email address registered with your account. We will send you an OTP to verify your identity.
                  </p>
                </div>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-700">Email ID</span>
                  <input
                    type="email"
                    value={modalEmail}
                    onChange={(e) => setModalEmail(e.target.value)}
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-slate-950 outline-none transition focus:border-cyan-500"
                    placeholder="name@company.com"
                    required
                  />
                </label>

                {modalError && (
                  <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {modalError}
                  </p>
                )}

                {modalSuccess && (
                  <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {modalSuccess}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isModalSubmitting}
                  className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {isModalSubmitting ? "Sending OTP..." : "Send OTP"}
                </button>
              </form>
            )}

            {modalStep === "otp" && (
              <form onSubmit={handleVerifyOtp} className="grid gap-5">
                <div>
                  <h3 className="text-2xl font-bold text-slate-950">OTP Verification</h3>
                  <p className="mt-2 text-sm text-slate-500 font-medium">
                    Enter the 6-digit OTP code sent to <strong className="text-slate-700">{modalEmail}</strong>.
                  </p>
                </div>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-700">One-Time Password (OTP)</span>
                  <input
                    type="text"
                    value={modalOtp}
                    onChange={(e) => setModalOtp(e.target.value)}
                    maxLength={6}
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-center text-2xl font-bold tracking-widest text-slate-950 outline-none transition focus:border-cyan-500"
                    placeholder="000000"
                    required
                  />
                </label>

                {modalError && (
                  <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {modalError}
                  </p>
                )}

                {modalSuccess && (
                  <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {modalSuccess}
                  </p>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setModalStep("email"); setModalError(""); setModalSuccess(""); }}
                    className="flex-1 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isModalSubmitting}
                    className="flex-1 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {isModalSubmitting ? "Verifying..." : "Verify OTP"}
                  </button>
                </div>
              </form>
            )}

            {modalStep === "reset" && (
              <form onSubmit={handleResetPassword} className="grid gap-5">
                <div>
                  <h3 className="text-2xl font-bold text-slate-950">Reset Password</h3>
                  <p className="mt-2 text-sm text-slate-500 font-medium">
                    Set a new strong password for your admin account.
                  </p>
                </div>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-700">New Password</span>
                  <input
                    type="password"
                    value={modalPassword}
                    onChange={(e) => setModalPassword(e.target.value)}
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-slate-950 outline-none transition focus:border-cyan-500"
                    placeholder="Enter new password"
                    required
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-700">Confirm Password</span>
                  <input
                    type="password"
                    value={modalConfirmPassword}
                    onChange={(e) => setModalConfirmPassword(e.target.value)}
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-slate-950 outline-none transition focus:border-cyan-500"
                    placeholder="Re-enter new password"
                    required
                  />
                </label>

                {modalError && (
                  <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {modalError}
                  </p>
                )}

                {modalSuccess && (
                  <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {modalSuccess}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isModalSubmitting}
                  className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {isModalSubmitting ? "Resetting..." : "Reset Password"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
