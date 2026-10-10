import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRightIcon, BuildingIcon, CheckCircleIcon, ClockIcon, HomeIcon, LayersIcon, PinIcon, RocketIcon } from "@/components/icons";
import { formatArea, formatAreaRange, formatCompactPrice } from "@/lib/labels";
import { PRICE_ON_REQUEST, projectHref, projectLocationOf, projectPhotosOf, projectPriceOf, projectSingleMediaOf } from "@/lib/project";
import { descriptionText, mediumUrl, thumbnailUrl } from "@/lib/property";
import type { ConstructionStatus, PublicProject } from "@/types/api";

/** Status chip on the listing cards; colours come from the shared --tag-* tokens. */
export const LISTING_STATUS: Record<ConstructionStatus, { label: string; icon: ReactNode }> = {
  upcoming: { label: "New Launch", icon: <RocketIcon /> },
  under_construction: { label: "Under Construction", icon: <ClockIcon /> },
  ready: { label: "Completed", icon: <CheckCircleIcon /> },
};

export function projectLogoOf(project: PublicProject): string | null {
  const logo = projectSingleMediaOf(project, "logo");

  return project.logo_url ?? (logo ? (logo.medium_url ?? logo.url) : null) ?? project.developer?.logo_url ?? null;
}

export function projectCoverOf(project: PublicProject, size: "thumb" | "medium" = "thumb"): string | null {
  const photo = projectPhotosOf(project)[0];

  return photo ? (size === "medium" ? mediumUrl(photo) : thumbnailUrl(photo)) : (project.cover_url ?? null);
}

/** "5 Marla - 6 Marla - 10 Marla" from the unit types, else the headline size range or the typed unit size. */
export function projectSizesOf(project: PublicProject, separator = " - "): string | null {
  const units = project.units ?? [];
  const sizes = [...new Set(units.filter((unit) => unit.area_size && unit.area_unit).map((unit) => formatArea(unit.area_size!, unit.area_unit!)))];

  if (sizes.length > 0) {
    return sizes.slice(0, 3).join(separator) + (sizes.length > 3 ? " …" : "");
  }

  return formatAreaRange(project.min_unit_size, project.max_unit_size, project.unit_size_unit) ?? project.unit_size ?? null;
}

export function projectTypeOf(project: PublicProject): string | null {
  return project.project_type || project.category || project.unit_type || null;
}

export function projectSummaryOf(project: PublicProject): string {
  return project.short_description || descriptionText(project.description ?? "");
}

/** The card's price block: "From" + the lowest price, "Price on request", or nothing when no price is set. */
function ProjectPrice({ project }: { project: PublicProject }) {
  if (project.hide_price) {
    return <strong className="pl-price pl-price-request">{PRICE_ON_REQUEST}</strong>;
  }

  if (project.price_from && Number(project.price_from) > 0) {
    return (
      <>
        <small>From</small>
        <strong className="pl-price">{formatCompactPrice(project.price_from)}</strong>
      </>
    );
  }

  const range = projectPriceOf(project);

  return range ? <strong className="pl-price">{range}</strong> : <strong className="pl-price pl-price-request">{PRICE_ON_REQUEST}</strong>;
}

export function ProjectListingCard({ project, priority = false }: { project: PublicProject; priority?: boolean }) {
  const href = projectHref(project.slug);
  const cover = projectCoverOf(project);
  const logo = projectLogoOf(project);
  const location = project.location || projectLocationOf(project);
  const type = projectTypeOf(project);
  const summary = projectSummaryOf(project);
  const sizes = projectSizesOf(project);
  const unitCount = project.units?.length ?? 0;
  const status = LISTING_STATUS[project.construction_status];

  return (
    <article className="pl-card">
      <Link href={href} className="pl-card-cover" tabIndex={-1} aria-hidden="true">
        {cover ? (
          <Image src={cover} alt="" fill priority={priority} sizes="(max-width: 760px) 100vw, 600px" style={{ objectFit: "cover" }} />
        ) : (
          <BuildingIcon className="placeholder-icon" />
        )}
        {status && (
          <span className={`pl-status pl-status-${project.construction_status}`}>
            {status.icon} {status.label}
          </span>
        )}
        {location && (
          <span className="pl-card-location">
            <PinIcon /> <span>{location}</span>
          </span>
        )}
        {logo && (
          <span className="pl-card-logo">
            <Image src={logo} alt="" width={52} height={52} />
          </span>
        )}
      </Link>

      <div className="pl-card-body">
        {type && <span className="pl-type">{type}</span>}
        <h3 className="pl-card-title">
          <Link href={href}>{project.name}</Link>
        </h3>
        {summary && <p className="pl-card-text">{summary}</p>}
        {(sizes || unitCount > 0) && (
          <ul className="pl-chips">
            {sizes && (
              <li>
                <HomeIcon /> {sizes}
              </li>
            )}
            {unitCount > 0 && (
              <li>
                <LayersIcon /> {unitCount} unit type{unitCount === 1 ? "" : "s"}
              </li>
            )}
          </ul>
        )}
        <div className="pl-card-foot">
          <div className="pl-card-price">
            <ProjectPrice project={project} />
          </div>
          <Link href={href} className="btn btn-primary pl-btn">
            View Project <ArrowRightIcon />
          </Link>
        </div>
      </div>
    </article>
  );
}
