import { connectDB } from "@/lib/mongodb";
import AdminUser from "@/models/AdminUser";

export async function POST(req) {
  try {
    const body = await req.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const otp = typeof body?.otp === "string" ? body.otp.trim() : "";

    if (!email || !otp) {
      return Response.json({ error: "Email address and OTP are required." }, { status: 400 });
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

    return Response.json({ success: true, message: "OTP verified successfully." });
  } catch (error) {
    console.error("Forgot password verify error:", error);
    return Response.json({ error: "Unable to verify OTP." }, { status: 500 });
  }
}
