"use client";

import { DeleteOutlined, SearchOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { App, Button, Empty, Popconfirm, Select, Skeleton, Typography } from "antd";
import Link from "next/link";
import { useSession } from "@/components/session-provider";
import { clientApi } from "@/lib/client-api";
import { PROPERTY_CATEGORY_LABELS, PROPERTY_PURPOSE_LABELS, formatCompactPrice, formatDate } from "@/lib/labels";
import type { AlertFrequency, Collection, PropertyCategory, PropertyPurpose, SavedSearch } from "@/types/api";

const FREQUENCY_OPTIONS: { value: AlertFrequency; label: string }[] = [
  { value: "daily", label: "Daily email" },
  { value: "weekly", label: "Weekly email" },
  { value: "none", label: "No emails" },
];

/** A short, human summary of the saved filters. */
function describe(filters: SavedSearch["filters"]): string {
  const parts: string[] = [];

  if (filters.purpose) {
    parts.push(PROPERTY_PURPOSE_LABELS[filters.purpose as PropertyPurpose]);
  }

  if (filters.category) {
    parts.push(PROPERTY_CATEGORY_LABELS[filters.category as PropertyCategory]);
  }

  if (filters.bedrooms) {
    parts.push(`${filters.bedrooms}+ beds`);
  }

  if (filters.min_price || filters.max_price) {
    parts.push(`${filters.min_price ? formatCompactPrice(filters.min_price as string) : "Any"} – ${filters.max_price ? formatCompactPrice(filters.max_price as string) : "Any"}`);
  }

  if (filters.q) {
    parts.push(`“${filters.q}”`);
  }

  return parts.length > 0 ? parts.join(" · ") : "All listings";
}

export default function SavedSearchesPage() {
  const { user, isLoading, requireLogin } = useSession();
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  const searches = useQuery({
    queryKey: ["saved-searches"],
    queryFn: () => clientApi<Collection<SavedSearch>>("portal/saved-searches").then((response) => response.data),
    enabled: Boolean(user),
  });

  const update = useMutation({
    mutationFn: ({ id, alert_frequency }: { id: number; alert_frequency: AlertFrequency }) =>
      clientApi(`portal/saved-searches/${id}`, { method: "PATCH", body: { alert_frequency } }),
    onSuccess: () => {
      message.success("Alert updated");
      queryClient.invalidateQueries({ queryKey: ["saved-searches"] });
    },
    onError: (error) => message.error(error.message),
  });

  const remove = useMutation({
    mutationFn: (id: number) => clientApi(`portal/saved-searches/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      message.success("Saved search deleted");
      queryClient.invalidateQueries({ queryKey: ["saved-searches"] });
    },
    onError: (error) => message.error(error.message),
  });

  if (!isLoading && !user) {
    return (
      <div className="container page-section">
        <Empty description="Log in to see your saved searches">
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
          <h2>Saved searches</h2>
          <p>We email you when new listings match — choose how often for each search.</p>
        </div>
        <Link href="/account/favorites">My favourites →</Link>
      </div>

      {searches.isLoading || isLoading ? (
        <Skeleton active />
      ) : (searches.data ?? []).length === 0 ? (
        <div className="empty-results">
          <div style={{ fontSize: 44 }}>🔔</div>
          <h2>No saved searches</h2>
          <p>Run a search and press “Save search” to get alerts for new listings.</p>
          <Link className="btn btn-primary" href="/properties">
            Start searching
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {searches.data?.map((search) => {
            const query = new URLSearchParams(Object.entries(search.filters).map(([key, value]) => [key, String(value)])).toString();

            return (
              <div key={search.id} className="saved-search-card">
                <div style={{ minWidth: 0, flex: "1 1 260px" }}>
                  <Typography.Text strong style={{ fontSize: 16 }}>
                    {search.name}
                  </Typography.Text>
                  <div>
                    <Typography.Text type="secondary">{describe(search.filters)}</Typography.Text>
                  </div>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    Saved {formatDate(search.created_at)}
                    {search.last_alerted_at ? ` · last checked ${formatDate(search.last_alerted_at)}` : ""}
                  </Typography.Text>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <Select
                    value={search.alert_frequency}
                    options={FREQUENCY_OPTIONS}
                    style={{ minWidth: 150 }}
                    aria-label={`Email alerts for ${search.name}`}
                    onChange={(alert_frequency) => update.mutate({ id: search.id, alert_frequency })}
                  />
                  <Link href={query ? `/properties?${query}` : "/properties"}>
                    <Button icon={<SearchOutlined />}>View results</Button>
                  </Link>
                  <Popconfirm title="Delete this saved search?" onConfirm={() => remove.mutate(search.id)}>
                    <Button danger icon={<DeleteOutlined />} aria-label={`Delete ${search.name}`} />
                  </Popconfirm>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
