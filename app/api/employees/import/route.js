import { requireApiRole } from "@/lib/auth";
import { ADMIN_ROLES } from "@/lib/admin-access";
import Employee from "@/models/Employee";
import { connectDB } from "@/lib/mongodb";

function parseDateSafely(val) {
  if (!val) return null;
  if (val instanceof Date && !isNaN(val.getTime())) {
    const dObj = new Date(val.getTime() + 12 * 60 * 60 * 1000);
    const y = dObj.getUTCFullYear();
    const m = String(dObj.getUTCMonth() + 1).padStart(2, "0");
    const d = String(dObj.getUTCDate()).padStart(2, "0");
    return new Date(`${y}-${m}-${d}T00:00:00.000Z`);
  }
  if (typeof val === "string") {
    const s = val.trim();
    if (!s) return null;
    const isoMatch = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (isoMatch) {
      const y = isoMatch[1];
      const m = String(isoMatch[2]).padStart(2, "0");
      const d = String(isoMatch[3]).padStart(2, "0");
      return new Date(`${y}-${m}-${d}T00:00:00.000Z`);
    }
    const usMatch = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (usMatch) {
      const p1 = parseInt(usMatch[1], 10);
      const p2 = parseInt(usMatch[2], 10);
      const y = usMatch[3];
      const m = String(p1 > 12 ? p2 : p1).padStart(2, "0");
      const d = String(p1 > 12 ? p1 : p2).padStart(2, "0");
      return new Date(`${y}-${m}-${d}T00:00:00.000Z`);
    }
  }
  const fallback = new Date(val);
  return isNaN(fallback.getTime()) ? null : fallback;
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
    const { employees } = await req.json();

    if (!employees || !Array.isArray(employees)) {
      return Response.json(
        { error: "Invalid data payload." },
        { status: 400 }
      );
    }

    await connectDB();

    const dbDuplicates = [];
    const newEmployees = [];

    // Check existing by email or employeeId
    const existingEmployees = await Employee.find({
      $or: [
        { email: { $in: employees.map((e) => e.email.toLowerCase()) } },
        { employeeId: { $in: employees.map((e) => e.employeeId) } },
      ],
    }).lean();

    const existingEmails = new Set(existingEmployees.map(e => e.email.toLowerCase()));
    const existingIds = new Set(existingEmployees.map(e => e.employeeId));

    for (const emp of employees) {
      if (existingEmails.has(emp.email.toLowerCase()) || existingIds.has(emp.employeeId)) {
        dbDuplicates.push(emp);
      } else {
        const payload = {
          firstName: emp.firstName,
          lastName: emp.lastName,
          employeeId: emp.employeeId,
          email: emp.email.toLowerCase(),
          phoneNumber: emp.phoneNumber || "",
          department: emp.department || "",
          jobTitle: emp.jobTitle || "",
          employmentStatus: emp.employmentStatus || "Full-time",
          status: "Active",
        };

        // Parse dates safely with zero-drift UTC midnight guarantee
        if (emp.dateOfJoining) payload.dateOfJoining = parseDateSafely(emp.dateOfJoining);
        if (emp.dateOfBirth) payload.dateOfBirth = parseDateSafely(emp.dateOfBirth);
        if (emp.personalAnniversaryDate) payload.personalAnniversaryDate = parseDateSafely(emp.personalAnniversaryDate);

        newEmployees.push(payload);
      }
    }

    if (newEmployees.length > 0) {
      await Employee.insertMany(newEmployees);
    }

    return Response.json({
      success: true,
      importedCount: newEmployees.length,
      duplicates: dbDuplicates,
    });
  } catch (err) {
    console.error("Bulk Import Error:", err);
    return Response.json(
      { error: err.message || "Failed to import employees." },
      { status: 500 }
    );
  }
}
