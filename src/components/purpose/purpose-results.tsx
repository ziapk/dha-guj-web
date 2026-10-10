"use client";

import { useState } from "react";
import { ChevronDownIcon } from "@/components/icons";
import { ListingRowCard, ownerOf } from "@/components/listing-row-card";
import { purposeHref } from "@/lib/purpose-search";
import type { Paginated, PropertyPurpose, PublicProperty } from "@/types/api";

/**
 * The listings on /buy and /rent. The server renders the first page; "Load more" appends the next ones in place.
 * The button is also a real link to the next page, so crawlers and visitors without JavaScript can page through.
 */
export function PurposeResults({
  initial,
  path,
  purpose,
  filters,
}: {
  initial: Paginated<PublicProperty>;
  path: string;
  purpose: PropertyPurpose;
  filters: Record<string, string>;
}) {
  const [properties, setProperties] = useState(initial.data);
  const [page, setPage] = useState(initial.meta.current_page);
  const [lastPage, setLastPage] = useState(initial.meta.last_page);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const nextFilters = { ...filters, page: String(page + 1) };

  async function loadMore(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setLoading(true);
    setFailed(false);

    try {
      const response = await fetch(`/api/properties?${new URLSearchParams({ ...nextFilters, purpose }).toString()}`);

      if (!response.ok) {
        throw new Error("Could not load properties.");
      }

      const result = (await response.json()) as Paginated<PublicProperty>;
      // A listing can move between pages while the visitor reads (a refresh bumps it up), so skip ones already shown.
      setProperties((current) => {
        const shown = new Set(current.map((property) => property.id));

        return [...current, ...result.data.filter((property) => !shown.has(property.id))];
      });
      setPage(result.meta.current_page);
      setLastPage(result.meta.last_page);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="listing-row-list">
        {properties.map((property, index) => (
          <ListingRowCard key={property.id} property={property} owner={ownerOf(property)} priority={index < 2} />
        ))}
      </div>

      {page < lastPage && (
        <div className="purpose-more">
          <a href={purposeHref(path, nextFilters)} className="purpose-more-button" onClick={loadMore} aria-busy={loading}>
            {loading ? "Loading…" : "Load More Properties"}
            <span className="purpose-more-icon" aria-hidden="true">
              <ChevronDownIcon />
            </span>
          </a>
          {failed && (
            <p className="purpose-more-error" role="alert">
              Could not load more properties. Please try again.
            </p>
          )}
        </div>
      )}
    </>
  );
}
