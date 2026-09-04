import { ADMIN_ROLES } from "@/lib/admin-access";
import { requireApiRole } from "@/lib/auth";
import { deleteCelebrationAsset } from "@/lib/celebration-service";

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
    const result = await deleteCelebrationAsset(id);
    return Response.json(result);
  } catch (err) {
    return Response.json(
      { error: err.message || "Failed to delete celebration asset." },
      { status: 400 }
    );
  }
}
