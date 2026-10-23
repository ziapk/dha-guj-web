"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/** Paths that open as an intercepted modal over the current page, so the page behind must keep its scroll. */
const MODAL_PATHS = new Set(["/login", "/forgot-password"]);

/**
 * Starts every new page at the top. Next skips its own scroll when the new page's first element is already
 * in view or sits under the sticky header, so this forces it. Back/forward keeps the browser's restored
 * position, and query-only changes (load more, tabs) are left alone.
 */
export function ScrollToTop() {
  const pathname = usePathname();
  const isPopState = useRef(false);

  useEffect(() => {
    const onPopState = () => {
      isPopState.current = true;
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (isPopState.current) {
      isPopState.current = false;
      return;
    }
    if (MODAL_PATHS.has(pathname) || window.location.hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
