"use client";

import { useQuery } from "@tanstack/react-query";
import { Button, Empty, Skeleton } from "antd";
import Link from "next/link";
import { PropertyCard } from "@/components/property-card";
import { useSession } from "@/components/session-provider";
import { clientApi } from "@/lib/client-api";
import type { Paginated, PublicProperty } from "@/types/api";

export default function FavoritesPage() {
  const { user, isLoading, requireLogin } = useSession();

  const favorites = useQuery({
    queryKey: ["favorites"],
    queryFn: () => clientApi<Paginated<PublicProperty>>("portal/favorites"),
    enabled: Boolean(user),
  });

  if (!isLoading && !user) {
    return (
      <div className="container page-section">
        <Empty description="Log in to see your favourites">
          <Button type="primary" onClick={requireLogin}>
            Log in
          </Button>
        </Empty>
      </div>
    );
  }

  return (
    <div className="container page-section">
      <div className="section-head">
        <div>
          <h2>My favourites</h2>
          <p>{favorites.data ? `${favorites.data.meta.total} saved listing${favorites.data.meta.total === 1 ? "" : "s"}` : "Listings you saved"}</p>
        </div>
        <Link href="/account/saved-searches">Saved searches →</Link>
      </div>

      {favorites.isLoading || isLoading ? (
        <Skeleton active />
      ) : (favorites.data?.data ?? []).length === 0 ? (
        <div className="empty-results">
          <div style={{ fontSize: 44 }}>🤍</div>
          <h2>No favourites yet</h2>
          <p>Tap the heart on any listing to keep it here. Sold or expired listings disappear automatically.</p>
          <Link className="btn btn-primary" href="/properties">
            Browse properties
          </Link>
        </div>
      ) : (
        <div className="property-grid">
          {favorites.data?.data.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </div>
  );
}
