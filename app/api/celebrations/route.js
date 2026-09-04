import { ADMIN_ROLES } from "@/lib/admin-access";
import { requireApiRole } from "@/lib/auth";
import {
  getUpcomingCelebrations,
  sendCelebrationEmail,
  runAutomatedCelebrationCheck,
} from "@/lib/celebration-service";
import ManualCelebration from "@/models/ManualCelebration";
import { connectDB } from "@/lib/mongodb";

export async function GET(req) {
  const { error } = await requireApiRole([
    ADMIN_ROLES.ADMIN,
    ADMIN_ROLES.HR,
  ]);

  if (error) {
    return error;
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const celebrationType = searchParams.get("celebrationType") || "";
    const status = searchParams.get("status") || "";

    // Automatically check and dispatch due celebrations in background
    runAutomatedCelebrationCheck().catch((err) =>
      console.error("[Auto Celebration Check Error]:", err)
    );

    const data = await getUpcomingCelebrations({
      search,
      celebrationType,
      status,
    });

    return Response.json(data);
  } catch (err) {
    return Response.json(
      { error: err.message || "Failed to load celebrations data." },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  const { error } = await requireApiRole([
    ADMIN_ROLES.ADMIN,
    ADMIN_ROLES.HR,
  ]);

  if (error) {
    return error;
  }

  try {
    const contentType = req.headers.get("content-type") || "";
    let body = {};

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      for (const [key, value] of formData.entries()) {
        if (key !== "customImage") {
          body[key] = value;
        }
      }
      const file = formData.get("customImage");
      if (file && typeof file.arrayBuffer === "function" && file.size > 0) {
        const { saveUploadedFile } = await import("@/lib/upload-file");
        body.assetImageUrl = await saveUploadedFile(file, "manual-celebrations");
      }
    } else {
      body = await req.json();
    }

    // If request is to send a celebration email now
    if (body.action === "sendNow") {
      const res = await sendCelebrationEmail({
        employeeId: body.employeeId || null,
        employeeName: body.employeeName,
        employeeEmail: body.employeeEmail,
        celebrationType: body.celebrationType,
        customSubject: body.customSubject,
        customHeading: body.customHeading,
        customMessage: body.customMessage,
        assetId: body.assetId,
        assetImageUrl: body.assetImageUrl,
        yearsCompleted: body.yearsCompleted,
        force: true,
      });

      if (!res.success) {
        return Response.json({ error: res.error }, { status: 400 });
      }

      return Response.json({
        message: "Celebration email sent successfully.",
        details: res,
      });
    }

    // Otherwise, create a manual milestone celebration
    await connectDB();

    if (!body.employeeName || !body.employeeEmail || !body.celebrationDate || !body.customTitle) {
      return Response.json(
        { error: "Employee Name, Email, Title, and Date are required." },
        { status: 400 }
      );
    }

    const manual = await ManualCelebration.create({
      employeeId: body.employeeId || null,
      employeeName: body.employeeName.trim(),
      employeeEmail: body.employeeEmail.trim().toLowerCase(),
      jobTitle: body.jobTitle?.trim() || "Team Member",
      department: body.department?.trim() || "General",
      celebrationType: body.celebrationType || "Custom",
      customTitle: body.customTitle.trim(),
      celebrationDate: new Date(body.celebrationDate),
      message: body.message?.trim() || "",
      avatar: body.avatar || "",
      assetImageUrl: body.assetImageUrl || "",
    });

    // Auto check if new manual celebration is scheduled for today
    runAutomatedCelebrationCheck().catch((err) =>
      console.error("[Auto Celebration Check Error]:", err)
    );

    return Response.json(
      { message: "Manual celebration created successfully", manual },
      { status: 201 }
    );
  } catch (err) {
    return Response.json(
      { error: err.message || "Failed to process celebration request." },
      { status: 400 }
    );
  }
}
