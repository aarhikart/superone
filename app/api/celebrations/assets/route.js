import { ADMIN_ROLES } from "@/lib/admin-access";
import { requireApiRole } from "@/lib/auth";
import {
  getCelebrationAssets,
} from "@/lib/celebration-service";
import CelebrationAsset from "@/models/CelebrationAsset";
import { saveUploadedFile } from "@/lib/upload-file";
import { connectDB } from "@/lib/mongodb";

export async function GET(req) {
  const { error } = await requireApiRole([
    ADMIN_ROLES.ADMIN,
    ADMIN_ROLES.HR,
  ]);

  if (error) {
    return error;
  }

  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || "";
    const assets = await getCelebrationAssets(category);
    return Response.json(assets);
  } catch (err) {
    return Response.json(
      { error: err.message || "Failed to fetch celebration assets." },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  const { error } = await requireApiRole([
    ADMIN_ROLES.ADMIN,
    ADMIN_ROLES.HR,
  ]);

  if (error) {
    return error;
  }

  try {
    const formData = await req.formData();
    const category = formData.get("category") || "Birthdays";
    const targetAudience = formData.get("targetAudience") || "All Staff";
    const files = formData.getAll("files");

    if (!files || files.length === 0) {
      return Response.json(
        { error: "No image files provided." },
        { status: 400 }
      );
    }

    await connectDB();
    const createdAssets = [];

    for (const file of files) {
      if (file && typeof file.arrayBuffer === "function" && file.size > 0) {
        const imageUrl = await saveUploadedFile(file, "celebrations");
        const cleanName = file.name
          .replace(/\.[^/.]+$/, "")
          .replace(/[-_]/g, " ");
        const title =
          cleanName.charAt(0).toUpperCase() + cleanName.slice(1);

        const asset = await CelebrationAsset.create({
          title: title || `${category} Visual`,
          category,
          imageUrl,
          targetAudience,
          iconType:
            category === "Birthdays"
              ? "cake"
              : category === "Work Anniversaries"
              ? "medal"
              : "heart",
        });

        createdAssets.push(asset);
      }
    }

    return Response.json(
      {
        message: `Successfully uploaded ${createdAssets.length} image(s).`,
        assets: createdAssets,
      },
      { status: 201 }
    );
  } catch (err) {
    return Response.json(
      { error: err.message || "Failed to upload celebration assets." },
      { status: 400 }
    );
  }
}
