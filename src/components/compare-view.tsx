"use client";

import { CloseOutlined } from "@ant-design/icons";
import { Skeleton } from "antd";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { HomeIcon } from "@/components/icons";
import { compareStore } from "@/lib/id-store";
import { FURNISHED_LABELS, PROPERTY_PURPOSE_LABELS, formatArea, formatCompactPrice, formatPrice } from "@/lib/labels";
import { coverOf, locationOf, thumbnailUrl } from "@/lib/property";
import { useListingsByIds } from "@/lib/use-listings";
import type { PublicProperty } from "@/types/api";

type Row = { label: string; value: (property: PublicProperty) => ReactNode };

const yesNo = (value: boolean | undefined) => (value ? "Yes" : "No");

const ROWS: Row[] = [
  {
    label: "Price",
    value: (property) => (
      <>
        <strong>{formatCompactPrice(property.price)}</strong>
        {property.purpose === "rent" ? " / month" : ""}
        <br />
        <small>
          {formatPrice(property.price)}
          {property.is_negotiable ? " · negotiable" : ""}
        </small>
      </>
    ),
  },
  { label: "Purpose", value: (property) => PROPERTY_PURPOSE_LABELS[property.purpose] },
  { label: "Type", value: (property) => property.property_type?.name ?? "—" },
  { label: "Area", value: (property) => formatArea(property.area_size, property.area_unit) },
  { label: "Bedrooms", value: (property) => (property.property_type?.category === "plot" ? "—" : (property.bedrooms ?? "—")) },
  { label: "Bathrooms", value: (property) => (property.property_type?.category === "plot" ? "—" : (property.bathrooms ?? "—")) },
  { label: "Sector", value: (property) => property.sector ?? "—" },
  { label: "Block", value: (property) => property.block ?? "—" },
  { label: "Location", value: (property) => [property.block, property.sector, property.phase, locationOf(property)].filter(Boolean).join(", ") || "—" },
  { label: "Furnishing", value: (property) => (property.furnished ? FURNISHED_LABELS[property.furnished] : "—") },
  { label: "Installments", value: (property) => yesNo(property.installment_available) },
  {
    label: "Amenities",
    value: (property) =>
      (property.amenities ?? []).length > 0 ? (
        <ul className="compare-amenities">
          {property.amenities?.map((amenity) => (
            <li key={amenity.id}>{amenity.name}</li>
          ))}
        </ul>
      ) : (
        "—"
      ),
  },
  { label: "Featured", value: (property) => yesNo(property.is_featured) },
  { label: "Hot", value: (property) => yesNo(property.is_hot) },
];

const subscribeNothing = () => () => undefined;

export function CompareView() {
  const ids = compareStore.useIds();
  // localStorage is only readable after hydration; until then show a skeleton instead of the empty state.
  const hydrated = useSyncExternalStore(subscribeNothing, () => true, () => false);
  const listings = useListingsByIds(ids, { details: true });
  const loaded = listings.data;
  const items = loaded ?? [];

  // Forget listings that are no longer live (sold, expired or removed).
  useEffect(() => {
    if (loaded && loaded.length < ids.length) {
      compareStore.write(loaded.map((property) => property.id));
    }
  }, [loaded, ids.length]);

  if (!hydrated || (ids.length > 0 && listings.isLoading)) {
    return <Skeleton active paragraph={{ rows: 8 }} />;
  }

  if (listings.isError) {
    return (
      <div className="empty-results">
        <h2>Could not load your comparison</h2>
        <p>Please check your connection and try again.</p>
        <button type="button" className="btn btn-primary" onClick={() => listings.refetch()}>
          Try again
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="empty-results">
        <div style={{ fontSize: 44 }}>⚖️</div>
        <h2>Nothing to compare yet</h2>
        <p>Press “Compare” on up to three listings to see them side by side.</p>
        <Link className="btn btn-primary" href="/properties">
          Browse properties
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="compare-table-wrap" role="region" aria-label="Comparison table" tabIndex={0}>
        <table className="compare-table">
          <caption className="sr-only">Side-by-side comparison of {items.length} properties</caption>
          <thead>
            <tr>
              <td />
              {items.map((property) => {
                const cover = coverOf(property);

                return (
                  <th key={property.id} scope="col">
                    <div className="compare-head">
                      <div className="compare-cover">
                        {cover ? <Image src={thumbnailUrl(cover)} alt="" fill sizes="280px" style={{ objectFit: "cover" }} /> : <HomeIcon className="placeholder-icon" />}
                        <button type="button" className="compare-remove" aria-label={`Remove ${property.title} from compare`} onClick={() => compareStore.remove(property.id)}>
                          <CloseOutlined />
                        </button>
                      </div>
                      <Link href={`/properties/${property.slug}`} className="compare-title">
                        {property.title}
                      </Link>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                {items.map((property) => (
                  <td key={property.id}>{row.value(property)}</td>
                ))}
              </tr>
            ))}
            <tr>
              <th scope="row">Listing</th>
              {items.map((property) => (
                <td key={property.id}>
                  <Link href={`/properties/${property.slug}`} className="btn btn-outline">
                    View details
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <div className="compare-footer">
        {items.length < 3 && (
          <Link href="/properties" className="btn btn-outline">
            Add another property
          </Link>
        )}
        <button type="button" className="link-button" onClick={() => compareStore.write([])}>
          Clear comparison
        </button>
      </div>
    </>
  );
}
