"use client";

import { Image } from "antd";
import { CameraIcon } from "@/components/icons";

/** Photos shown on the page; the rest open from the last tile in the lightbox. */
const VISIBLE = 5;

/** A company's work gallery: one large photo, four stacked tiles, every photo in the lightbox. */
export function WorkGallery({ photos, name }: { photos: string[]; name: string }) {
  const visible = photos.slice(0, VISIBLE);
  const hidden = photos.slice(VISIBLE);

  return (
    <Image.PreviewGroup>
      <div className={`dv-gallery dv-gallery-${Math.min(visible.length, VISIBLE)}`}>
        {visible.map((photo, index) => (
          <div key={photo} className={`dv-gallery-item${index === 0 ? " dv-gallery-main" : ""}`}>
            <Image src={photo} alt={`${name} work photo ${index + 1}`} loading={index === 0 ? undefined : "lazy"} />
            {index === visible.length - 1 && hidden.length > 0 && (
              <span className="dv-gallery-more" aria-hidden="true">
                <CameraIcon /> +{hidden.length}
              </span>
            )}
          </div>
        ))}
        {hidden.map((photo, index) => (
          <div key={photo} hidden>
            <Image src={photo} alt={`${name} work photo ${VISIBLE + index + 1}`} loading="lazy" />
          </div>
        ))}
      </div>
    </Image.PreviewGroup>
  );
}
