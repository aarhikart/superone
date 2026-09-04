import { ADMIN_ROLES } from "@/lib/admin-access";
import { requireRoleAccess } from "@/lib/auth";
import EmployeesClient from "./employees-client";

export default async function EmployeesPage() {
  const currentUser = await requireRoleAccess(
    [ADMIN_ROLES.ADMIN, ADMIN_ROLES.HR],
    "/admin/employees"
  );

  return <EmployeesClient currentUser={currentUser} />;
}
