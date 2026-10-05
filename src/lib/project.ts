import dayjs from "dayjs";
import { formatArea, formatCompactPrice, formatPriceRange } from "@/lib/labels";
import type { ProjectMedia, ProjectUnit, PublicProject } from "@/types/api";

/** Construction statuses a buyer can filter by, in the order they happen. */
export const CONSTRUCTION_STATUSES = ["upcoming", "under_construction", "ready"] as const;

/** Expected completion as a month, e.g. "Dec 2027". */
export function completionOf(date: string | null): string | null {
  return date ? dayjs(date).format("MMM YYYY") : null;
}

export function projectHref(slug: string): string {
  return `/projects/${slug}`;
}

/** Photos with the cover first. */
export function projectPhotosOf(project: PublicProject): ProjectMedia[] {
  const photos = (project.media ?? []).filter((media) => media.type === "image");

  return [...photos.filter((photo) => photo.is_cover), ...photos.filter((photo) => !photo.is_cover)];
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

  return `${Number.isInteger(value) ? value : value.toFixed(1)}${place.distance_unit ? ` ${place.distance_unit}` : ""}`;
}

/** "Rs 50 Lakh – Rs 1.2 Crore" over all unit types, or null when no unit has a price. */
export function projectPriceOf(project: PublicProject): string | null {
  return formatPriceRange(project.price_from, project.price_to);
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

/** The built-in icon (see amenity-icons.tsx) that best fits a nearby place, guessed from its name. */
export function nearbyIconOf(name: string): string {
  const text = name.toLowerCase();
  const match: [RegExp, string][] = [
    [/mosque|masjid/, "mosque"],
    [/school|college|universit|academy|institute/, "school"],
    [/hospital|clinic|medical|pharmac|chemist|health/, "hospital"],
    [/restaurant|cafe|café|food|dine|dining|hotel/, "dining"],
    [/mall|market|shop|mart|store|plaza|bazaar/, "shop"],
    [/park|garden|green|lake/, "park"],
    [/gym|fitness|sport|club/, "gym"],
    [/transport|bus|metro|station|motorway|highway|road|airport|interchange/, "road"],
  ];

  return match.find(([pattern]) => pattern.test(text))?.[1] ?? "check";
}

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

  const faqs: { question: string; answer: string | null }[] = [
    {
      question: `What is ${project.name}?`,
      answer: project.short_description ?? (project.description.length > 320 ? `${project.description.slice(0, 317).trimEnd()}…` : project.description),
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
