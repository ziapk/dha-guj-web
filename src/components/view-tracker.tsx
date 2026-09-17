"use client";

import { useEffect } from "react";

/** Counts one view per listing (or developer project) per browser session. */
export function ViewTracker({ slug, subject = "property" }: { slug: string; subject?: "property" | "project" }) {
  useEffect(() => {
    const key = subject === "project" ? `viewed:project:${slug}` : `viewed:${slug}`;

    try {
      if (window.sessionStorage.getItem(key)) {
        return;
      }

      window.sessionStorage.setItem(key, "1");
    } catch {
      // Storage can be blocked; counting the view anyway is fine.
    }

    void fetch(subject === "project" ? `/api/projects/${encodeURIComponent(slug)}/track` : `/api/track/${encodeURIComponent(slug)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "view" }),
      keepalive: true,
    }).catch(() => undefined);
  }, [slug, subject]);

  return null;
}
