"use client";

import { Image as Lightbox } from "antd";
import Image from "next/image";
import { useState } from "react";
import { CameraIcon } from "@/components/icons";
import { Rail } from "@/components/rail";

export type ConstructionUpdateCard = {
  id: number | string;
  title: string;
  label: string | null;
  caption: string | null;
  image: string | null;
  alt: string;
  featured: boolean;
  /** Every picture of the update (featured image first) for the lightbox. */
  images: string[];
};

/**
 * The construction update cards in a horizontal rail. A card opens its pictures in the site's lightbox;
 * "View all images" goes to the admin's link or, without one, opens every update picture in the lightbox.
 */
export function ConstructionUpdates({ updates, viewAll }: { updates: ConstructionUpdateCard[]; viewAll: { text: string; url: string | null } | null }) {
  const [preview, setPreview] = useState<{ items: string[]; current: number; open: boolean }>({ items: [], current: 0, open: false });
  const allImages = [...new Set(updates.flatMap((update) => update.images))];

  function open(items: string[]) {
    if (items.length > 0) {
      setPreview({ items, current: 0, open: true });
    }
  }

  return (
    <>
      <Rail label="Construction updates">
        {updates.map((update) => (
          <article key={update.id} className="pj-cupdate">
            <button type="button" className="pj-cupdate-media" onClick={() => open(update.images)} disabled={update.images.length === 0} aria-label={`View photos: ${update.title}`}>
              {update.image ? (
                <Image src={update.image} alt={update.alt} fill sizes="(max-width: 560px) 82vw, 240px" style={{ objectFit: "cover" }} />
              ) : (
                <CameraIcon />
              )}
              {update.label && <span className="pj-cupdate-label">{update.label}</span>}
              {update.featured && <span className="badge badge-featured pj-cupdate-tag">Featured</span>}
              {update.images.length > 1 && (
                <span className="pj-cupdate-count">
                  <CameraIcon /> {update.images.length}
                </span>
              )}
            </button>
            <div className="pj-cupdate-body">
              <strong>{update.title}</strong>
              {update.caption && <small>{update.caption}</small>}
            </div>
          </article>
        ))}
      </Rail>

      {viewAll &&
        (viewAll.url ? (
          <div className="pj-cupdate-all">
            <a className="btn btn-outline" href={viewAll.url}>
              {viewAll.text}
            </a>
          </div>
        ) : (
          allImages.length > 0 && (
            <div className="pj-cupdate-all">
              <button type="button" className="btn btn-outline" onClick={() => open(allImages)}>
                <CameraIcon /> {viewAll.text} ({allImages.length})
              </button>
            </div>
          )
        ))}

      {preview.items.length > 0 && (
        <Lightbox.PreviewGroup
          items={preview.items}
          preview={{
            open: preview.open,
            current: preview.current,
            onOpenChange: (value) => setPreview((state) => ({ ...state, open: value })),
            onChange: (current) => setPreview((state) => ({ ...state, current })),
          }}
        />
      )}
    </>
  );
}
