"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ExpandIcon, MinusIcon, PlusIcon, ResetIcon } from "@/components/icons";

const MIN_SCALE = 1;
const MAX_SCALE = 10;

type View = { scale: number; x: number; y: number };

/**
 * A zoomable, pannable map image: mouse wheel or the buttons to zoom, drag to move, pinch on touch screens,
 * double-click / double-tap to zoom in. The full-size original is loaded so fine print stays readable when zoomed.
 */
export function MapViewer({ src, alt }: { src: string; alt: string }) {
  const frame = useRef<HTMLDivElement>(null);
  const image = useRef<HTMLImageElement>(null);
  const view = useRef<View>({ scale: 1, x: 0, y: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ distance: number; scale: number } | null>(null);
  const [scale, setScale] = useState(1);
  const [loaded, setLoaded] = useState(false);

  const apply = useCallback((next: View) => {
    const box = frame.current;

    if (!box || !image.current) {
      return;
    }

    const scaleValue = Math.min(MAX_SCALE, Math.max(MIN_SCALE, next.scale));
    const { width, height } = box.getBoundingClientRect();
    // Keep the image covering the frame: no panning past its edges.
    const x = Math.min(0, Math.max(width - width * scaleValue, next.x));
    const y = Math.min(0, Math.max(height - height * scaleValue, next.y));
    view.current = { scale: scaleValue, x, y };
    image.current.style.transform = `translate(${x}px, ${y}px) scale(${scaleValue})`;
    setScale(scaleValue);
  }, []);

  /** Zoom to a new scale keeping the point under (px, py) — frame coordinates — still. */
  const zoomAt = useCallback(
    (nextScale: number, px?: number, py?: number) => {
      const box = frame.current?.getBoundingClientRect();

      if (!box) {
        return;
      }

      const { scale: current, x, y } = view.current;
      const target = Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScale));
      const cx = px ?? box.width / 2;
      const cy = py ?? box.height / 2;
      apply({ scale: target, x: cx - (cx - x) * (target / current), y: cy - (cy - y) * (target / current) });
    },
    [apply],
  );

  // Wheel zoom needs a non-passive listener to stop the page scrolling.
  useEffect(() => {
    const box = frame.current;

    if (!box) {
      return;
    }

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = box.getBoundingClientRect();
      zoomAt(view.current.scale * (event.deltaY < 0 ? 1.2 : 1 / 1.2), event.clientX - rect.left, event.clientY - rect.top);
    };

    box.addEventListener("wheel", onWheel, { passive: false });

    return () => box.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  const onPointerDown = (event: React.PointerEvent) => {
    frame.current?.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { distance: Math.hypot(a.x - b.x, a.y - b.y), scale: view.current.scale };
    }
  };

  const onPointerMove = (event: React.PointerEvent) => {
    const previous = pointers.current.get(event.pointerId);

    if (!previous) {
      return;
    }

    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const rect = frame.current!.getBoundingClientRect();
      zoomAt(pinch.current.scale * (Math.hypot(a.x - b.x, a.y - b.y) / pinch.current.distance), (a.x + b.x) / 2 - rect.left, (a.y + b.y) / 2 - rect.top);

      return;
    }

    apply({ ...view.current, x: view.current.x + event.clientX - previous.x, y: view.current.y + event.clientY - previous.y });
  };

  const onPointerUp = (event: React.PointerEvent) => {
    pointers.current.delete(event.pointerId);

    if (pointers.current.size < 2) {
      pinch.current = null;
    }
  };

  const fullscreen = () => {
    const box = frame.current?.parentElement;

    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void box?.requestFullscreen?.();
    }
  };

  // The frame changes size in and out of full screen; start again from the whole map.
  useEffect(() => {
    const reset = () => apply({ scale: 1, x: 0, y: 0 });
    document.addEventListener("fullscreenchange", reset);

    return () => document.removeEventListener("fullscreenchange", reset);
  }, [apply]);

  return (
    <div className="map-viewer">
      <div
        ref={frame}
        className={`map-viewer-frame${scale > 1 ? " is-zoomed" : ""}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={(event) => {
          const rect = frame.current!.getBoundingClientRect();
          zoomAt(view.current.scale * 2, event.clientX - rect.left, event.clientY - rect.top);
        }}
      >
        {!loaded && <div className="map-viewer-loading">Loading full-size map…</div>}
        {/* A plain img: the original file is needed for detail when zoomed, not a resized copy. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={image} src={src} alt={alt} draggable={false} onLoad={() => setLoaded(true)} />
      </div>

      <div className="map-viewer-controls" role="toolbar" aria-label="Map zoom">
        <button type="button" onClick={() => zoomAt(view.current.scale * 1.5)} disabled={scale >= MAX_SCALE} aria-label="Zoom in">
          <PlusIcon className="icon" />
        </button>
        <button type="button" onClick={() => zoomAt(view.current.scale / 1.5)} disabled={scale <= MIN_SCALE} aria-label="Zoom out">
          <MinusIcon className="icon" />
        </button>
        <button type="button" onClick={() => apply({ scale: 1, x: 0, y: 0 })} disabled={scale <= MIN_SCALE} aria-label="Show the whole map">
          <ResetIcon className="icon" />
        </button>
        <button type="button" onClick={fullscreen} aria-label="Full screen">
          <ExpandIcon className="icon" />
        </button>
        <span className="map-viewer-scale">{Math.round(scale * 100)}%</span>
      </div>
      <p className="map-viewer-hint">Scroll or pinch to zoom · drag to move · double-click to zoom in</p>
    </div>
  );
}
