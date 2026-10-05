"use client";

import { ZoomInOutlined, ZoomOutOutlined } from "@ant-design/icons";
import { useRef, useState, type PointerEvent } from "react";
import { ExpandIcon } from "@/components/icons";

const MIN = 1;
const MAX = 4;
const STEP = 0.5;

/** The master plan image with Zoom In / Zoom Out buttons; once zoomed in, it can be dragged around. */
export function MasterPlanViewer({ src, fullUrl, alt }: { src: string; fullUrl: string; alt: string }) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; startX: number; startY: number } | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  /** Keep the image covering the frame, so it can never be dragged off-screen. */
  function clamp(x: number, y: number, zoom: number) {
    const frame = frameRef.current;

    if (!frame) {
      return { x, y };
    }

    const maxX = ((zoom - 1) * frame.clientWidth) / 2;
    const maxY = ((zoom - 1) * frame.clientHeight) / 2;

    return { x: Math.max(-maxX, Math.min(maxX, x)), y: Math.max(-maxY, Math.min(maxY, y)) };
  }

  function zoom(direction: 1 | -1) {
    const next = Math.max(MIN, Math.min(MAX, scale + direction * STEP));
    setScale(next);
    setOffset((current) => clamp(current.x, current.y, next));
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (scale === 1) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: offset.x, y: offset.y, startX: event.clientX, startY: event.clientY };
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current) {
      return;
    }

    setOffset(clamp(drag.current.x + event.clientX - drag.current.startX, drag.current.y + event.clientY - drag.current.startY, scale));
  }

  return (
    <div
      ref={frameRef}
      className={`pj-plan-frame${scale > 1 ? " is-zoomed" : ""}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={() => (drag.current = null)}
      onPointerCancel={() => (drag.current = null)}
    >
      {/* A plain img: the transform needs the natural image, not next/image's wrapper. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} draggable={false} style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }} />

      <button type="button" className="pj-plan-btn pj-plan-zoom-in" onClick={() => zoom(1)} disabled={scale >= MAX}>
        <ZoomInOutlined /> Zoom In
      </button>
      <button type="button" className="pj-plan-btn pj-plan-zoom-out" onClick={() => zoom(-1)} disabled={scale <= MIN}>
        <ZoomOutOutlined /> Zoom Out
      </button>
      <a className="pj-plan-btn pj-plan-full" href={fullUrl} target="_blank" rel="noopener noreferrer">
        <ExpandIcon /> Full size
      </a>
    </div>
  );
}
