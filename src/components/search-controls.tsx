"use client";

import { FilterOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Checkbox, Drawer, InputNumber, Pagination, Segmented, Select, Space } from "antd";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SearchSuggest, suggestionHref } from "@/components/search-suggest";
import { AREA_UNIT_LABELS, PROPERTY_CATEGORY_LABELS, toOptions } from "@/lib/labels";
import type { City, PropertyCategory, PropertyType, Society } from "@/types/api";

type FilterProps = {
  cities: City[];
  societies: Society[];
  propertyTypes: PropertyType[];
  filters: Record<string, string>;
};

const SORT_OPTIONS = [
  { value: "relevance", label: "Hot & featured first" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "area_desc", label: "Largest area" },
];

function pushFilters(router: ReturnType<typeof useRouter>, filters: Record<string, string>) {
  const query = new URLSearchParams(filters).toString();
  router.push(query ? `/properties?${query}` : "/properties");
}

/** The filter form; state is local until "Show results" updates the URL. */
export function SearchFilters({ cities, societies, propertyTypes, filters, onApplied }: FilterProps & { onApplied?: () => void }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(filters);

  function set(key: string, value: string | number | boolean | null | undefined) {
    setValues((current) => {
      const next = { ...current };

      if (value === undefined || value === null || value === "" || value === false) {
        delete next[key];
      } else {
        next[key] = String(value);
      }

      return next;
    });
  }

  const category = values.category as PropertyCategory | undefined;
  const number = (key: string) => (values[key] ? Number(values[key]) : null);

  return (
    <div>
      <div className="filter-group">
        <span className="filter-label">Purpose</span>
        <Segmented
          block
          value={values.purpose ?? "any"}
          onChange={(value) => set("purpose", value === "any" ? null : String(value))}
          options={[
            { value: "any", label: "Any" },
            { value: "sale", label: "Buy" },
            { value: "rent", label: "Rent" },
          ]}
        />
      </div>

      <div className="filter-group">
        <span className="filter-label">Property type</span>
        <Space orientation="vertical" style={{ width: "100%" }}>
          <Select
            allowClear
            placeholder="Any category"
            style={{ width: "100%" }}
            value={category}
            options={toOptions(PROPERTY_CATEGORY_LABELS)}
            onChange={(value) => {
              set("category", value);
              set("property_type_id", null);
            }}
          />
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="Any type"
            style={{ width: "100%" }}
            value={number("property_type_id") ?? undefined}
            options={propertyTypes.filter((type) => !category || type.category === category).map((type) => ({ value: type.id, label: type.name }))}
            onChange={(value) => set("property_type_id", value)}
          />
        </Space>
      </div>

      <div className="filter-group">
        <span className="filter-label">Location</span>
        <Space orientation="vertical" style={{ width: "100%" }}>
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="Any city"
            style={{ width: "100%" }}
            value={number("city_id") ?? undefined}
            options={cities.map((city) => ({ value: city.id, label: city.name }))}
            onChange={(value) => {
              set("city_id", value);
              set("society_id", null);
            }}
          />
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder={values.city_id ? "Any society" : "Choose a city first"}
            disabled={!values.city_id}
            style={{ width: "100%" }}
            value={number("society_id") ?? undefined}
            options={societies.filter((society) => String(society.city_id) === values.city_id).map((society) => ({ value: society.id, label: society.name }))}
            onChange={(value) => set("society_id", value)}
          />
        </Space>
      </div>

      <div className="filter-group">
        <span className="filter-label">Price (Rs)</span>
        <Space.Compact block>
          <InputNumber min={0} step={100000} placeholder="Min" style={{ width: "50%" }} value={number("min_price")} onChange={(value) => set("min_price", value)} />
          <InputNumber min={0} step={100000} placeholder="Max" style={{ width: "50%" }} value={number("max_price")} onChange={(value) => set("max_price", value)} />
        </Space.Compact>
      </div>

      {category !== "plot" && (
        <div className="filter-group">
          <span className="filter-label">Bedrooms</span>
          <Segmented
            block
            value={values.bedrooms ?? "any"}
            onChange={(value) => set("bedrooms", value === "any" ? null : String(value))}
            options={[
              { value: "any", label: "Any" },
              { value: "1", label: "1+" },
              { value: "2", label: "2+" },
              { value: "3", label: "3+" },
              { value: "4", label: "4+" },
              { value: "5", label: "5+" },
            ]}
          />
        </div>
      )}

      <div className="filter-group">
        <span className="filter-label">Area</span>
        <Space.Compact block>
          <InputNumber min={0} placeholder="Min" style={{ width: "34%" }} value={number("min_area")} onChange={(value) => set("min_area", value)} />
          <InputNumber min={0} placeholder="Max" style={{ width: "33%" }} value={number("max_area")} onChange={(value) => set("max_area", value)} />
          <Select style={{ width: "33%" }} value={values.area_unit ?? "marla"} options={toOptions(AREA_UNIT_LABELS)} onChange={(value) => set("area_unit", value)} />
        </Space.Compact>
      </div>

      <div className="filter-group">
        <span className="filter-label">Show only</span>
        <Space orientation="vertical" size={6}>
          <Checkbox checked={values.installments === "1"} onChange={(event) => set("installments", event.target.checked ? "1" : null)}>
            Installments available
          </Checkbox>
          <Checkbox checked={values.hot === "1"} onChange={(event) => set("hot", event.target.checked ? "1" : null)}>
            Hot listings
          </Checkbox>
          <Checkbox checked={values.featured === "1"} onChange={(event) => set("featured", event.target.checked ? "1" : null)}>
            Featured listings
          </Checkbox>
        </Space>
      </div>

      <Space orientation="vertical" style={{ width: "100%" }}>
        <Button
          type="primary"
          block
          size="large"
          onClick={() => {
            const next = { ...values };
            delete next.page;

            if (!next.min_area && !next.max_area) {
              delete next.area_unit;
            }

            pushFilters(router, next);
            onApplied?.();
          }}
        >
          Show results
        </Button>
        <Button
          block
          type="text"
          onClick={() => {
            router.push("/properties");
            onApplied?.();
          }}
        >
          Clear all filters
        </Button>
      </Space>
    </div>
  );
}

