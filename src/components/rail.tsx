"use client";

import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { useEffect, useRef, useState, type ReactNode } from "react";

/** A horizontally scrolling row of cards with previous/next buttons on devices that hover. */
export function Rail({ label, children }: { label: string; children: ReactNode }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ atStart: true, atEnd: false });

  useEffect(() => {
    const track = trackRef.current;

    if (!track) {
      return;
    }

    const update = () =>
      setEdges({
        atStart: track.scrollLeft <= 4,
        atEnd: track.scrollLeft + track.clientWidth >= track.scrollWidth - 4,
      });

    const observer = new ResizeObserver(update);
    observer.observe(track);
    track.addEventListener("scroll", update, { passive: true });

    return () => {
      observer.disconnect();
      track.removeEventListener("scroll", update);
    };
  }, []);

  function scroll(direction: 1 | -1) {
    const track = trackRef.current;

    if (!track) {
      return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollBy({ left: direction * track.clientWidth * 0.9, behavior: reduceMotion ? "auto" : "smooth" });
  }

  return (
    <div className="rail">
      <div ref={trackRef} className="rail-track" role="region" aria-label={label} tabIndex={0}>
        {children}
      </div>
      <button type="button" className="rail-arrow prev" aria-label={`Scroll ${label} back`} disabled={edges.atStart} onClick={() => scroll(-1)}>
        <LeftOutlined />
      </button>
      <button type="button" className="rail-arrow next" aria-label={`Scroll ${label} forward`} disabled={edges.atEnd} onClick={() => scroll(1)}>
        <RightOutlined />
      </button>
    </div>
  );
}
