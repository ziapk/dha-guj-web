"use client";

import { CloseOutlined } from "@ant-design/icons";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CompareIcon, HomeIcon } from "@/components/icons";
import { MAX_COMPARE, compareStore } from "@/lib/id-store";
import { formatCompactPrice } from "@/lib/labels";
import { coverOf, thumbnailUrl } from "@/lib/property";
import { useListingsByIds } from "@/lib/use-listings";

/** Sticky bar at the bottom of the window listing the properties picked for comparison. Hidden when nothing is picked. */
export function CompareTray() {
  const pathname = usePathname();
  const ids = compareStore.useIds();
  const listings = useListingsByIds(ids);

  if (ids.length === 0 || pathname === "/compare" || pathname.startsWith("/account")) {
    return null;
  }

  const byId = new Map((listings.data ?? []).map((property) => [property.id, property]));

  return (
    <section className="compare-tray" aria-label="Compare properties">
      <div className="container compare-tray-inner">
        <p className="compare-tray-title">
          <CompareIcon />
          <span>
            <strong>Compare</strong> {ids.length} of {MAX_COMPARE}
          </span>
        </p>
        <ul className="compare-tray-items">
          {ids.map((id) => {
            const property = byId.get(id);
            const cover = property ? coverOf(property) : undefined;

            return (
              <li key={id} className="compare-tray-item">
                <span className="compare-tray-thumb">
                  {cover ? <Image src={thumbnailUrl(cover)} alt="" fill sizes="44px" style={{ objectFit: "cover" }} /> : <HomeIcon />}
                </span>
                <span className="compare-tray-text">
                  <strong>{property ? formatCompactPrice(property.price) : listings.isLoading ? "Loading…" : "Unavailable"}</strong>
                  <small>{property?.title ?? `Listing #${id}`}</small>
                </span>
                <button type="button" className="compare-tray-remove" aria-label={`Remove ${property?.title ?? `listing #${id}`} from compare`} onClick={() => compareStore.remove(id)}>
                  <CloseOutlined />
                </button>
              </li>
            );
          })}
        </ul>
        <div className="compare-tray-actions">
          <button type="button" className="link-button" onClick={() => compareStore.write([])}>
            Clear
          </button>
          {ids.length > 1 ? (
            <Link href="/compare" className="btn btn-primary">
              Compare now
            </Link>
          ) : (
            <span className="compare-tray-hint">Add one more to compare</span>
          )}
        </div>
      </div>
    </section>
  );
}
