import type { ReactNode } from "react";

/**
 * Built-in amenity icons (24×24 stroke drawings). The names must match `Amenity::ICONS` in the API,
 * and this file is kept identical in the Admin Portal and the Public Web.
 */
export const AMENITY_ICONS: Record<string, { label: string; draw: ReactNode }> = {
  electricity: { label: "Electricity", draw: <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" /> },
  gas: {
    label: "Gas",
    draw: <path d="M12 22a7 7 0 0 0 7-7c0-3-2-5.5-4-7.5.2 2-.8 3.5-2 4-.3-3.5-2-6.5-4.5-9.5C9 5 5 9 5 15a7 7 0 0 0 7 7z" />,
  },
  water: { label: "Water", draw: <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5S12.5 5.5 12 3c-.5 2.5-2 4.9-4 6.5S5 13 5 15a7 7 0 0 0 7 7z" /> },
  sewerage: {
    label: "Sewerage / drains",
    draw: (
      <>
        <path d="M2 6c1 .8 2 1 3 1 2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2c.7 0 1.4.3 2 .6" />
        <path d="M2 12c1 .8 2 1 3 1 2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2c.7 0 1.4.3 2 .6" />
        <path d="M2 18c1 .8 2 1 3 1 2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2c.7 0 1.4.3 2 .6" />
      </>
    ),
  },
  solar: {
    label: "Solar",
    draw: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </>
    ),
  },
  "power-backup": {
    label: "Power backup",
    draw: (
      <>
        <rect x="2" y="7" width="17" height="10" rx="2" />
        <path d="M22 11v2M11 9l-2 3h3l-2 3" />
      </>
    ),
  },
  heating: { label: "Heating", draw: <path d="M14 4v10.5a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0z" /> },
  "air-conditioning": {
    label: "Air conditioning",
    draw: <path d="M2 12h20M12 2v20M20 16l-4-4 4-4M4 8l4 4-4 4M16 4l-4 4-4-4M8 20l4-4 4 4" />,
  },
  parking: {
    label: "Parking",
    draw: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M9 17V7h4a3 3 0 0 1 0 6H9" />
      </>
    ),
  },
  garden: {
    label: "Garden / lawn",
    draw: (
      <>
        <path d="M7 20h10M12 20v-8" />
        <path d="M12 12c0-3 2-5 6-5 0 4-2 6-6 5zM12 12c0-3-2-5-6-5 0 4 2 6 6 5z" />
      </>
    ),
  },
  park: {
    label: "Park",
    draw: (
      <>
        <path d="M12 22v-6" />
        <path d="M12 16a5 5 0 0 0 5-5c0-3-2-6-5-9-3 3-5 6-5 9a5 5 0 0 0 5 5z" />
      </>
    ),
  },
  pool: {
    label: "Swimming pool",
    draw: (
      <>
        <path d="M2 20c1 .8 2 1 3 1 2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2c.7 0 1.4.3 2 .6" />
        <path d="M8 16V5a2 2 0 0 1 4 0M14 16V5a2 2 0 0 1 4 0M8 9h6M8 13h6" />
      </>
    ),
  },
  gym: { label: "Gym", draw: <path d="M6.5 6.5v11M17.5 6.5v11M3 9.5v5M21 9.5v5M6.5 12h11" /> },
  security: {
    label: "Security",
    draw: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
  },
  cctv: {
    label: "CCTV",
    draw: (
      <>
        <path d="M22 8l-6 4 6 4V8z" />
        <rect x="2" y="6" width="14" height="12" rx="2" />
      </>
    ),
  },
  elevator: {
    label: "Elevator",
    draw: (
      <>
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <path d="m9 9 3-3 3 3M9 15l3 3 3-3" />
      </>
    ),
  },
  wifi: { label: "Internet / Wi-Fi", draw: <path d="M5 12.5a11 11 0 0 1 14 0M8.5 16.4a6 6 0 0 1 7 0M2 8.8a15 15 0 0 1 20 0M12 20h.01" /> },
  sofa: {
    label: "Drawing room",
    draw: <path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3M2 11a2 2 0 0 1 4 0v3h12v-3a2 2 0 0 1 4 0v6H2zM4 17v2M20 17v2" />,
  },
  dining: {
    label: "Dining",
    draw: <path d="M3 2v7a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6a2 2 0 0 0 2 2h3zm0 0v7" />,
  },
  study: {
    label: "Study / library",
    draw: <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15zM6.5 17A2.5 2.5 0 0 0 4 19.5 2.5 2.5 0 0 0 6.5 22H20v-5" />,
  },
  bed: { label: "Bedroom / quarter", draw: <path d="M3 18v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7M3 14h18M7 9V6h4v3" /> },
  stairs: { label: "Basement / stairs", draw: <path d="M3 5h4v4h4v4h4v4h6M3 5v15h18" /> },
  mosque: {
    label: "Mosque",
    draw: (
      <>
        <path d="M7 21v-8h10v8M7 13a5 5 0 0 1 10 0M12 8V5.5M2 21h20" />
        <path d="M3.5 21V10l1-2 1 2v11M18.5 21V10l1-2 1 2v11M10.5 21v-3a1.5 1.5 0 0 1 3 0v3" />
      </>
    ),
  },
  school: {
    label: "School",
    draw: (
      <>
        <path d="M22 10 12 5 2 10l10 5 10-5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </>
    ),
  },
  hospital: {
    label: "Hospital",
    draw: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M12 8v8M8 12h8" />
      </>
    ),
  },
  shop: { label: "Shops / market", draw: <path d="M3 9l1.5-5h15L21 9M4 9v11h16V9M3 9h18M9 20v-6h6v6" /> },
  corner: { label: "Corner", draw: <path d="M4 4v16h16M8 4v12h12" /> },
  road: { label: "Boulevard / main road", draw: <path d="M4 22 8 2M20 22 16 2M12 4v2M12 10v3M12 17v3" /> },
  check: { label: "Check mark", draw: <path d="M20 6 9 17l-5-5" /> },
};

/** One built-in amenity icon; nothing when the name is unknown, so a page never breaks because of an icon. */
export function AmenityGlyph({ name, className = "icon" }: { name: string | null | undefined; className?: string }) {
  const icon = name ? AMENITY_ICONS[name] : undefined;

  if (!icon) {
    return null;
  }

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {icon.draw}
    </svg>
  );
}
