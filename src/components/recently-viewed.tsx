"use client";

import { useEffect } from "react";
import { PropertyCard } from "@/components/property-card";
import { Rail } from "@/components/rail";
import { recentlyViewedStore } from "@/lib/id-store";
import { useListingsByIds } from "@/lib/use-listings";

/** Remembers an opened listing in this browser (latest first, no duplicates, at most 10). */
export function RecordRecentlyViewed({ propertyId }: { propertyId: number }) {
  useEffect(() => {
    recentlyViewedStore.write([propertyId, ...recentlyViewedStore.read().filter((id) => id !== propertyId)]);
  }, [propertyId]);

  return null;
}

/** "Recently viewed" rail from this browser's history; renders nothing when empty or when the listings cannot load. */
export function RecentlyViewed({ excludeId, className = "section" }: { excludeId?: number; className?: string }) {
  const ids = recentlyViewedStore.useIds().filter((id) => id !== excludeId);
  const listings = useListingsByIds(ids);
  const items = listings.data ?? [];

  if (ids.length === 0 || items.length === 0) {
    return null;
  }

  return (
    <section className={className} aria-labelledby="recently-viewed-heading">
      <div className="container">
        <div className="section-head">
          <div>
            <h2 id="recently-viewed-heading">Recently viewed</h2>
            <p>Pick up where you left off</p>
          </div>
          <button type="button" className="link-button" onClick={() => recentlyViewedStore.write([])}>
            Clear history
          </button>
        </div>
        <Rail label="Recently viewed properties">
          {items.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </Rail>
      </div>
    </section>
  );
}
