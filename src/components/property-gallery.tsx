"use client";

import { Image } from "antd";
import type { CSSProperties } from "react";
import { HomeIcon } from "@/components/icons";
import { mediumUrl, thumbnailUrl, type Photo } from "@/lib/property";

const VISIBLE = 5;

/**
 * Photo mosaic; every photo (including hidden ones) opens in the lightbox.
 * The main photo and the lightbox use the medium (≈1280px) copy, which carries the site watermark; the original is never shown.
 * The side tiles use the thumbnail size, unless there are only a few wide tiles.
 */
export function PropertyGallery({ photos, title }: { photos: Photo[]; title: string }) {
  if (photos.length === 0) {
    return (
      <div className="gallery-empty">
        <HomeIcon className="placeholder-icon" />
      </div>
    );
  }

  const visible = photos.slice(0, VISIBLE);
  const hidden = photos.slice(VISIBLE);
  const small = photos.length < VISIBLE;

  return (
    <Image.PreviewGroup>
      <div
        className={`gallery${small ? " gallery-small" : ""}`}
        style={small ? ({ "--gallery-columns": visible.length } as CSSProperties) : undefined}
      >
        {visible.map((photo, index) => (
          <div key={photo.id} className={`gallery-item${index === 0 ? " gallery-main" : ""}`}>
            <Image
              src={index === 0 || small ? mediumUrl(photo) : thumbnailUrl(photo)}
              alt={`${title} — photo ${index + 1}`}
              preview={{ src: mediumUrl(photo) }}
            />
            {index === VISIBLE - 1 && hidden.length > 0 && <span className="gallery-more">+{hidden.length}</span>}
          </div>
        ))}
        {hidden.map((photo, index) => (
          <div key={photo.id} hidden>
            <Image src={thumbnailUrl(photo)} alt={`${title} — photo ${VISIBLE + index + 1}`} preview={{ src: mediumUrl(photo) }} loading="lazy" />
          </div>
        ))}
      </div>
    </Image.PreviewGroup>
  );
}
