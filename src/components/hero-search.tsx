"use client";

import { Select } from "antd";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { SearchIcon } from "@/components/icons";
import { SearchSuggest, suggestionHref } from "@/components/search-suggest";
import { PROPERTY_CATEGORY_LABELS } from "@/lib/labels";
import { AREA_RANGES, BED_OPTIONS, priceRangesFor } from "@/lib/search-options";
import type { PropertyCategory, PropertyType, Society } from "@/types/api";

type Tab = "sale" | "rent" | "commercial";

const TABS: { key: Tab; label: string }[] = [
  { key: "sale", label: "Buy" },
  { key: "rent", label: "Rent" },
  { key: "commercial", label: "Commercial" },
];

const CATEGORY_OPTIONS = (Object.keys(PROPERTY_CATEGORY_LABELS) as PropertyCategory[]).map((value) => ({
  value,
  label: PROPERTY_CATEGORY_LABELS[value],
}));

/**
 * The hero search card: Buy / Rent / Commercial tabs over a keyword box and a row of filter pills.
 * Everything it sets is a real filter on /properties, so the results page opens on the same search.
 */
export function HeroSearch({ societies, propertyTypes }: { societies: Society[]; propertyTypes: PropertyType[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("sale");
  const [category, setCategory] = useState<PropertyCategory>("residential");
  const [keyword, setKeyword] = useState("");
  const [societyId, setSocietyId] = useState<number>();
  const [typeId, setTypeId] = useState<number>();
  const [bedrooms, setBedrooms] = useState<string>();
  const [priceKey, setPriceKey] = useState<string>();
  const [areaKey, setAreaKey] = useState<string>();

  const purpose = tab === "rent" ? "rent" : "sale";
  const priceRanges = priceRangesFor(purpose);
  const showBeds = category === "residential";
  const typeOptions = propertyTypes.filter((type) => type.category === category).map((type) => ({ value: type.id, label: type.name }));

  function selectTab(next: Tab) {
    setTab(next);
    setTypeId(undefined);
    setPriceKey(undefined);
    setCategory(next === "commercial" ? "commercial" : "residential");

    if (next === "commercial") {
      setBedrooms(undefined);
    }
  }

  function selectCategory(next: PropertyCategory) {
    setCategory(next);
    setTypeId(undefined);

    if (next !== "residential") {
      setBedrooms(undefined);
    }
  }

  /** Every field except the keyword, shared by Search and by a picked suggestion. */
  function searchParams(): URLSearchParams {
    const params = new URLSearchParams();
    params.set("purpose", purpose);
    params.set("category", category);

    if (societyId) {
      params.set("society_id", String(societyId));
    }

    if (typeId) {
      params.set("property_type_id", String(typeId));
    }

    if (bedrooms && showBeds) {
      params.set("bedrooms", bedrooms);
    }

    const price = priceRanges.find((range) => range.key === priceKey);

    if (price?.min) {
      params.set("min_price", String(price.min));
    }

    if (price?.max) {
      params.set("max_price", String(price.max));
    }

    const area = AREA_RANGES.find((range) => range.key === areaKey);

    if (area) {
      params.set("area_unit", "marla");

      if (area.min) {
        params.set("min_area", String(area.min));
      }

      if (area.max) {
        params.set("max_area", String(area.max));
      }
    }

    return params;
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const params = searchParams();
    const term = keyword.trim();

    if (term) {
      params.set("q", term);
    }

    router.push(`/properties?${params.toString()}`);
  }

  return (
    <form className="hero-search" onSubmit={submit} role="search">
      <div className="hero-tabs" role="group" aria-label="What are you looking for?">
        {TABS.map((item) => (
          <button key={item.key} type="button" className="hero-tab" aria-pressed={tab === item.key} onClick={() => selectTab(item.key)}>
            {item.label}
          </button>
        ))}
      </div>

      <div className="hero-search-card">
        <div className="hero-search-row">
          <SearchSuggest
            className="hero-input"
            icon={<SearchIcon className="icon" />}
            aria-label="Search by city, community or building"
            value={keyword}
            maxLength={100}
            placeholder="City, community or building"
            onValueChange={setKeyword}
            hrefFor={(suggestion) => suggestionHref(suggestion, searchParams())}
          />
          <button type="submit" className="hero-submit">
            Search
          </button>
        </div>

        <div className="pill-row">
          <Select
            className="pill-select"
            aria-label="Property type"
            placeholder="Property type"
            allowClear
            showSearch={{ optionFilterProp: "label" }}
            popupMatchSelectWidth={false}
            value={typeId}
            onChange={setTypeId}
            options={typeOptions}
          />
          <Select
            className="pill-select"
            aria-label="Society"
            placeholder="Society"
            allowClear
            showSearch={{ optionFilterProp: "label" }}
            popupMatchSelectWidth={false}
            value={societyId}
            onChange={setSocietyId}
            options={societies.map((society) => ({ value: society.id, label: society.name }))}
          />
          <Select
            className="pill-select"
            aria-label="Price"
            placeholder="Price"
            allowClear
            popupMatchSelectWidth={false}
            value={priceKey}
            onChange={setPriceKey}
            options={priceRanges.map((range) => ({ value: range.key, label: range.label }))}
          />
          <Select
            className="pill-select"
            aria-label="Bedrooms"
            placeholder="Beds"
            allowClear
            disabled={!showBeds}
            popupMatchSelectWidth={false}
            value={bedrooms}
            onChange={setBedrooms}
            options={BED_OPTIONS}
          />
          <Select
            className="pill-select"
            aria-label="Area"
            placeholder="Area"
            allowClear
            popupMatchSelectWidth={false}
            value={areaKey}
            onChange={setAreaKey}
            options={AREA_RANGES.map((range) => ({ value: range.key, label: range.label }))}
          />
          <Select className="pill-select pill-select-accent" aria-label="Category" popupMatchSelectWidth={false} value={category} onChange={selectCategory} options={CATEGORY_OPTIONS} />
        </div>
      </div>
    </form>
  );
}
