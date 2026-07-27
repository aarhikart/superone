import PressReleasesClient from "@/app/admin/press-releases/press-releases-client";
import { ADMIN_ROLES } from "@/lib/admin-access";
import { requireRoleAccess } from "@/lib/auth";

export default async function AdminPressReleasesPage() {
  await requireRoleAccess(
    [ADMIN_ROLES.ADMIN, ADMIN_ROLES.MARKETING],
    "/admin/press-releases"
  );

  return <PressReleasesClient />;
}