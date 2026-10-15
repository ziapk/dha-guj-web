"use client";

import { Image } from "antd";
import { useRef, useState } from "react";
import { CameraIcon, ChevronLeftIcon, ChevronRightIcon, ExpandIcon } from "@/components/icons";
import { mediumUrl, thumbnailUrl, type Photo } from "@/lib/property";

const THUMBS = 5;
const DOTS = 7;

/**
 * The phone version of a listing's photos: a swipeable slider with a counter, arrows and dots, and a thumbnail strip
 * under it whose last tile shows how many more photos there are. Every photo opens in the same lightbox as on desktop.
 */
export function ListingMobileGallery({ photos, title }: { photos: Photo[]; title: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [preview, setPreview] = useState<{ open: boolean; current: number }>({ open: false, current: 0 });
  const more = photos.length - THUMBS;

  function goTo(target: number) {
    const track = trackRef.current;

    if (!track) {
      return;
    }

    const next = (target + photos.length) % photos.length;
    track.scrollTo({ left: next * track.clientWidth, behavior: "smooth" });
  }

  function onScroll() {
    const track = trackRef.current;

    if (track && track.clientWidth > 0) {
      setIndex(Math.round(track.scrollLeft / track.clientWidth));
    }
  }

  const openPreview = (current: number) => setPreview({ open: true, current });

  /** A window of dots around the current photo, so 20 photos don't need 20 dots. */
  const dotStart = Math.min(Math.max(0, index - Math.floor(DOTS / 2)), Math.max(0, photos.length - DOTS));
  const dots = photos.slice(dotStart, dotStart + DOTS).map((_, offset) => dotStart + offset);

  return (
    <div className="mgallery">
      <div className="mgallery-stage">
        <div className="mgallery-track" ref={trackRef} onScroll={onScroll}>
          {photos.map((photo, photoIndex) => (
            <button key={photo.id} type="button" className="mgallery-slide" aria-label={`Open photo ${photoIndex + 1}`} onClick={() => openPreview(photoIndex)}>
              {/* eslint-disable-next-line @next/next/no-img-element -- same watermarked copies the desktop gallery uses */}
              <img src={mediumUrl(photo)} alt={`${title} — photo ${photoIndex + 1}`} loading={photoIndex === 0 ? "eager" : "lazy"} />
            </button>
          ))}
        </div>

        <span className="mgallery-counter">
          <CameraIcon /> {index + 1} / {photos.length}
        </span>

        {photos.length > 1 && (
          <>
            <button type="button" className="mgallery-arrow is-prev" aria-label="Previous photo" onClick={() => goTo(index - 1)}>
              <ChevronLeftIcon />
            </button>
            <button type="button" className="mgallery-arrow is-next" aria-label="Next photo" onClick={() => goTo(index + 1)}>
              <ChevronRightIcon />
            </button>
            <span className="mgallery-dots" aria-hidden="true">
              {dots.map((dot) => (
                <i key={dot} className={dot === index ? "is-active" : undefined} />
              ))}
            </span>
          </>
        )}

        <button type="button" className="mgallery-expand" aria-label="View photos full screen" onClick={() => openPreview(index)}>
          <ExpandIcon />
        </button>
      </div>

      {photos.length > 1 && (
        <div className="mgallery-thumbs">
          {photos.slice(0, THUMBS).map((photo, photoIndex) => {
            const isMore = photoIndex === THUMBS - 1 && more > 0;

            return (
              <button
                key={photo.id}
                type="button"
                className={`mgallery-thumb${photoIndex === index ? " is-active" : ""}`}
                aria-label={isMore ? `View all ${photos.length} photos` : `Show photo ${photoIndex + 1}`}
                onClick={() => (isMore ? openPreview(photoIndex) : goTo(photoIndex))}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={thumbnailUrl(photo)} alt="" />
                {isMore && <span>+{more + 1}</span>}
              </button>
            );
          })}
        </div>
      )}

      <Image.PreviewGroup
        items={photos.map((photo) => mediumUrl(photo))}
        preview={{
          open: preview.open,
          current: preview.current,
          onOpenChange: (open) => setPreview((state) => ({ ...state, open })),
          onChange: (current) => setPreview((state) => ({ ...state, current })),
        }}
      />
    </div>
  );
}
