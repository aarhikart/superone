import { ADMIN_ROLES } from "@/lib/admin-access";
import { requireApiRole } from "@/lib/auth";
import {
  createEmployee,
  getEmployees,
  getEmployeeStats,
} from "@/lib/employee-service";
import { saveUploadedFile } from "@/lib/upload-file";

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
    const department = searchParams.get("department") || "";
    const status = searchParams.get("status") || "";
    const celebrationFilter = searchParams.get("celebrationFilter") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const all = searchParams.get("all") === "true";

    const [data, stats] = await Promise.all([
      getEmployees({ search, department, status, celebrationFilter, page, limit, all }),
      getEmployeeStats(),
    ]);

    return Response.json({
      ...data,
      stats,
    });
  } catch (err) {
    return Response.json(
      { error: err.message || "Failed to fetch employees." },
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
    let avatarUrl = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const avatarFile = formData.get("avatarFile");

      if (avatarFile && avatarFile.size > 0 && typeof avatarFile.arrayBuffer === "function") {
        avatarUrl = await saveUploadedFile(avatarFile, "employees");
      }

      body = {
        firstName: formData.get("firstName") || "",
        lastName: formData.get("lastName") || "",
        employeeId: formData.get("employeeId") || "",
        email: formData.get("email") || "",
        phoneNumber: formData.get("phoneNumber") || "",
        department: formData.get("department") || "",
        jobTitle: formData.get("jobTitle") || "",
        dateOfJoining: formData.get("dateOfJoining") || "",
        employmentStatus: formData.get("employmentStatus") || "Full-time",
        dateOfBirth: formData.get("dateOfBirth") || null,
        personalAnniversaryDate: formData.get("personalAnniversaryDate") || null,
        sendBirthdayEmail: formData.get("sendBirthdayEmail") === "true" || formData.get("sendBirthdayEmail") === true,
        sendWorkAnniversaryEmail: formData.get("sendWorkAnniversaryEmail") === "true" || formData.get("sendWorkAnniversaryEmail") === true,
        sendPersonalAnniversaryEmail: formData.get("sendPersonalAnniversaryEmail") === "true" || formData.get("sendPersonalAnniversaryEmail") === true,
        avatar: avatarUrl || formData.get("avatar") || "",
        status: formData.get("status") || "Active",
      };
    } else {
      body = await req.json();
    }

    if (!body.firstName || !body.lastName) {
      return Response.json(
        { error: "First Name and Last Name are required." },
        { status: 400 }
      );
    }
    if (!body.employeeId) {
      return Response.json(
        { error: "Employee ID is required." },
        { status: 400 }
      );
    }
    if (!body.email) {
      return Response.json(
        { error: "Work Email is required." },
        { status: 400 }
      );
    }
    if (!body.department) {
      return Response.json(
        { error: "Department is required." },
        { status: 400 }
      );
    }
    if (!body.jobTitle) {
      return Response.json(
        { error: "Job Title is required." },
        { status: 400 }
      );
    }
    if (!body.dateOfJoining) {
      return Response.json(
        { error: "Date of Joining is required." },
        { status: 400 }
      );
    }

    const employee = await createEmployee(body);

    // If newly created employee has a celebration milestone today and scheduled time is reached, auto-dispatch
    try {
      const { runAutomatedCelebrationCheck } = await import("@/lib/celebration-service");
      runAutomatedCelebrationCheck().catch((err) =>
        console.error("[Auto Celebration Check Error on Employee Create]:", err)
      );
    } catch {
      // Non-blocking
    }

    return Response.json(
      { message: "Employee added successfully", employee },
      { status: 201 }
    );
  } catch (err) {
    return Response.json(
      { error: err.message || "Failed to create employee." },
      { status: 400 }
    );
  }
}
