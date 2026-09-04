import { ADMIN_ROLES } from "@/lib/admin-access";
import { requireApiRole } from "@/lib/auth";
import {
  deleteEmployee,
  getEmployeeById,
  updateEmployee,
} from "@/lib/employee-service";
import { saveUploadedFile } from "@/lib/upload-file";

export async function GET(req, { params }) {
  const { error } = await requireApiRole([
    ADMIN_ROLES.ADMIN,
    ADMIN_ROLES.HR,
  ]);

  if (error) {
    return error;
  }

  try {
    const { id } = await params;
    const employee = await getEmployeeById(id);

    if (!employee) {
      return Response.json(
        { error: "Employee not found." },
        { status: 404 }
      );
    }

    return Response.json(employee);
  } catch (err) {
    return Response.json(
      { error: err.message || "Failed to retrieve employee." },
      { status: 500 }
    );
  }
}

export async function PUT(req, { params }) {
  const { error } = await requireApiRole([
    ADMIN_ROLES.ADMIN,
    ADMIN_ROLES.HR,
  ]);

  if (error) {
    return error;
  }

  try {
    const { id } = await params;
    const contentType = req.headers.get("content-type") || "";
    let body = {};

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const avatarFile = formData.get("avatarFile");

      let avatarUrl = undefined;
      if (avatarFile && avatarFile.size > 0 && typeof avatarFile.arrayBuffer === "function") {
        avatarUrl = await saveUploadedFile(avatarFile, "employees");
      }

      body = {
        firstName: formData.get("firstName") || undefined,
        lastName: formData.get("lastName") || undefined,
        employeeId: formData.get("employeeId") || undefined,
        email: formData.get("email") || undefined,
        phoneNumber: formData.get("phoneNumber") !== null ? formData.get("phoneNumber") : undefined,
        department: formData.get("department") || undefined,
        jobTitle: formData.get("jobTitle") || undefined,
        dateOfJoining: formData.get("dateOfJoining") || undefined,
        employmentStatus: formData.get("employmentStatus") || undefined,
        dateOfBirth: formData.get("dateOfBirth") !== null ? formData.get("dateOfBirth") : undefined,
        personalAnniversaryDate: formData.get("personalAnniversaryDate") !== null ? formData.get("personalAnniversaryDate") : undefined,
        sendBirthdayEmail: formData.get("sendBirthdayEmail") !== null ? formData.get("sendBirthdayEmail") === "true" || formData.get("sendBirthdayEmail") === true : undefined,
        sendWorkAnniversaryEmail: formData.get("sendWorkAnniversaryEmail") !== null ? formData.get("sendWorkAnniversaryEmail") === "true" || formData.get("sendWorkAnniversaryEmail") === true : undefined,
        sendPersonalAnniversaryEmail: formData.get("sendPersonalAnniversaryEmail") !== null ? formData.get("sendPersonalAnniversaryEmail") === "true" || formData.get("sendPersonalAnniversaryEmail") === true : undefined,
        status: formData.get("status") || undefined,
      };

      if (avatarUrl) {
        body.avatar = avatarUrl;
      }
    } else {
      body = await req.json();
    }

    const employee = await updateEmployee(id, body);

    return Response.json({
      message: "Employee updated successfully",
      employee,
    });
  } catch (err) {
    return Response.json(
      { error: err.message || "Failed to update employee." },
      { status: 400 }
    );
  }
}

export async function DELETE(req, { params }) {
  const { error } = await requireApiRole([
    ADMIN_ROLES.ADMIN,
    ADMIN_ROLES.HR,
  ]);

  if (error) {
    return error;
  }

  try {
    const { id } = await params;
    await deleteEmployee(id);

    return Response.json({
      message: "Employee deleted successfully.",
      success: true,
    });
  } catch (err) {
    return Response.json(
      { error: err.message || "Failed to delete employee." },
      { status: 400 }
    );
  }
}
