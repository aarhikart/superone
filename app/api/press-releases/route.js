import { createPressRelease, getPressReleases } from "@/lib/press-release-service";
import { ADMIN_ROLES } from "@/lib/admin-access";
import { requireApiRole } from "@/lib/auth";
import { saveUploadedFile } from "@/lib/upload-file";

function validateTextField(value, fieldName) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${fieldName} is required.`);
  }

  return value.trim();
}

function validateLiveUrl(value) {
  if (value === null || value === undefined || (typeof value === "string" && !value.trim())) {
    return "";
  }
  const liveUrl = value.trim();

  try {
    new URL(liveUrl);
    return liveUrl;
  } catch {
    throw new Error("Live press release URL must be a valid URL.");
  }
}

export async function GET() {
  const pressReleases = await getPressReleases();
  return Response.json(pressReleases);
}

export async function POST(req) {
  const { error } = await requireApiRole([ADMIN_ROLES.ADMIN, ADMIN_ROLES.MARKETING]);

  if (error) {
    return error;
  }

  try {
    const formData = await req.formData();

    const title = validateTextField(formData.get("title"), "Title");
    const description = validateTextField(formData.get("description"), "Description");
    const liveUrl = validateLiveUrl(formData.get("liveUrl"));
    const imageFile = formData.get("image");

    const image = await saveUploadedFile(imageFile);

    const pressRelease = await createPressRelease({
      title,
      description,
      liveUrl,
      image,
    });

    return Response.json(pressRelease, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error.message || "Unable to create press release." },
      { status: 400 }
    );
  }
}