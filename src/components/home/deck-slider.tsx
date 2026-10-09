"use client";

import Image from "next/image";
import { Fragment, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/icons";

/** How many items wait behind the front card. Slots past this are not drawn. */
const PEEK_SLOTS = 3;

/** Must outlast the crossfade in globals.css, or the outgoing card is cut off mid-fade. */
const CROSSFADE_MS = 460;

export type DeckCardState = "entering" | "leaving";

/**
 * A deck slider: the selected item fills the front card and the next few fan out behind it to the
 * right, each one stepped down and veiled a little more blue to read as depth. Changing item
 * crossfades — the outgoing card stays put and fades while the incoming one scales up underneath
 * it, so the panel background never shows through the swap.
 *
 * Shared by the home page's featured projects and the developers directory's featured companies;
 * `renderFront` draws the big card (an `article.project-hero-card is-{state}`).
 */
export function DeckSlider<T extends { id: number }>({
  items,
  noun,
  nameOf,
  renderFront,
  peekCoverOf,
  peekBadgeOf,
}: {
  items: T[];
  /** Used in the arrow labels, e.g. "project" → "Previous project". */
  noun: string;
  nameOf: (item: T) => string;
  renderFront: (item: T, state: DeckCardState) => ReactNode;
  peekCoverOf: (item: T) => string | null | undefined;
  peekBadgeOf: (item: T) => ReactNode;
}) {
  const [index, setIndex] = useState(0);
  const [leaving, setLeaving] = useState<T | null>(null);
  const active = items[index];

  // Retire the outgoing card once its fade has finished.
  useEffect(() => {
    if (!leaving) {
      return;
    }

    const timer = setTimeout(() => setLeaving(null), CROSSFADE_MS);

    return () => clearTimeout(timer);
  }, [leaving]);

  if (!active) {
    return null;
  }

  function show(next: number) {
    if (next === index) {
      return;
    }

    // With reduced motion there is no fade to cover the swap, so nothing is kept behind.
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    setLeaving(reduceMotion ? null : items[index]);
    setIndex(next);
  }

  const step = (direction: 1 | -1) => show((index + direction + items.length) % items.length);
  /** The items queued behind the front card, nearest first. */
  const behind = Array.from({ length: Math.min(PEEK_SLOTS, items.length - 1) }, (_, offset) => ({
    item: items[(index + offset + 1) % items.length],
    slot: offset + 1,
  }));

  return (
    <div className="project-showcase">
      {/* The deck only reserves room to its right for the cards it actually has. */}
      <div className="project-stack" style={{ "--peeks": behind.length } as CSSProperties}>
        <div className="project-front">
          {/* Keyed by item so the two cards are distinct elements and can animate past each other. */}
          <Fragment key={active.id}>{renderFront(active, "entering")}</Fragment>
          {leaving && <Fragment key={`leaving-${leaving.id}`}>{renderFront(leaving, "leaving")}</Fragment>}
        </div>

        {/* Keyed by slot, not by item: the cards stay mounted and only swap their photo, so the
            deck shifts without each one blinking through its own background first. */}
        {behind.map(({ item, slot }) => {
          const peekCover = peekCoverOf(item);

          return (
            <button key={slot} type="button" className="project-peek" data-slot={slot} onClick={() => show((index + slot) % items.length)} aria-label={`Show ${nameOf(item)}`}>
              {peekCover && <Image src={peekCover} alt="" fill sizes="210px" style={{ objectFit: "cover" }} />}
              <span className="project-peek-badge">{peekBadgeOf(item)}</span>
            </button>
          );
        })}

        {items.length > 1 && (
          <>
            <button type="button" className="project-arrow prev" onClick={() => step(-1)} aria-label={`Previous ${noun}`}>
              <ArrowLeftIcon className="icon" />
            </button>
            <button type="button" className="project-arrow next" onClick={() => step(1)} aria-label={`Next ${noun}`}>
              <ArrowRightIcon className="icon" />
            </button>
          </>
        )}
      </div>

      {items.length > 1 && (
        <div className="project-dots">
          {items.map((item, dot) => (
            <button
              key={item.id}
              type="button"
              aria-label={nameOf(item)}
              aria-current={dot === index ? "true" : undefined}
              className={dot === index ? "is-active" : undefined}
              onClick={() => show(dot)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
