"use client";

import { SearchOutlined } from "@ant-design/icons";
import { Select } from "antd";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { SearchSuggest, suggestionHref } from "@/components/search-suggest";
import { PROPERTY_CATEGORY_LABELS } from "@/lib/labels";
import { BED_OPTIONS, priceRangesFor } from "@/lib/search-options";
import type { City, PropertyCategory, PropertyType } from "@/types/api";

type Tab = "sale" | "rent" | "plot" | "agencies";

const TABS: { key: Tab; label: string }[] = [
  { key: "sale", label: "Buy" },
  { key: "rent", label: "Rent" },
  { key: "plot", label: "Plots" },
  { key: "agencies", label: "Agencies" },
];

export function HeroSearch({ cities, propertyTypes }: { cities: City[]; propertyTypes: PropertyType[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("sale");
  const [keyword, setKeyword] = useState("");
  const [cityId, setCityId] = useState<number>();
  const [typeId, setTypeId] = useState<number>();
  const [bedrooms, setBedrooms] = useState<string>();
  const [priceKey, setPriceKey] = useState<string>();

  const isAgencies = tab === "agencies";
  const isPlot = tab === "plot";
  const priceRanges = priceRangesFor(tab === "rent" ? "rent" : "sale");
  const categories: PropertyCategory[] = isPlot ? ["plot"] : ["residential", "commercial"];
  const typeOptions = categories.map((category) => ({
    label: PROPERTY_CATEGORY_LABELS[category],
    options: propertyTypes.filter((type) => type.category === category).map((type) => ({ value: type.id, label: type.name })),
  }));

  function selectTab(next: Tab) {
    setTab(next);
    setTypeId(undefined);
    setPriceKey(undefined);

    if (next === "plot" || next === "agencies") {
      setBedrooms(undefined);
    }
  }

  /** The property search fields except the keyword, shared by Search and by picked suggestions. */
  function propertyParams(): URLSearchParams {
    const params = new URLSearchParams();
    params.set("purpose", tab === "rent" ? "rent" : "sale");

    if (isPlot) {
      params.set("category", "plot");
    }

    if (cityId) {
      params.set("city_id", String(cityId));
    }

    if (typeId) {
      params.set("property_type_id", String(typeId));
    }

    if (bedrooms && !isPlot) {
      params.set("bedrooms", bedrooms);
    }

    const range = priceRanges.find((item) => item.key === priceKey);

    if (range?.min) {
      params.set("min_price", String(range.min));
    }

    if (range?.max) {
      params.set("max_price", String(range.max));
    }

    return params;
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const term = keyword.trim();

    if (isAgencies) {
      const params = new URLSearchParams();

      if (term) {
        params.set("q", term);
      }

      if (cityId) {
        params.set("city_id", String(cityId));
      }

      router.push(params.toString() ? `/agencies?${params.toString()}` : "/agencies");

      return;
    }

    const params = propertyParams();

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

      <div className="hero-search-row">
        <SearchSuggest
          className="hero-input"
          icon={<SearchOutlined aria-hidden />}
          aria-label={isAgencies ? "Agency name" : "Keyword"}
          value={keyword}
          maxLength={100}
          placeholder={isAgencies ? "Search agencies by name" : "Society, phase, block or keyword"}
          onValueChange={setKeyword}
          groups={isAgencies ? ["agencies"] : undefined}
          hrefFor={(suggestion) => suggestionHref(suggestion, propertyParams())}
        />
        <button type="submit" className="btn btn-primary hero-submit">
          Search
        </button>
      </div>

      <div className="pill-row">
        <Select
          className="pill-select"
          aria-label="City"
          placeholder="City"
          allowClear
          showSearch={{ optionFilterProp: "label" }}
          popupMatchSelectWidth={false}
          value={cityId}
          onChange={setCityId}
          options={cities.map((city) => ({ value: city.id, label: city.name }))}
        />
        {!isAgencies && (
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
        )}
        {!isAgencies && !isPlot && (
          <Select className="pill-select" aria-label="Bedrooms" placeholder="Beds" allowClear popupMatchSelectWidth={false} value={bedrooms} onChange={setBedrooms} options={BED_OPTIONS} />
        )}
        {!isAgencies && (
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
        )}
      </div>
    </form>
  );
}
