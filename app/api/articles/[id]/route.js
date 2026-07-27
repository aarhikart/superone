import { deleteArticle, getArticleById, updateArticle } from "@/lib/article-service";
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
    throw new Error("Live article URL must be a valid URL.");
  }
}

export async function GET(_req, context) {
  const { id } = await context.params;
  const article = await getArticleById(id);

  if (!article) {
    return Response.json({ error: "Article not found." }, { status: 404 });
  }

  return Response.json(article);
}

export async function PUT(req, context) {
  const { error } = await requireApiRole([ADMIN_ROLES.ADMIN, ADMIN_ROLES.MARKETING]);

  if (error) {
    return error;
  }

  const { id } = await context.params;
  const existingArticle = await getArticleById(id);

  if (!existingArticle) {
    return Response.json({ error: "Article not found." }, { status: 404 });
  }

  try {
    const formData = await req.formData();

    const title = validateTextField(formData.get("title"), "Title");
    const description = validateTextField(formData.get("description"), "Description");
    const liveUrl = validateLiveUrl(formData.get("liveUrl"));
    const imageFile = formData.get("image");

    let image = existingArticle.image;

    if (imageFile && imageFile.size > 0) {
      image = await saveUploadedFile(imageFile);
      await removeUploadedFile(existingArticle.image);
    }

    const updatedArticle = await updateArticle(id, {
      title,
      description,
      liveUrl,
      image,
    });

    return Response.json(updatedArticle);
  } catch (error) {
    return Response.json(
      { error: error.message || "Unable to update article." },
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
  const article = await deleteArticle(id);

  if (!article) {
    return Response.json({ error: "Article not found." }, { status: 404 });
  }

  await removeUploadedFile(article.image);

  return Response.json({ message: "Article deleted successfully." });
}