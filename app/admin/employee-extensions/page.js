import { ADMIN_ROLES } from "@/lib/admin-access";
import { requireRoleAccess } from "@/lib/auth";
import EmployeeExtensionsClient from "./employee-extensions-client";

export default async function EmployeeExtensionsPage() {
  await requireRoleAccess(
    [ADMIN_ROLES.ADMIN, ADMIN_ROLES.HR],
    "/admin/employee-extensions"
  );

  return <EmployeeExtensionsClient />;
}
