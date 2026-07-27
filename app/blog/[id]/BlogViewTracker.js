"use client";

import { useEffect, useState } from "react";

export default function BlogViewTracker({ postId, initialViews }) {
  const [views, setViews] = useState(initialViews);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const key = `blog_view_${postId}`;
    const now = Date.now();
    const stored = localStorage.getItem(key);

    let shouldIncrement = true;
    if (stored) {
      const timestamp = parseInt(stored, 10);
      // 3 hours = 3 * 60 * 60 * 1000 = 10800000 milliseconds
      if (!isNaN(timestamp) && now - timestamp < 10800000) {
        shouldIncrement = false;
      }
    }

    if (shouldIncrement) {
      fetch(`/api/posts/${postId}/view`, {
        method: "POST",
      })
        .then((res) => {
          if (res.ok) {
            return res.json();
          }
          throw new Error("Failed to record view count.");
        })
        .then((data) => {
          if (typeof data.views === "number") {
            setViews(data.views);
            localStorage.setItem(key, now.toString());
          }
        })
        .catch((err) => {
          console.error("Error updating view count:", err);
        });
    }
  }, [postId]);

  return (
    <span className="text-slate-400">
      {views} {views === 1 ? "View" : "Views"}
    </span>
  );
}
