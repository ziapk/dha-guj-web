import dayjs from "dayjs";
import type { AccountType, AreaUnit, ConstructionStatus, FurnishedStatus, PropertyCategory, PropertyPurpose } from "@/types/api";

export const PROPERTY_PURPOSE_LABELS: Record<PropertyPurpose, string> = { sale: "For sale", rent: "For rent" };

export const PROPERTY_CATEGORY_LABELS: Record<PropertyCategory, string> = { residential: "Homes", plot: "Plots", commercial: "Commercial" };

export const AREA_UNIT_LABELS: Record<AreaUnit, string> = { marla: "Marla", kanal: "Kanal", sq_ft: "Sq. ft", sq_yd: "Sq. yd", sq_m: "Sq. m" };

export const FURNISHED_LABELS: Record<FurnishedStatus, string> = {
  unfurnished: "Unfurnished",
  semi_furnished: "Semi-furnished",
  furnished: "Furnished",
};

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = { individual: "Property owner", agency: "Real estate agency", agent: "Agent", developer: "Developer" };

export const CONSTRUCTION_STATUS_LABELS: Record<ConstructionStatus, string> = { upcoming: "Upcoming", under_construction: "Under construction", ready: "Ready to move in" };

export function toOptions<T extends string>(labels: Record<T, string>): { value: T; label: string }[] {
  return (Object.keys(labels) as T[]).map((value) => ({ value, label: labels[value] }));
}

export function formatPrice(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return "—";
  }

  return `Rs ${Number(value).toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;
}

/** Pakistani-style short price: Rs 2.5 Crore, Rs 85 Lakh, Rs 45,000. */
export function formatCompactPrice(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return "—";
  }

  const amount = Number(value);
  const trim = (n: number) => n.toFixed(2).replace(/\.?0+$/, "");

  if (amount >= 10_000_000) {
    return `Rs ${trim(amount / 10_000_000)} Crore`;
  }

  if (amount >= 100_000) {
    return `Rs ${trim(amount / 100_000)} Lakh`;
  }

  return formatPrice(amount);
}

export function formatArea(size: string | number, unit: AreaUnit): string {
  return `${Number(size).toLocaleString("en-PK", { maximumFractionDigits: 2 })} ${AREA_UNIT_LABELS[unit]}`;
}

export function formatDate(value: string | null | undefined): string {
  return value ? dayjs(value).format("DD MMM YYYY") : "—";
}

/** How long ago a listing went live: "today", "yesterday", "3 days ago", "2 weeks ago". */
export function listedAgo(value: string | null | undefined): string {
  if (!value) {
    return "recently";
  }

  const days = Math.max(0, dayjs().startOf("day").diff(dayjs(value).startOf("day"), "day"));

  if (days === 0) {
    return "today";
  }

  if (days === 1) {
    return "yesterday";
  }

  if (days < 14) {
    return `${days} days ago`;
  }

  if (days < 60) {
    return `${Math.floor(days / 7)} weeks ago`;
  }

  if (days < 365) {
    return `${Math.floor(days / 30)} months ago`;
  }

  return "over a year ago";
}


/** "Rs 50 Lakh – Rs 1 Crore", "Up to Rs 1 Crore", "From Rs 50 Lakh", or null when neither bound is set. */
export function formatPriceRange(min: string | number | null | undefined, max: string | number | null | undefined): string | null {
  const hasMin = min !== null && min !== undefined && Number(min) > 0;
  const hasMax = max !== null && max !== undefined && Number(max) > 0;

  if (hasMin && hasMax) {
    return Number(min) === Number(max) ? formatCompactPrice(min) : `${formatCompactPrice(min)} – ${formatCompactPrice(max)}`;
  }

  if (hasMax) {
    return `Up to ${formatCompactPrice(max)}`;
  }

  return hasMin ? `From ${formatCompactPrice(min)}` : null;
}

/** "5 – 10 Marla", "Up to 1 Kanal", "From 10 Marla", or null when neither bound is set. */
export function formatAreaRange(min: string | number | null | undefined, max: string | number | null | undefined, unit: AreaUnit | null | undefined): string | null {
  const hasMin = min !== null && min !== undefined && Number(min) > 0;
  const hasMax = max !== null && max !== undefined && Number(max) > 0;

  if (!unit || (!hasMin && !hasMax)) {
    return null;
  }

  const number = (value: string | number | null | undefined) => Number(value).toLocaleString("en-PK", { maximumFractionDigits: 2 });

  if (hasMin && hasMax) {
    return Number(min) === Number(max) ? formatArea(min as string | number, unit) : `${number(min)} – ${formatArea(max as string | number, unit)}`;
  }

  return hasMax ? `Up to ${formatArea(max as string | number, unit)}` : `From ${formatArea(min as string | number, unit)}`;
}