/** Filters in a drawer for phones and tablets. */
export function FiltersDrawerButton(props: FilterProps) {
  const [open, setOpen] = useState(false);
  const activeCount = Object.keys(props.filters).filter((key) => key !== "page" && key !== "sort").length;

  return (
    <>
      <Button className="filters-drawer-button" icon={<FilterOutlined />} onClick={() => setOpen(true)}>
        Filters{activeCount > 0 ? ` (${activeCount})` : ""}
      </Button>
      <Drawer title="Filters" placement="left" size={320} open={open} onClose={() => setOpen(false)}>
        <SearchFilters {...props} onApplied={() => setOpen(false)} />
      </Drawer>
    </>
  );
}

/** Keyword box in the results bar with suggestions; picking a society or phase keeps the other filters. */
export function KeywordSearch({ filters }: { filters: Record<string, string> }) {
  const router = useRouter();
  const [keyword, setKeyword] = useState(filters.q ?? "");

  return (
    <form
      className="search-keyword-form"
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        const next: Record<string, string> = { ...filters, q: keyword.trim() };
        delete next.page;

        if (!next.q) {
          delete next.q;
        }

        pushFilters(router, next);
      }}
    >
      <SearchSuggest
        className="search-keyword"
        icon={<SearchOutlined aria-hidden />}
        aria-label="Keyword"
        placeholder="Society, phase, block or keyword"
        maxLength={100}
        value={keyword}
        onValueChange={setKeyword}
        hrefFor={(suggestion) => suggestionHref(suggestion, new URLSearchParams(filters))}
      />
    </form>
  );
}

export function SortSelect({ filters }: { filters: Record<string, string> }) {
  const router = useRouter();

  return (
    <Select
      style={{ minWidth: 190 }}
      value={filters.sort ?? "relevance"}
      options={SORT_OPTIONS}
      aria-label="Sort results"
      onChange={(sort) => {
        const next = { ...filters };
        delete next.page;

        if (sort === "relevance") {
          delete next.sort;
        } else {
          next.sort = sort;
        }

        pushFilters(router, next);
      }}
    />
  );
}

export function ResultsPagination({ filters, current, total, pageSize }: { filters: Record<string, string>; current: number; total: number; pageSize: number }) {
  const router = useRouter();

  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: 32 }}>
      <Pagination
        current={current}
        total={total}
        pageSize={pageSize}
        showSizeChanger={false}
        onChange={(page) => {
          pushFilters(router, { ...filters, page: String(page) });
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
    </div>
  );
}
