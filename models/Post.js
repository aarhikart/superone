import mongoose from "mongoose";

const PostSchema = new mongoose.Schema(
  {
    title: String,
    subTitle: String,
    description: String,
    date: String,
    image: String,
    views: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Post || mongoose.model("Post", PostSchema);
