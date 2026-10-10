"use client";

import { Image } from "antd";
import { useState } from "react";
import { CameraIcon } from "@/components/icons";
import { GALLERY_CATEGORY_LABELS } from "@/lib/developers";
import type { DeveloperGalleryItem, GalleryCategory } from "@/types/api";

/** Photos shown on the page; the rest open from the last tile in the lightbox. */
const VISIBLE = 4;

function altOf(photo: DeveloperGalleryItem, name: string, index: number): string {
  return photo.alt || photo.title || `${name} work photo ${index + 1}`;
}

/**
 * A company's work gallery: one large photo, three stacked tiles, every photo in the lightbox.
 * Category tabs appear once the photos span more than one category.
 */
export function WorkGallery({ photos, name }: { photos: DeveloperGalleryItem[]; name: string }) {
  const [category, setCategory] = useState<GalleryCategory | null>(null);
  const categories = (Object.keys(GALLERY_CATEGORY_LABELS) as GalleryCategory[]).filter((key) => photos.some((photo) => photo.category === key));
  const shown = category ? photos.filter((photo) => photo.category === category) : photos;
  const visible = shown.slice(0, VISIBLE);
  const hidden = shown.slice(VISIBLE);

  return (
    <>
      {categories.length > 1 && (
        <div className="dv-gallery-tabs" role="tablist" aria-label="Gallery categories">
          <button type="button" role="tab" aria-selected={category === null} className={category === null ? "is-active" : undefined} onClick={() => setCategory(null)}>
            All
          </button>
          {categories.map((key) => (
            <button key={key} type="button" role="tab" aria-selected={category === key} className={category === key ? "is-active" : undefined} onClick={() => setCategory(key)}>
              {GALLERY_CATEGORY_LABELS[key]}
            </button>
          ))}
        </div>
      )}
      <Image.PreviewGroup>
        <div className={`dv-gallery dv-gallery-${Math.min(visible.length, VISIBLE)}`}>
          {visible.map((photo, index) => (
            <figure key={photo.url} className={`dv-gallery-item${index === 0 ? " dv-gallery-main" : ""}`}>
              <Image src={photo.url} alt={altOf(photo, name, index)} loading={index === 0 ? undefined : "lazy"} />
              {(photo.title || photo.caption) && (
                <figcaption>
                  {photo.title && <strong>{photo.title}</strong>}
                  {photo.caption && <span>{photo.caption}</span>}
                </figcaption>
              )}
              {index === visible.length - 1 && hidden.length > 0 && (
                <span className="dv-gallery-more" aria-hidden="true">
                  <CameraIcon /> +{hidden.length}
                </span>
              )}
            </figure>
          ))}
          {hidden.map((photo, index) => (
            <div key={photo.url} hidden>
              <Image src={photo.url} alt={altOf(photo, name, VISIBLE + index)} loading="lazy" />
            </div>
          ))}
        </div>
      </Image.PreviewGroup>
    </>
  );
}
