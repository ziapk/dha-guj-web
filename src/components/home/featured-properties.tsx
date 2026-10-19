"use client";

import { useState } from "react";
import { Carousel } from "@/components/home/carousel";
import { PropertyCard } from "@/components/property-card";
import type { PublicProperty } from "@/types/api";

type Filter = { key: string; label: string; matches: (property: PublicProperty) => boolean };

/** The chips over the row on a phone (home-page-responsive.png); a chip with nothing behind it is left out. */
const FILTERS: Filter[] = [
  { key: "all", label: "All", matches: () => true },
  { key: "sale", label: "For Sale", matches: (property) => property.purpose === "sale" },
  { key: "rent", label: "For Rent", matches: (property) => property.purpose === "rent" },
  { key: "residential", label: "Residential", matches: (property) => property.property_type?.category === "residential" },
  { key: "commercial", label: "Commercial", matches: (property) => property.property_type?.category === "commercial" },
];

function chunk<T>(items: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, page) => items.slice(page * size, page * size + size));
}

/** The home page's "Featured Properties" carousel, one block of cards per page. */
export function FeaturedProperties({ properties, perPage }: { properties: PublicProperty[]; perPage: number }) {
  const [filterKey, setFilterKey] = useState("all");
  const filters = FILTERS.filter((filter) => filter.key === "all" || properties.some(filter.matches));
  const active = filters.find((filter) => filter.key === filterKey) ?? filters[0];
  const pages = chunk(properties.filter(active.matches), perPage);

  const chips =
    filters.length > 2 ? (
      <div className="home-chips" role="group" aria-label="Filter featured properties">
        {filters.map((filter) => (
          <button key={filter.key} type="button" className="home-chip" aria-pressed={filter.key === active.key} onClick={() => setFilterKey(filter.key)}>
            {filter.label}
          </button>
        ))}
      </div>
    ) : undefined;

  return (
    // Keyed by filter so the carousel counts its pages afresh for the new set of cards.
    <Carousel
      key={active.key}
      label="Featured properties"
      title="Featured"
      highlight="Properties"
      subtitle="Discover the best residential and commercial properties in DHA Gujranwala."
      toolbar={chips}
      arrows="head"
      paged
    >
      {pages.map((page, pageIndex) => (
        <div key={page[0].id} className="property-grid carousel-page">
          {page.map((property, index) => (
            <PropertyCard key={property.id} property={property} priority={pageIndex === 0 && index < 3} />
          ))}
        </div>
      ))}
    </Carousel>
  );
}
