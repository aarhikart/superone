import { ADMIN_ROLES } from "@/lib/admin-access";
import { requireRoleAccess } from "@/lib/auth";
import CelebrationsClient from "./celebrations-client";

export default async function CelebrationsPage() {
  const currentUser = await requireRoleAccess(
    [ADMIN_ROLES.ADMIN, ADMIN_ROLES.HR],
    "/admin/celebrations"
  );

  return <CelebrationsClient currentUser={currentUser} />;
}
