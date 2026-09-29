"use client";

import { Select } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { BathIcon, BedIcon, BuildingIcon, HomeIcon, KeyIcon, LayersIcon, MapIcon, SearchIcon, TagIcon } from "@/components/icons";
import { PROPERTY_CATEGORY_LABELS } from "@/lib/labels";
import { PURPOSE_PAGES, purposeHref, type PurposePage, type SectorOption } from "@/lib/purpose-search";
import { BED_OPTIONS, priceRangeKey, priceRangesFor } from "@/lib/search-options";
import type { PropertyCategory, PropertyType } from "@/types/api";

const BATH_OPTIONS = ["1", "2", "3", "4", "5"].map((value) => ({ value, label: `${value}+ baths` }));

/** Keys the bar sets; every other filter already in the URL (keyword, society, area…) is kept when searching. */
const BAR_KEYS = ["property_type_id", "sector", "block", "bedrooms", "bathrooms", "min_price", "max_price", "page"];

/** One labelled select in the bar: an icon chip, then the select. */
function Field({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="purpose-field">
      <span className="purpose-field-icon" aria-hidden="true">
        {icon}
      </span>
      {children}
    </div>
  );
}

/**
 * The Buy / Rent / Commercial tabs and the filter bar in the hero of /buy and /rent.
 * Buy and Rent are separate pages; Commercial narrows the current one to commercial property.
 */
export function PurposeSearchBar({
  page,
  filters,
  propertyTypes,
  sectors,
}: {
  page: PurposePage;
  filters: Record<string, string>;
  propertyTypes: PropertyType[];
  sectors: SectorOption[];
}) {
  const router = useRouter();
  const isCommercial = filters.category === "commercial";

  const [typeId, setTypeId] = useState<string | undefined>(filters.property_type_id);
  const [sector, setSector] = useState<string | undefined>(filters.sector);
  const [block, setBlock] = useState<string | undefined>(filters.block);
  const [bedrooms, setBedrooms] = useState<string | undefined>(filters.bedrooms);
  const [bathrooms, setBathrooms] = useState<string | undefined>(filters.bathrooms);
  const [priceKey, setPriceKey] = useState<string | undefined>(priceRangeKey({ ...filters, purpose: page.purpose }));

  const priceRanges = priceRangesFor(page.purpose);
  const selectedType = propertyTypes.find((type) => String(type.id) === typeId);
  // Plots and shops have no bedrooms; commercial searches skip them too.
  const showRooms = !isCommercial && selectedType?.category !== "plot" && selectedType?.category !== "commercial";
  const blockOptions = sectors.find((item) => item.name === sector)?.blocks ?? [];

  const typeOptions = (Object.keys(PROPERTY_CATEGORY_LABELS) as PropertyCategory[])
    .filter((category) => !isCommercial || category === "commercial")
    .map((category) => ({
      label: PROPERTY_CATEGORY_LABELS[category],
      options: propertyTypes.filter((type) => type.category === category).map((type) => ({ value: String(type.id), label: type.name })),
    }))
    .filter((group) => group.options.length > 0);

  function submit(event: FormEvent) {
    event.preventDefault();
    const next = Object.fromEntries(Object.entries(filters).filter(([key]) => !BAR_KEYS.includes(key)));
    const price = priceRanges.find((range) => range.key === priceKey);
    const set = (key: string, value: string | number | undefined) => {
      if (value !== undefined && value !== "") {
        next[key] = String(value);
      }
    };

    set("property_type_id", typeId);
    set("sector", sector);
    set("block", sector ? block : undefined);
    set("bedrooms", showRooms ? bedrooms : undefined);
    set("bathrooms", showRooms ? bathrooms : undefined);
    set("min_price", price?.min);
    set("max_price", price?.max);

    router.push(purposeHref(page.path, next));
  }

  const tabs = [
    { key: "sale", label: "Buy", icon: <HomeIcon />, href: PURPOSE_PAGES.sale.path, active: page.purpose === "sale" && !isCommercial },
    { key: "rent", label: "Rent", icon: <KeyIcon />, href: PURPOSE_PAGES.rent.path, active: page.purpose === "rent" && !isCommercial },
    { key: "commercial", label: "Commercial", icon: <BuildingIcon />, href: purposeHref(page.path, { category: "commercial" }), active: isCommercial },
  ];

  return (
    <form className="purpose-search" onSubmit={submit} role="search" aria-label={`Search property ${page.phrase}`}>
      <nav className="purpose-tabs" aria-label="Buy, rent or commercial">
        {tabs.map((tab) => (
          <Link key={tab.key} href={tab.href} className="purpose-tab" aria-current={tab.active ? "page" : undefined}>
            {tab.icon} {tab.label}
          </Link>
        ))}
      </nav>

      <div className="purpose-bar">
        <Field icon={<HomeIcon />}>
          <Select
            variant="borderless"
            aria-label="Property type"
            placeholder="Property Type"
            allowClear
            showSearch={{ optionFilterProp: "label" }}
            popupMatchSelectWidth={false}
            value={typeId}
            onChange={setTypeId}
            options={typeOptions}
          />
        </Field>
        <Field icon={<MapIcon />}>
          <Select
            variant="borderless"
            aria-label="Sector"
            placeholder="Sector"
            allowClear
            showSearch={{ optionFilterProp: "label" }}
            popupMatchSelectWidth={false}
            value={sector}
            onChange={(value?: string) => {
              setSector(value);
              setBlock(undefined);
            }}
            options={sectors.map((item) => ({ value: item.name, label: item.name }))}
            notFoundContent="No sectors yet"
          />
        </Field>
        <Field icon={<LayersIcon />}>
          <Select
            variant="borderless"
            aria-label="Block"
            placeholder="Block"
            allowClear
            disabled={!sector || blockOptions.length === 0}
            popupMatchSelectWidth={false}
            value={block}
            onChange={setBlock}
            options={blockOptions.map((name) => ({ value: name, label: name }))}
          />
        </Field>
        <Field icon={<BedIcon />}>
          <Select
            variant="borderless"
            aria-label="Bedrooms"
            placeholder="Bedrooms"
            allowClear
            disabled={!showRooms}
            popupMatchSelectWidth={false}
            value={showRooms ? bedrooms : undefined}
            onChange={setBedrooms}
            options={BED_OPTIONS}
          />
        </Field>
        <Field icon={<BathIcon />}>
          <Select
            variant="borderless"
            aria-label="Bathrooms"
            placeholder="Bathrooms"
            allowClear
            disabled={!showRooms}
            popupMatchSelectWidth={false}
            value={showRooms ? bathrooms : undefined}
            onChange={setBathrooms}
            options={BATH_OPTIONS}
          />
        </Field>
        <Field icon={<TagIcon />}>
          <Select
            variant="borderless"
            aria-label="Price (PKR)"
            placeholder="Price (PKR)"
            allowClear
            popupMatchSelectWidth={false}
            value={priceKey}
            onChange={setPriceKey}
            options={priceRanges.map((range) => ({ value: range.key, label: range.label }))}
          />
        </Field>
        <button type="submit" className="purpose-submit">
          <SearchIcon /> Search Properties
        </button>
      </div>
    </form>
  );
}
