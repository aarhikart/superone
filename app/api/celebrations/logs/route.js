import { ADMIN_ROLES } from "@/lib/admin-access";
import { requireApiRole } from "@/lib/auth";
import { sendCelebrationEmail } from "@/lib/celebration-service";
import CelebrationLog from "@/models/CelebrationLog";
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
    const status = searchParams.get("status") || "";
    const celebrationType = searchParams.get("celebrationType") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "15", 10);

    await connectDB();

    const query = {};
    if (status && status !== "All") {
      query.status = status;
    }
    if (celebrationType && celebrationType !== "All") {
      query.celebrationType = celebrationType;
    }
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [
        { employeeName: regex },
        { employeeEmail: regex },
        { subject: regex },
      ];
    }

    const totalCount = await CelebrationLog.countDocuments(query);
    const logs = await CelebrationLog.find(query)
      .sort({ sentAt: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return Response.json({
      logs,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit) || 1,
    });
  } catch (err) {
    return Response.json(
      { error: err.message || "Failed to fetch celebration logs." },
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
    const { logId } = await req.json();
    await connectDB();

    const log = await CelebrationLog.findById(logId);
    if (!log) {
      return Response.json({ error: "Log record not found." }, { status: 404 });
    }

    const res = await sendCelebrationEmail({
      employeeId: log.employeeId,
      employeeName: log.employeeName,
      employeeEmail: log.employeeEmail,
      celebrationType: log.celebrationType,
      customSubject: log.subject,
      force: true,
    });

    return Response.json({
      message: res.success ? "Email retry dispatched." : "Email retry failed.",
      result: res,
    });
  } catch (err) {
    return Response.json(
      { error: err.message || "Retry attempt failed." },
      { status: 400 }
    );
  }
}
