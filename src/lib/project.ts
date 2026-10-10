import dayjs from "dayjs";
import { formatArea, formatCompactPrice, formatPriceRange } from "@/lib/labels";
import { descriptionText } from "@/lib/property";
import type { NearbyPlaceCategory, ProjectMedia, ProjectNearbyPlace, ProjectProgressStatus, ProjectUnit, PublicProject } from "@/types/api";

/** Construction statuses a buyer can filter by, in the order they happen. */
export const CONSTRUCTION_STATUSES = ["upcoming", "under_construction", "ready"] as const;

/** Expected completion as a month, e.g. "Dec 2027". */
export function completionOf(date: string | null): string | null {
  return date ? dayjs(date).format("MMM YYYY") : null;
}

export function projectHref(slug: string): string {
  return `/project/${slug}`;
}

/** "September 2024" — milestone and progress dates. */
export function monthYearOf(date: string | null | undefined): string | null {
  return date ? dayjs(date).format("MMMM YYYY") : null;
}

/**
 * The gallery photos in the order the admin arranged them (the first one is the cover).
 * Only "image" media; logos, plans, brochures and the like are left out.
 */
export function projectPhotosOf(project: PublicProject): ProjectMedia[] {
  return (project.media ?? []).filter((media) => media.type === "image");
}

export function projectMediaOf(project: PublicProject, type: ProjectMedia["type"]): ProjectMedia[] {
  return (project.media ?? []).filter((media) => media.type === type);
}

/** The single image of a given kind, e.g. the master plan, or null when there is none. */
export function projectSingleMediaOf(project: PublicProject, type: ProjectMedia["type"]): ProjectMedia | null {
  return projectMediaOf(project, type)[0] ?? null;
}

/** "Block A, Sector K, DHA Phase 2, DHA Gujranwala, Gujranwala". */
export function projectLocationOf(project: PublicProject): string {
  return [project.block, project.sector, project.phase, project.society?.name, project.city?.name].filter(Boolean).join(", ");
}

/** The full postal address, for the location section and schema.org. */
export function projectAddressOf(project: PublicProject): string {
  return [project.street, project.address, project.block, project.sector, project.phase, project.society?.name, project.city?.name]
    .filter(Boolean)
    .join(", ");
}

/** "1.2 km" — how far a nearby place is, however the developer measured it. */
export function nearbyDistanceOf(place: { distance: string | null; distance_unit: string | null }): string | null {
  if (place.distance === null) {
    return null;
  }

  const value = Number(place.distance);
  const amount = Number.isNaN(value) ? place.distance : Number.isInteger(value) ? value : Number(value.toFixed(1));

  return `${amount}${place.distance_unit ? ` ${place.distance_unit}` : ""}`;
}

/** Nearby place categories in the order the page shows them, with the built-in icon (amenity-icons.tsx) for each. */
export const NEARBY_CATEGORIES: { key: NearbyPlaceCategory; label: string; icon: string }[] = [
  { key: "mosque", label: "Mosque", icon: "mosque" },
  { key: "school", label: "School", icon: "school" },
  { key: "hospital", label: "Hospital", icon: "hospital" },
  { key: "restaurant", label: "Restaurant", icon: "dining" },
  { key: "shopping_mall", label: "Shopping Mall", icon: "shop" },
  { key: "public_transport", label: "Public Transport", icon: "road" },
  { key: "park", label: "Park", icon: "park" },
  { key: "pharmacy", label: "Pharmacy", icon: "hospital" },
  { key: "gujranwala_city", label: "Gujranwala City", icon: "corner" },
  { key: "main_gt_road", label: "Main GT Road", icon: "road" },
  { key: "motorway", label: "Motorway", icon: "road" },
];

/** Nearby places grouped by category in NEARBY_CATEGORIES order; uncategorised (or unknown) places go last under "Other". */
export function nearbyGroupsOf(places: ProjectNearbyPlace[]): { key: string; label: string; icon: string; places: ProjectNearbyPlace[] }[] {
  const known = new Set<string>(NEARBY_CATEGORIES.map((category) => category.key));
  const groups = NEARBY_CATEGORIES.map((category) => ({ ...category, places: places.filter((place) => place.category === category.key) }));
  const other = places.filter((place) => !place.category || !known.has(place.category));

  return [...groups, { key: "other", label: "Other", icon: "check", places: other }].filter((group) => group.places.length > 0);
}

