"use client";

import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { Children, useEffect, useRef, useState, type ReactNode } from "react";

/**
 * A horizontally scrolling row of cards with previous/next buttons on devices that hover.
 * With `dots`, small screens get a dot per card instead, marking the one in view.
 */
export function Rail({ label, children, dots = false }: { label: string; children: ReactNode; dots?: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ atStart: true, atEnd: false });
  const [active, setActive] = useState(0);
  const count = Children.count(children);

  useEffect(() => {
    const track = trackRef.current;

    if (!track) {
      return;
    }

    const update = () => {
      setEdges({
        atStart: track.scrollLeft <= 4,
        atEnd: track.scrollLeft + track.clientWidth >= track.scrollWidth - 4,
      });

      const first = track.firstElementChild as HTMLElement | null;
      const second = first?.nextElementSibling as HTMLElement | null;
      const step = first && second ? second.offsetLeft - first.offsetLeft : 0;

      if (step > 0) {
        setActive(track.scrollLeft + track.clientWidth >= track.scrollWidth - 4 ? count - 1 : Math.round(track.scrollLeft / step));
      }
    };

    const observer = new ResizeObserver(update);
    observer.observe(track);
    track.addEventListener("scroll", update, { passive: true });

    return () => {
      observer.disconnect();
      track.removeEventListener("scroll", update);
    };
  }, [count]);

  function reduceMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function scroll(direction: 1 | -1) {
    const track = trackRef.current;

    if (!track) {
      return;
    }

    track.scrollBy({ left: direction * track.clientWidth * 0.9, behavior: reduceMotion() ? "auto" : "smooth" });
  }

  function scrollTo(index: number) {
    const track = trackRef.current;
    const card = track?.children[index] as HTMLElement | undefined;

    if (track && card) {
      track.scrollTo({ left: card.offsetLeft - (track.firstElementChild as HTMLElement).offsetLeft, behavior: reduceMotion() ? "auto" : "smooth" });
    }
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
      {dots && count > 1 && (
        <div className="rail-dots">
          {Array.from({ length: count }, (_, index) => (
            <button key={index} type="button" className={index === active ? "is-active" : undefined} aria-label={`Show item ${index + 1} of ${count}`} aria-current={index === active} onClick={() => scrollTo(index)} />
          ))}
        </div>
      )}
    </div>
  );
}
