/** Quick-pick filter values shared by the home search card and the search results bar. */

export type PriceRange = { key: string; label: string; min?: number; max?: number };

export const PRICE_RANGES: Record<"sale" | "rent", PriceRange[]> = {
  sale: [
    { key: "0-5000000", label: "Up to 50 Lakh", max: 5_000_000 },
    { key: "5000000-10000000", label: "50 Lakh – 1 Crore", min: 5_000_000, max: 10_000_000 },
    { key: "10000000-20000000", label: "1 – 2 Crore", min: 10_000_000, max: 20_000_000 },
    { key: "20000000-50000000", label: "2 – 5 Crore", min: 20_000_000, max: 50_000_000 },
    { key: "50000000-", label: "Above 5 Crore", min: 50_000_000 },
  ],
  rent: [
    { key: "0-50000", label: "Up to 50,000 / month", max: 50_000 },
    { key: "50000-100000", label: "50,000 – 1 Lakh", min: 50_000, max: 100_000 },
    { key: "100000-250000", label: "1 – 2.5 Lakh", min: 100_000, max: 250_000 },
    { key: "250000-", label: "Above 2.5 Lakh", min: 250_000 },
  ],
};

export const BED_OPTIONS = ["1", "2", "3", "4", "5"].map((value) => ({ value, label: `${value}+ beds` }));

export function priceRangesFor(purpose: string | undefined): PriceRange[] {
  return PRICE_RANGES[purpose === "rent" ? "rent" : "sale"];
}

/** The quick-pick range matching the current min/max price, if any. */
export function priceRangeKey(filters: Record<string, string>): string | undefined {
  if (!filters.min_price && !filters.max_price) {
    return undefined;
  }

  return priceRangesFor(filters.purpose).find(
    (range) => String(range.min ?? "") === (filters.min_price ?? "") && String(range.max ?? "") === (filters.max_price ?? ""),
  )?.key;
}

export type AreaRange = { key: string; label: string; min?: number; max?: number };

/** Plot/house sizes as Marla, the unit DHA Gujranwala is sold in. */
export const AREA_RANGES: AreaRange[] = [
  { key: "0-5", label: "Up to 5 Marla", max: 5 },
  { key: "5-10", label: "5 – 10 Marla", min: 5, max: 10 },
  { key: "10-20", label: "10 Marla – 1 Kanal", min: 10, max: 20 },
  { key: "20-40", label: "1 – 2 Kanal", min: 20, max: 40 },
  { key: "40-", label: "Above 2 Kanal", min: 40 },
];
