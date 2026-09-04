import { ADMIN_ROLES } from "@/lib/admin-access";
import { requireApiRole } from "@/lib/auth";
import {
  getCelebrationSettings,
  updateCelebrationSettings,
} from "@/lib/celebration-service";

export async function GET(req) {
  const { error } = await requireApiRole([
    ADMIN_ROLES.ADMIN,
    ADMIN_ROLES.HR,
  ]);

  if (error) {
    return error;
  }

  try {
    const settings = await getCelebrationSettings();
    return Response.json(settings);
  } catch (err) {
    return Response.json(
      { error: err.message || "Failed to load celebration settings." },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  const { error } = await requireApiRole([
    ADMIN_ROLES.ADMIN,
    ADMIN_ROLES.HR,
  ]);

  if (error) {
    return error;
  }

  try {
    const body = await req.json();
    const settings = await updateCelebrationSettings(body);
    return Response.json({
      message: "Celebration settings updated successfully.",
      settings,
    });
  } catch (err) {
    return Response.json(
      { error: err.message || "Failed to update settings." },
      { status: 400 }
    );
  }
}
