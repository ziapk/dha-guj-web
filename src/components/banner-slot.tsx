"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { sizedImage } from "@/lib/image";
import type { Banner, BannerPlacement, BannerSize } from "@/types/api";

/** Used until the API answers with the admin-set size, or when it sends none. */
const FALLBACK_SIZE: BannerSize = { width: 1200, height: 300 };

/**
 * An ad slot. Banners load in the browser after the page renders, so every real page view counts one impression
 * (the server-rendered page is cached for everyone). Renders nothing while loading, when empty or when the API fails.
 * Give the slot a `key` that changes with the page (e.g. the search filters) so client-side navigation loads new banners.
 * Each banner is at most the admin-set width, keeps the admin-set shape and crops images of another shape to fill it.
 */
export function BannerSlot({ placement, limit = 1, className }: { placement: BannerPlacement; limit?: number; className?: string }) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [size, setSize] = useState<BannerSize>(FALLBACK_SIZE);
  const requested = useRef(false);

  useEffect(() => {
    // Development double-runs effects; ask once per mounted slot so impressions are not counted twice.
    if (requested.current) {
      return;
    }

    requested.current = true;

    fetch(`/api/banners?placement=${placement}&limit=${limit}`, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : { data: [] }))
      .then((payload: { data?: Banner[]; size?: BannerSize | null }) => {
        setSize(payload.size ?? FALLBACK_SIZE);
        setBanners((payload.data ?? []).filter((banner) => banner.image_url));
      })
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
            src={sizedImage(banner.image_url, "medium")}
            alt={banner.title}
            width={size.width}
            height={size.height}
            sizes={`(max-width: ${size.width}px) 100vw, ${size.width}px`}
            unoptimized
          />
        );

        return (
          <div key={banner.id} className="banner" style={{ maxWidth: size.width, aspectRatio: `${size.width} / ${size.height}` }}>
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
