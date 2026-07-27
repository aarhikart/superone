import { connectDB } from "@/lib/mongodb";
import { sendOtpEmail } from "@/lib/mailer";
import AdminUser from "@/models/AdminUser";

export async function POST(req) {
  try {
    const body = await req.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email) {
      return Response.json({ error: "Email address is required." }, { status: 400 });
    }

    await connectDB();
    const user = await AdminUser.findOne({ email });

    if (!user) {
      return Response.json({ error: "No user found with this email address." }, { status: 404 });
    }

    // Generate secure random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    user.otpCode = otp;
    user.otpExpiresAt = expiresAt;
    await user.save();

    // Send OTP via SMTP
    const mailResult = await sendOtpEmail(email, otp);
    if (!mailResult.success) {
      return Response.json({ error: mailResult.error || "Failed to send email." }, { status: 500 });
    }

    return Response.json({ success: true, message: "OTP sent to your email address." });
  } catch (error) {
    console.error("Forgot password request error:", error);
    return Response.json({ error: "Unable to process forgot password request." }, { status: 500 });
  }
}
