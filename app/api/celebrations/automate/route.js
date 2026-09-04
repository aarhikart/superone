import { ADMIN_ROLES } from "@/lib/admin-access";
import { requireApiRole } from "@/lib/auth";
import { runAutomatedCelebrationCheck } from "@/lib/celebration-service";

export async function POST(req) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET || "peoplepulse_celebrations_cron_secret";

  if (authHeader !== `Bearer ${cronSecret}`) {
    const { error } = await requireApiRole([
      ADMIN_ROLES.ADMIN,
      ADMIN_ROLES.HR,
    ]);

    if (error) {
      return error;
    }
  }

  try {
    let body = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const force = Boolean(body.force);
    const summary = await runAutomatedCelebrationCheck({ force });

    return Response.json({
      message: "Automated celebration check completed.",
      summary,
    });
  } catch (err) {
    return Response.json(
      { error: err.message || "Failed to run automated celebration check." },
      { status: 500 }
    );
  }
}
