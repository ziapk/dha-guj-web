"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { CameraIcon, ChevronLeftIcon, ChevronRightIcon, HomeIcon } from "@/components/icons";

const MAX_DOTS = 8;

/** A listing's photos with prev / next arrows and dots; the photo itself links to the listing. */
export function ListingPhotoSlider({
  photos,
  href,
  title,
  priority = false,
  children,
}: {
  photos: string[];
  href: string;
  title: string;
  /** Load the first photo eagerly: set it on the cards above the fold. */
  priority?: boolean;
  children?: React.ReactNode;
}) {
  const [index, setIndex] = useState(0);
  const count = photos.length;
  const step = (by: number) => setIndex((current) => (current + by + count) % count);

  return (
    <div className="listing-slider">
      <Link href={href} className="listing-slider-photo" tabIndex={-1} aria-hidden="true">
        {count > 0 ? (
          <Image src={photos[index]} alt={index === 0 ? title : `${title}, photo ${index + 1}`} fill sizes="(max-width: 760px) 100vw, 360px" loading={priority && index === 0 ? "eager" : undefined} fetchPriority={priority && index === 0 ? "high" : undefined} style={{ objectFit: "cover" }} />
        ) : (
          <HomeIcon className="placeholder-icon" />
        )}
      </Link>

      {children}

      {count > 1 && (
        <>
          <button type="button" className="listing-slider-arrow is-prev" onClick={() => step(-1)} aria-label="Previous photo">
            <ChevronLeftIcon />
          </button>
          <button type="button" className="listing-slider-arrow is-next" onClick={() => step(1)} aria-label="Next photo">
            <ChevronRightIcon />
          </button>
          <div className="listing-slider-dots" aria-hidden="true">
            {photos.slice(0, MAX_DOTS).map((photo, dot) => (
              <span key={photo} className={dot === Math.min(index, MAX_DOTS - 1) ? "is-active" : undefined} />
            ))}
          </div>
        </>
      )}

      {count > 0 && (
        <span className="listing-slider-count">
          <CameraIcon /> {count}
        </span>
      )}
    </div>
  );
}