export const PROGRESS_STATUS_LABELS: Record<ProjectProgressStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  near_completion: "Near completion",
  completed: "Completed",
};

/** Shown wherever a price would be when the developer keeps prices private. */
export const PRICE_ON_REQUEST = "Price on request";

/** "Rs 50 Lakh – Rs 1.2 Crore" over all unit types, "Price on request" when hidden, or null when no unit has a price. */
export function projectPriceOf(project: PublicProject): string | null {
  return project.hide_price ? PRICE_ON_REQUEST : formatPriceRange(project.price_from, project.price_to);
}

export function unitPriceOf(unit: ProjectUnit): string | null {
  return formatPriceRange(unit.price_from, unit.price_to ?? unit.price_from);
}

/** "House · 10 Marla · 4 beds · 3 baths", leaving out whatever the developer did not fill in. */
export function unitSummaryOf(unit: ProjectUnit): string {
  return [
    unit.property_type?.name,
    unit.area_size && unit.area_unit ? formatArea(unit.area_size, unit.area_unit) : null,
    unit.bedrooms !== null ? `${unit.bedrooms} ${unit.bedrooms === 1 ? "bed" : "beds"}` : null,
    unit.bathrooms !== null ? `${unit.bathrooms} ${unit.bathrooms === 1 ? "bath" : "baths"}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

/** The rooms a unit lists, ready to render as a fact grid. */
export function unitRoomsOf(unit: ProjectUnit): { label: string; value: number }[] {
  const rooms: { label: string; value: number | null }[] = [
    { label: "Bedrooms", value: unit.bedrooms },
    { label: "Bathrooms", value: unit.bathrooms },
    { label: "Drawing room", value: unit.drawing_rooms },
    { label: "Lounge", value: unit.lounges },
    { label: "Kitchen", value: unit.kitchens },
    { label: "Study", value: unit.study_rooms },
    { label: "Store", value: unit.store_rooms },
    { label: "Balcony", value: unit.balconies },
    { label: "Terrace", value: unit.terraces },
    { label: "Parking", value: unit.parking_spaces },
  ];

  return rooms.filter((room): room is { label: string; value: number } => room.value !== null && room.value > 0);
}

/** How a unit's availability reads on the page. */
export const UNIT_AVAILABILITY_LABELS: Record<string, string> = {
  available: "Available",
  limited: "Limited availability",
  sold_out: "Sold out",
  coming_soon: "Coming soon",
};

export type ProjectMilestone = { key: string; label: string; date: string | null; note: string; done: boolean };

/**
 * The project timeline: elapsed months, months to go and how much of the launch → completion window has passed.
 * `percent` is time-based (the API has no build-progress field), so the page labels it as such.
 */
export function projectTimelineOf(project: PublicProject, now = dayjs()) {
  const launch = project.launch_date ? dayjs(project.launch_date) : null;
  const completion = project.completion_date ? dayjs(project.completion_date) : null;
  const ready = project.construction_status === "ready";

  let percent: number | null = null;

  if (ready) {
    percent = 100;
  } else if (project.construction_status === "upcoming") {
    percent = 0;
  } else if (launch && completion && completion.isAfter(launch)) {
    const share = now.diff(launch, "day") / completion.diff(launch, "day");
    percent = Math.round(Math.max(0, Math.min(0.99, share)) * 100);
  }

  const milestones: ProjectMilestone[] = [
    { key: "launch", label: "Project Launch", date: project.launch_date, note: "Official launch and bookings open.", done: Boolean(launch && !launch.isAfter(now)) || project.construction_status !== "upcoming" },
    { key: "construction", label: "Construction", date: null, note: "Infrastructure and buildings under way.", done: project.construction_status !== "upcoming" },
    { key: "completion", label: "Project Completion", date: project.completion_date, note: "Construction and finishing work complete.", done: ready || Boolean(completion && !completion.isAfter(now)) },
    { key: "possession", label: "Possession", date: project.possession_date, note: "Handover of units to owners.", done: Boolean(project.possession_date && !dayjs(project.possession_date).isAfter(now)) },
  ];

  return {
    percent,
    monthsElapsed: launch && !launch.isAfter(now) ? now.diff(launch, "month") : null,
    monthsToGo: completion && completion.isAfter(now) && !ready ? completion.diff(now, "month") : null,
    milestones,
    /** The first milestone not reached yet — the one the page marks as the current stage. */
    currentKey: milestones.find((milestone) => !milestone.done)?.key ?? null,
  };
}

/**
 * Questions buyers ask, answered only from what the developer filled in; a question with no answer is left out.
 * The page shows them and sends them as FAQPage structured data.
 */
export function projectFaqsOf(project: PublicProject): { question: string; answer: string }[] {
  const units = project.units ?? [];
  const plans = project.payment_plans ?? [];
  const amenities = project.amenities ?? [];
  const location = projectAddressOf(project);
  const installments = units.filter((unit) => unit.monthly_installment || unit.down_payment);
  const planInstallments = plans.filter((plan) => plan.monthly_installment || plan.quarterly_installment || plan.half_yearly_installment);
  const possession = project.possession_date ?? project.completion_date;
  const contact = project.contact;
  const description = descriptionText(project.description ?? "");

  const faqs: { question: string; answer: string | null }[] = [
    {
      question: `What is ${project.name}?`,
      answer: project.short_description ?? (description.length > 320 ? `${description.slice(0, 317).trimEnd()}…` : description || null),
    },
    {
      question: "What types of units are available?",
      answer: units.length
        ? `${project.name} offers ${units.length} unit ${units.length === 1 ? "type" : "types"}: ${units
            .map((unit) => {
              const details = [unit.area_size && unit.area_unit ? formatArea(unit.area_size, unit.area_unit) : null, unitPriceOf(unit)].filter(Boolean).join(", ");

              return details ? `${unit.name} (${details})` : unit.name;
            })
            .join("; ")}.`
        : null,
    },
    {
      question: "What is the location of the project?",
      answer: location ? `${project.name} is located at ${location}${project.landmark ? `, near ${project.landmark}` : ""}.` : null,
    },
    {
      question: "What is the payment plan?",
      answer: plans.length
        ? `The developer has published ${plans.length} payment ${plans.length === 1 ? "plan" : "plans"} (${plans.map((plan) => plan.name).join(", ")}). You can view or download them in the Payment Plans section above.`
        : null,
    },
    {
      question: "Are installment plans available?",
      answer:
        installments.length || planInstallments.length
          ? `Yes. ${
              installments.length
                ? installments
                    .map((unit) =>
                      [
                        unit.name,
                        unit.down_payment ? `${formatCompactPrice(unit.down_payment)} down payment` : null,
                        unit.monthly_installment ? `${formatCompactPrice(unit.monthly_installment)} monthly${unit.installments_count ? ` for ${unit.installments_count} months` : ""}` : null,
                      ]
                        .filter(Boolean)
                        .join(" — "),
                    )
                    .join("; ") + "."
                : "See the payment plans above for the installment schedule."
            }`
          : null,
    },
    {
      question: "What amenities are included in the project?",
      answer: amenities.length ? `${amenities.map((amenity) => amenity.name).join(", ")}.` : null,
    },
    {
      question: "Is this project approved?",
      answer: project.approval_number ? `Yes. The project's approval number is ${project.approval_number}.` : null,
    },
    {
      question: "When is the expected possession?",
      answer:
        project.construction_status === "ready"
          ? "The project is complete and ready for possession."
          : possession
            ? `Possession is expected in ${dayjs(possession).format("MMMM YYYY")}.`
            : null,
    },
    {
      question: "How can I book a unit?",
      answer: `Contact ${contact?.name ?? project.developer_name}${contact?.phone ? ` on ${contact.phone}` : ""} using the Call or WhatsApp buttons on this page, or send an enquiry and the sales team will get back to you.`,
    },
  ];

  return faqs.filter((faq): faq is { question: string; answer: string } => Boolean(faq.answer));
}

export type ProjectFaqEntry = { key: string; question: string; /** Sanitised HTML from the admin, or null for a generated answer. */ html: string | null; text: string };

/** The admin's FAQs when there are any (answers are HTML), otherwise the generated ones from projectFaqsOf. */
export function projectFaqEntriesOf(project: PublicProject): ProjectFaqEntry[] {
  const own = (project.faqs ?? []).filter((faq) => faq.question.trim() !== "");

  if (own.length > 0) {
    return own.map((faq) => ({ key: `faq-${faq.id}`, question: faq.question, html: faq.answer, text: descriptionText(faq.answer ?? "") }));
  }

  return projectFaqsOf(project).map((faq) => ({ key: faq.question, question: faq.question, html: null, text: faq.answer }));
}
