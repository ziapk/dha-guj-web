"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { SectionHeading } from "@/components/home/section-heading";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/icons";

/** Where the previous/next buttons sit: floating over the sides, or next to the heading. */
type ArrowPlacement = "side" | "head";

/** How far the track has scrolled, counted in whole pages (one page = one visible width). */
type Position = { page: number; pages: number };

/** Sub-pixel slack, so a track that exactly fills its box is not counted as two pages. */
const SLACK = 4;

export function Carousel({
  eyebrow,
  title,
  highlight,
  subtitle,
  action,
  label,
  arrows = "side",
  dots = false,
  paged = false,
  children,
}: {
  eyebrow?: string;
  title: string;
  highlight?: string;
  subtitle?: string;
  /** The "View all …" pill, rendered beside the heading. */
  action?: ReactNode;
  /** Names the scrollable region for screen readers, e.g. "Our agents". */
  label: string;
  arrows?: ArrowPlacement;
  dots?: boolean;
  /** True when each child is a full-width page of cards rather than a single card. */
  paged?: boolean;
  children: ReactNode;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [{ page, pages }, setPosition] = useState<Position>({ page: 0, pages: 1 });

  useEffect(() => {
    const track = trackRef.current;

    if (!track) {
      return;
    }

    const read = () => {
      const width = track.clientWidth;

      if (width === 0) {
        return;
      }

      const total = Math.max(1, Math.ceil((track.scrollWidth - SLACK) / width));
      const maxScroll = track.scrollWidth - width;
      // Read the page from how far along the scroll range we are, not from scrollLeft / width:
      // the last page is usually a part-page, so stepping by whole widths never reaches it.
      const current = maxScroll <= SLACK ? 0 : Math.round((track.scrollLeft / maxScroll) * (total - 1));

      setPosition((previous) => (previous.page === current && previous.pages === total ? previous : { page: current, pages: total }));
    };

    read();

    // The track's own box changes with the viewport; its children change as images and fonts land.
    const observer = new ResizeObserver(read);
    observer.observe(track);

    for (const child of track.children) {
      observer.observe(child);
    }

    track.addEventListener("scroll", read, { passive: true });

    return () => {
      observer.disconnect();
      track.removeEventListener("scroll", read);
    };
  }, []);

  function goTo(next: number) {
    const track = trackRef.current;

    if (!track) {
      return;
    }

    const target = Math.min(pages - 1, Math.max(0, next));
    const maxScroll = track.scrollWidth - track.clientWidth;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Spread the pages over the scroll range so the last one lands exactly at the end.
    const left = pages > 1 ? (target / (pages - 1)) * maxScroll : 0;

    track.scrollTo({ left, behavior: reduceMotion ? "auto" : "smooth" });
    // Light the new page up straight away rather than waiting for the scroll to settle; the
    // listener above keeps things right when the reader swipes the track themselves instead.
    setPosition((previous) => ({ ...previous, page: target }));
  }

  // One page means everything already fits, so the controls would do nothing.
  const showControls = pages > 1;

  const prev = (
    <button type="button" className="carousel-arrow prev" aria-label={`Previous ${label.toLowerCase()}`} disabled={page === 0} onClick={() => goTo(page - 1)}>
      <ArrowLeftIcon className="icon" />
    </button>
  );

  const next = (
    <button type="button" className="carousel-arrow next" aria-label={`More ${label.toLowerCase()}`} disabled={page >= pages - 1} onClick={() => goTo(page + 1)}>
      <ArrowRightIcon className="icon" />
    </button>
  );

  return (
    <>
      <SectionHeading eyebrow={eyebrow} title={title} highlight={highlight} subtitle={subtitle}>
        {(action || (arrows === "head" && showControls)) && (
          <>
            {action}
            {arrows === "head" && showControls && (
              <span className="carousel-head-arrows">
                {prev}
                {next}
              </span>
            )}
          </>
        )}
      </SectionHeading>

      <div className={`carousel${arrows === "side" ? " has-side-arrows" : ""}`}>
        <div ref={trackRef} className={`carousel-track${paged ? " is-paged" : ""}`} role="region" aria-label={label} tabIndex={0}>
          {children}
        </div>
        {arrows === "side" && showControls && (
          <>
            {prev}
            {next}
          </>
        )}
      </div>

      {dots && showControls && (
        <div className="carousel-dots">
          {Array.from({ length: pages }, (_, dot) => (
            <button
              key={dot}
              type="button"
              className={dot === page ? "is-active" : undefined}
              aria-label={`Go to ${label.toLowerCase()} page ${dot + 1} of ${pages}`}
              aria-current={dot === page ? "true" : undefined}
              onClick={() => goTo(dot)}
            />
          ))}
        </div>
      )}
    </>
  );
}
