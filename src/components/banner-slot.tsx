"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Banner, BannerPlacement } from "@/types/api";

/**
 * An ad slot. Banners load in the browser after the page renders, so every real page view counts one impression
 * (the server-rendered page is cached for everyone). Renders nothing while loading, when empty or when the API fails.
 * Give the slot a `key` that changes with the page (e.g. the search filters) so client-side navigation loads new banners.
 */
export function BannerSlot({ placement, limit = 1, className }: { placement: BannerPlacement; limit?: number; className?: string }) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const requested = useRef(false);

  useEffect(() => {
    // Development double-runs effects; ask once per mounted slot so impressions are not counted twice.
    if (requested.current) {
      return;
    }

    requested.current = true;

    fetch(`/api/banners?placement=${placement}&limit=${limit}`, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : { data: [] }))
      .then((payload: { data?: Banner[] }) => setBanners((payload.data ?? []).filter((banner) => banner.image_url)))
      .catch(() => undefined);
  }, [placement, limit]);

  if (banners.length === 0) {
    return null;
  }

  return (
    <aside className={`banner-slot banner-${placement}${className ? ` ${className}` : ""}`} aria-label="Advertisement">
      {banners.map((banner) => {
        const image = (
          <Image
            src={banner.image_url}
            alt={banner.title}
            width={1200}
            height={300}
            sizes={placement === "search_sidebar" || placement === "listing_sidebar" ? "(max-width: 1023px) 100vw, 340px" : "(max-width: 1240px) 100vw, 1200px"}
            unoptimized
          />
        );

        return (
          <div key={banner.id} className="banner">
            <span className="banner-label">Ad</span>
            {banner.link_url ? (
              <a href={`/api/banners/${banner.id}/click`} target="_blank" rel="sponsored noopener" aria-label={`${banner.title} (advertisement, opens in a new tab)`}>
                {image}
              </a>
            ) : (
              image
            )}
          </div>
        );
      })}
    </aside>
  );
}
