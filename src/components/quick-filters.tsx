"use client";

import { FilterOutlined } from "@ant-design/icons";
import { Badge, Button, Drawer, Select } from "antd";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SearchFilters } from "@/components/search-controls";
import { PROPERTY_CATEGORY_LABELS } from "@/lib/labels";
import { BED_OPTIONS, priceRangeKey, priceRangesFor } from "@/lib/search-options";
import type { City, PropertyCategory, PropertyType, Society } from "@/types/api";

type Props = { cities: City[]; societies: Society[]; propertyTypes: PropertyType[]; filters: Record<string, string> };

/** Filters shown as pills in the bar; everything else lives under "More filters". */
const PILL_KEYS = ["purpose", "city_id", "category", "property_type_id", "bedrooms", "min_price", "max_price"];
const IGNORED_KEYS = ["page", "sort"];

export function QuickFilters({ cities, societies, propertyTypes, filters }: Props) {
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);

  function apply(patch: Record<string, string | undefined>) {
    const next: Record<string, string> = {};

    for (const [key, value] of Object.entries({ ...filters, ...patch })) {
      if (value !== undefined && value !== "" && key !== "page") {
        next[key] = value;
      }
    }

    const query = new URLSearchParams(next).toString();
    router.push(query ? `/properties?${query}` : "/properties");
  }

  const category = filters.category as PropertyCategory | undefined;
  const typeValue = filters.property_type_id ? `type:${filters.property_type_id}` : category ? `category:${category}` : undefined;
  const typeOptions = (Object.keys(PROPERTY_CATEGORY_LABELS) as PropertyCategory[]).map((item) => ({
    label: PROPERTY_CATEGORY_LABELS[item],
    options: [
      { value: `category:${item}`, label: `All ${PROPERTY_CATEGORY_LABELS[item].toLowerCase()}` },
      ...propertyTypes.filter((type) => type.category === item).map((type) => ({ value: `type:${type.id}`, label: type.name })),
    ],
  }));

  const activeCount = Object.keys(filters).filter((key) => !IGNORED_KEYS.includes(key)).length;
  const moreCount = Object.keys(filters).filter((key) => !IGNORED_KEYS.includes(key) && !PILL_KEYS.includes(key)).length;
  const hasCustomPrice = Boolean((filters.min_price || filters.max_price) && !priceRangeKey(filters));

  return (
    <div className="quick-filters">
      <Select
        className="pill-select"
        aria-label="Buy or rent"
        popupMatchSelectWidth={false}
        value={filters.purpose ?? "any"}
        options={[
          { value: "any", label: "Buy or rent" },
          { value: "sale", label: "Buy" },
          { value: "rent", label: "Rent" },
        ]}
        onChange={(value) => apply({ purpose: value === "any" ? undefined : value, min_price: undefined, max_price: undefined })}
      />
      <Select
        className="pill-select"
        aria-label="City"
        placeholder="City"
        allowClear
        showSearch={{ optionFilterProp: "label" }}
        popupMatchSelectWidth={false}
        value={filters.city_id ? Number(filters.city_id) : undefined}
        options={cities.map((city) => ({ value: city.id, label: city.name }))}
        onChange={(value?: number) => apply({ city_id: value ? String(value) : undefined, society_id: undefined })}
      />
      <Select
        className="pill-select"
        aria-label="Property type"
        placeholder="Property type"
        allowClear
        showSearch={{ optionFilterProp: "label" }}
        popupMatchSelectWidth={false}
        value={typeValue}
        options={typeOptions}
        onChange={(value?: string) => {
          if (!value) {
            apply({ category: undefined, property_type_id: undefined });

            return;
          }

          const [kind, id] = value.split(":");
          const nextCategory = kind === "category" ? id : propertyTypes.find((type) => String(type.id) === id)?.category;

          apply({
            category: nextCategory,
            property_type_id: kind === "type" ? id : undefined,
            bedrooms: nextCategory === "plot" ? undefined : filters.bedrooms,
            bathrooms: nextCategory === "plot" ? undefined : filters.bathrooms,
          });
        }}
      />
      {category !== "plot" && (
        <Select
          className="pill-select"
          aria-label="Bedrooms"
          placeholder="Beds"
          allowClear
          popupMatchSelectWidth={false}
          value={filters.bedrooms}
          options={BED_OPTIONS}
          onChange={(value?: string) => apply({ bedrooms: value })}
        />
      )}
      <Select
        className="pill-select"
        aria-label="Price"
        placeholder={hasCustomPrice ? "Custom price" : "Price"}
        allowClear
        popupMatchSelectWidth={false}
        value={priceRangeKey(filters)}
        options={priceRangesFor(filters.purpose).map((range) => ({ value: range.key, label: range.label }))}
        onChange={(value?: string) => {
          const range = priceRangesFor(filters.purpose).find((item) => item.key === value);
          apply({ min_price: range?.min ? String(range.min) : undefined, max_price: range?.max ? String(range.max) : undefined });
        }}
      />
      <Badge count={moreCount} size="small" color="#3a307f">
        <Button className="pill-button" icon={<FilterOutlined />} onClick={() => setMoreOpen(true)}>
          More filters
        </Button>
      </Badge>
      {activeCount > 0 && (
        <button type="button" className="clear-filters" onClick={() => router.push(filters.sort ? `/properties?sort=${filters.sort}` : "/properties")}>
          Clear all
        </button>
      )}

      <Drawer title="All filters" placement="right" size={360} open={moreOpen} onClose={() => setMoreOpen(false)}>
        <SearchFilters key={JSON.stringify(filters)} cities={cities} societies={societies} propertyTypes={propertyTypes} filters={filters} onApplied={() => setMoreOpen(false)} />
      </Drawer>
    </div>
  );
}
