"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";

/**
 * Clips its content to `collapsedHeight` with a fade and a "Show more" toggle.
 * The toggle only appears when the content is actually taller than that, so short content renders as-is.
 */
export function Expandable({ collapsedHeight, children }: { collapsedHeight: number; children: ReactNode }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const [overflowing, setOverflowing] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const content = contentRef.current;

    if (!content) {
      return;
    }

    const update = () => setOverflowing(content.scrollHeight > collapsedHeight + 24);
    const observer = new ResizeObserver(update);
    observer.observe(content);

    return () => observer.disconnect();
  }, [collapsedHeight]);

  const clipped = overflowing && !open;

  return (
    <div className={`pd-expandable${clipped ? " is-clipped" : ""}`}>
      <div id={id} ref={contentRef} className="pd-expandable-body" style={clipped ? ({ maxHeight: collapsedHeight } as CSSProperties) : undefined}>
        {children}
      </div>
      {overflowing && (
        <button type="button" className="pd-show-more" aria-expanded={open} aria-controls={id} onClick={() => setOpen((value) => !value)}>
          {open ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}
