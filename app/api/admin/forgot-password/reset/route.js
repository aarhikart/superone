import { connectDB } from "@/lib/mongodb";
import { hashPassword } from "@/lib/auth";
import AdminUser from "@/models/AdminUser";

export async function POST(req) {
  try {
    const body = await req.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const otp = typeof body?.otp === "string" ? body.otp.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const confirmPassword = typeof body?.confirmPassword === "string" ? body.confirmPassword : "";

    if (!email || !otp) {
      return Response.json({ error: "Email address and OTP are required." }, { status: 400 });
    }

    if (!password || !confirmPassword) {
      return Response.json({ error: "Password fields are required." }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return Response.json({ error: "Passwords do not match." }, { status: 400 });
    }

    await connectDB();
    const user = await AdminUser.findOne({ email });

    if (!user) {
      return Response.json({ error: "No user found with this email address." }, { status: 404 });
    }

    if (!user.otpCode || user.otpCode !== otp) {
      return Response.json({ error: "Invalid OTP code." }, { status: 400 });
    }

    if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      return Response.json({ error: "OTP code has expired. Please request a new one." }, { status: 400 });
    }

    // Reset password
    user.passwordHash = hashPassword(password);
    // Clear OTP fields
    user.otpCode = null;
    user.otpExpiresAt = null;
    await user.save();

    return Response.json({ success: true, message: "Password reset successfully. You can now log in." });
  } catch (error) {
    console.error("Forgot password reset error:", error);
    return Response.json({ error: "Unable to reset password." }, { status: 500 });
  }
}
