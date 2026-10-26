"use client";

import { Image } from "antd";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { ArrowLeftIcon, CameraIcon, ChevronLeftIcon, ChevronRightIcon, CloseIcon, ExpandIcon, HomeIcon } from "@/components/icons";
import { galleryPhotoAlt } from "@/lib/alt-text";
import { mediumUrl, thumbnailUrl, type Photo } from "@/lib/property";

/**
 * A listing's photos, OLX-style, on every screen size: one large stage that shows the whole photo (never cropped,
 * the empty sides filled with a blurred copy of it), arrows and a counter, and a strip of thumbnails under it.
 * Swiping works on touch screens, the arrow keys on desktop. Clicking the photo opens a grid of every photo, and a photo
 * in the grid opens the lightbox; the expand button goes straight to the lightbox.
 * A single photo gets the stage alone, without arrows, counter or thumbnails.
 * The stage and lightbox use the medium (≈1280px) copy, which carries the site watermark; the original is never shown.
 * Every photo (stage, thumbnails, grid, lightbox) carries its saved alt text; thumbnail buttons are still named
 * "Show photo N" by aria-label.
 */
export function ListingGallery({ photos, title }: { photos: Photo[]; title: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [preview, setPreview] = useState<{ open: boolean; current: number }>({ open: false, current: 0 });
  const [gridOpen, setGridOpen] = useState(false);
  const many = photos.length > 1;
  const altOf = (photo: Photo, photoIndex: number) => galleryPhotoAlt(photo.alt_text, title, photoIndex, photos.length);

  /** While the grid is open: no page scrolling behind it, and the photo it was opened on in view. */
  useEffect(() => {
    if (!gridOpen) {
      return;
    }

    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.getElementById(`lgallery-grid-${index}`)?.scrollIntoView({ block: "center" });

    return () => {
      document.body.style.overflow = overflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- scroll to the photo the grid was opened on, not every later one
  }, [gridOpen]);

  /** Escape closes the grid, unless the lightbox is open on top of it (that Escape is the lightbox's). */
  useEffect(() => {
    if (!gridOpen || preview.open) {
      return;
    }

    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setGridOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [gridOpen, preview.open]);

  /** Keep the current thumbnail in view without scrolling the page. */
  useEffect(() => {
    const strip = thumbsRef.current;
    const thumb = strip?.children[index] as HTMLElement | undefined;

    if (!strip || !thumb) {
      return;
    }

    if (thumb.offsetLeft < strip.scrollLeft) {
      strip.scrollTo({ left: thumb.offsetLeft, behavior: "smooth" });
    } else if (thumb.offsetLeft + thumb.offsetWidth > strip.scrollLeft + strip.clientWidth) {
      strip.scrollTo({ left: thumb.offsetLeft + thumb.offsetWidth - strip.clientWidth, behavior: "smooth" });
    }
  }, [index]);

  if (photos.length === 0) {
    return (
      <div className="gallery-empty">
        <HomeIcon className="placeholder-icon" />
      </div>
    );
  }

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

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      goTo(index + (event.key === "ArrowLeft" ? -1 : 1));
    }
  }

  const openPreview = (current: number) => setPreview({ open: true, current });

  return (
    <div className={`lgallery${many ? "" : " is-single"}`}>
      <div className="lgallery-stage" onKeyDown={many ? onKeyDown : undefined}>
        <div className="lgallery-track" ref={trackRef} onScroll={onScroll}>
          {photos.map((photo, photoIndex) => (
            <button key={photo.id} type="button" className="lgallery-slide" aria-label={`${altOf(photo, photoIndex)} — view all ${photos.length} photos`} onClick={() => setGridOpen(true)}>
              {/* eslint-disable-next-line @next/next/no-img-element -- the blurred fill behind a photo that doesn't match the stage's shape */}
              <img className="lgallery-backdrop" src={thumbnailUrl(photo)} alt="" aria-hidden="true" loading={photoIndex === 0 ? "eager" : "lazy"} />
              {/* eslint-disable-next-line @next/next/no-img-element -- watermarked copies straight from the API */}
              <img
                className="lgallery-photo"
                src={mediumUrl(photo)}
                alt={altOf(photo, photoIndex)}
                loading={photoIndex === 0 ? "eager" : "lazy"}
                fetchPriority={photoIndex === 0 ? "high" : undefined}
              />
            </button>
          ))}
        </div>

        {many && (
          <>
            <span className="lgallery-counter">
              <CameraIcon /> {index + 1} / {photos.length}
            </span>
            <button type="button" className="lgallery-arrow is-prev" aria-label="Previous photo" onClick={() => goTo(index - 1)}>
              <ChevronLeftIcon />
            </button>
            <button type="button" className="lgallery-arrow is-next" aria-label="Next photo" onClick={() => goTo(index + 1)}>
              <ChevronRightIcon />
            </button>
          </>
        )}

        <button type="button" className="lgallery-expand" aria-label="View photos full screen" onClick={() => openPreview(index)}>
          <ExpandIcon />
        </button>
      </div>

      {many && (
        <div className="lgallery-thumbs" ref={thumbsRef}>
          {photos.map((photo, photoIndex) => (
            <button
              key={photo.id}
              type="button"
              className={`lgallery-thumb${photoIndex === index ? " is-active" : ""}`}
              aria-label={`Show photo ${photoIndex + 1}`}
              aria-current={photoIndex === index ? "true" : undefined}
              onClick={() => goTo(photoIndex)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumbnailUrl(photo)} alt={altOf(photo, photoIndex)} loading="lazy" />
            </button>
          ))}
        </div>
      )}

      {gridOpen &&
        createPortal(
          <div className="lgallery-grid" role="dialog" aria-modal="true" aria-label={`${title} — all photos`}>
            <div className="lgallery-grid-head">
              <button type="button" className="lgallery-grid-close" aria-label="Back to listing" onClick={() => setGridOpen(false)}>
                <ArrowLeftIcon />
              </button>
              <div className="lgallery-grid-title">
                <strong>{title}</strong>
                <span>
                  <CameraIcon /> {photos.length} {photos.length === 1 ? "photo" : "photos"}
                </span>
              </div>
              <button type="button" className="lgallery-grid-close" aria-label="Close" onClick={() => setGridOpen(false)}>
                <CloseIcon />
              </button>
            </div>
            <div className="lgallery-grid-body">
              {photos.map((photo, photoIndex) => (
                <button
                  key={photo.id}
                  id={`lgallery-grid-${photoIndex}`}
                  type="button"
                  className="lgallery-grid-item"
                  aria-label={`Open photo ${photoIndex + 1} of ${photos.length}`}
                  onClick={() => openPreview(photoIndex)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={thumbnailUrl(photo)} alt={altOf(photo, photoIndex)} loading="lazy" />
                </button>
              ))}
            </div>
          </div>,
          document.body,
        )}

      <Image.PreviewGroup
        items={photos.map((photo, photoIndex) => ({ src: mediumUrl(photo), alt: altOf(photo, photoIndex) }))}
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
