import {
  deletePressRelease,
  getPressReleaseById,
  updatePressRelease,
} from "@/lib/press-release-service";
import { ADMIN_ROLES } from "@/lib/admin-access";
import { requireApiRole } from "@/lib/auth";
import { removeUploadedFile, saveUploadedFile } from "@/lib/upload-file";

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

export async function GET(_req, context) {
  const { id } = await context.params;
  const pressRelease = await getPressReleaseById(id);

  if (!pressRelease) {
    return Response.json({ error: "Press release not found." }, { status: 404 });
  }

  return Response.json(pressRelease);
}

export async function PUT(req, context) {
  const { error } = await requireApiRole([ADMIN_ROLES.ADMIN, ADMIN_ROLES.MARKETING]);

  if (error) {
    return error;
  }

  const { id } = await context.params;
  const existingPressRelease = await getPressReleaseById(id);

  if (!existingPressRelease) {
    return Response.json({ error: "Press release not found." }, { status: 404 });
  }

  try {
    const formData = await req.formData();

    const title = validateTextField(formData.get("title"), "Title");
    const description = validateTextField(formData.get("description"), "Description");
    const liveUrl = validateLiveUrl(formData.get("liveUrl"));
    const imageFile = formData.get("image");

    let image = existingPressRelease.image;

    if (imageFile && imageFile.size > 0) {
      image = await saveUploadedFile(imageFile);
      await removeUploadedFile(existingPressRelease.image);
    }

    const updatedPressRelease = await updatePressRelease(id, {
      title,
      description,
      liveUrl,
      image,
    });

    return Response.json(updatedPressRelease);
  } catch (error) {
    return Response.json(
      { error: error.message || "Unable to update press release." },
      { status: 400 }
    );
  }
}

export async function DELETE(_req, context) {
  const { error } = await requireApiRole([ADMIN_ROLES.ADMIN, ADMIN_ROLES.MARKETING]);

  if (error) {
    return error;
  }

  const { id } = await context.params;
  const pressRelease = await deletePressRelease(id);

  if (!pressRelease) {
    return Response.json({ error: "Press release not found." }, { status: 404 });
  }

  await removeUploadedFile(pressRelease.image);

  return Response.json({ message: "Press release deleted successfully." });
}