import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { AgencyLogo } from "@/components/agency-card";
import { ArrowRightIcon, BadgeIcon, BuildingIcon, CalendarIcon, HomeIcon, PinIcon, StarIcon, ShieldCheckIcon } from "@/components/icons";
import { DEVELOPER_TYPE_LABELS, developerHref, yearsInBusiness } from "@/lib/developers";
import type { PublicDeveloper } from "@/types/api";

/** A blue tick after a verified company's name. */
export function VerifiedTick({ developer }: { developer: PublicDeveloper }) {
  return developer.is_verified ? (
    <span className="dl-tick" title="Verified company" aria-label="Verified company">
      <ShieldCheckIcon className="icon" />
    </span>
  ) : null;
}

export type DeveloperFact = { key: string; icon: ReactNode; value: string; label: string };

/** The short facts shown on directory cards, skipping the ones a company has no data for. */
export function developerFacts(developer: PublicDeveloper): DeveloperFact[] {
  const units = developer.units_count ?? 0;
  const years = yearsInBusiness(developer);
  const facts: (DeveloperFact | null)[] = [
    units > 0 ? { key: "units", icon: <HomeIcon className="icon" />, value: `${units.toLocaleString("en-PK")}+`, label: "Units" } : null,
    developer.city ? { key: "city", icon: <PinIcon className="icon" />, value: developer.city.name, label: "Primary focus" } : null,
    { key: "type", icon: <BadgeIcon className="icon" />, value: DEVELOPER_TYPE_LABELS[developer.company_type], label: developer.is_verified ? "Verified" : "Company type" },
    years ? { key: "years", icon: <CalendarIcon className="icon" />, value: `${years}+ Years`, label: "Experience" } : null,
  ];

  return facts.filter((fact) => fact !== null);
}

/** A company card in the directory grid: photo, overlapping logo, key facts and a profile link. */
export function DeveloperCard({ developer }: { developer: PublicDeveloper }) {
  const projects = developer.projects_count ?? 0;
  const href = developerHref(developer.slug);
  const facts = developerFacts(developer);

  return (
    <article className="dl-card">
      <Link href={href} className="dl-card-media" tabIndex={-1} aria-hidden="true">
        {developer.card_image_url ? (
          <Image src={developer.card_image_url} alt="" fill sizes="(max-width: 900px) 100vw, 600px" style={{ objectFit: "cover" }} />
        ) : (
          <span className="dl-card-placeholder">
            <BuildingIcon className="icon" />
          </span>
        )}
        {developer.is_featured ? (
          <span className="dl-chip dl-chip-featured">
            <StarIcon className="icon" /> Featured
          </span>
        ) : developer.is_verified ? (
          <span className="dl-chip dl-chip-verified">
            <ShieldCheckIcon className="icon" /> Verified
          </span>
        ) : null}
        {developer.city && (
          <span className="dl-chip dl-chip-place">
            <PinIcon className="icon" /> {developer.city.name}
          </span>
        )}
      </Link>
      <div className="dl-card-body">
        <div className="dl-card-logo">
          <AgencyLogo name={developer.name} logoUrl={developer.logo_url} size={72} />
        </div>
        <div className="dl-card-title">
          <div style={{ minWidth: 0 }}>
            <h3>
              <Link href={href}>{developer.name}</Link>
              <VerifiedTick developer={developer} />
            </h3>
            {developer.tagline && <p className="dl-card-tagline">{developer.tagline}</p>}
          </div>
          <span className="dl-card-count">
            <BuildingIcon className="icon" />
            <span>
              <strong>{projects.toLocaleString("en-PK")}</strong>
              <small>Project{projects === 1 ? "" : "s"}</small>
            </span>
          </span>
        </div>
        <ul className="dl-facts">
          {facts.map((fact) => (
            <li key={fact.key}>
              {fact.icon}
              <span>
                <strong>{fact.value}</strong>
                <small>{fact.label}</small>
              </span>
            </li>
          ))}
        </ul>
        {developer.short_description && <p className="dl-card-about">{developer.short_description}</p>}
        <Link href={href} className="btn btn-primary dl-card-btn">
          View Profile <ArrowRightIcon className="icon" />
        </Link>
      </div>
    </article>
  );
}
