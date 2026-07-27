import ArticlesClient from "@/app/admin/articles/articles-client";
import { ADMIN_ROLES } from "@/lib/admin-access";
import { requireRoleAccess } from "@/lib/auth";

export default async function AdminArticlesPage() {
  await requireRoleAccess(
    [ADMIN_ROLES.ADMIN, ADMIN_ROLES.MARKETING],
    "/admin/articles"
  );

  return <ArticlesClient />;
}

