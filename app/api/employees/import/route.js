import { requireApiRole } from "@/lib/auth";
import { ADMIN_ROLES } from "@/lib/admin-access";
import Employee from "@/models/Employee";
import { connectDB } from "@/lib/mongodb";

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

        // Parse dates safely
        if (emp.dateOfJoining) payload.dateOfJoining = new Date(emp.dateOfJoining);
        if (emp.dateOfBirth) payload.dateOfBirth = new Date(emp.dateOfBirth);
        if (emp.personalAnniversaryDate) payload.personalAnniversaryDate = new Date(emp.personalAnniversaryDate);

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
