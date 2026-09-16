"use client";

import { useEffect } from "react";

/** Counts one view per listing per browser session. */
export function ViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `viewed:${slug}`;

    try {
      if (window.sessionStorage.getItem(key)) {
        return;
      }

      window.sessionStorage.setItem(key, "1");
    } catch {
      // Storage can be blocked; counting the view anyway is fine.
    }

    void fetch(`/api/track/${encodeURIComponent(slug)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "view" }),
      keepalive: true,
    }).catch(() => undefined);
  }, [slug]);

  return null;
}
