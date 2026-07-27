import { connectDB } from "@/lib/mongodb";
import Post from "@/models/Post";
import mongoose from "mongoose";

export async function POST(req, context) {
  await connectDB();

  const { params } = context;
  const { id } = await params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return Response.json({ error: "Invalid ID format" }, { status: 400 });
  }

  try {
    const post = await Post.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!post) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    return Response.json({ views: post.views });
  } catch {
    return Response.json({ error: "Unable to increment view count" }, { status: 500 });
  }
}
