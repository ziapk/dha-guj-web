import Link from "next/link";
import { AgencyLogo } from "@/components/agency-card";
import { DEVELOPER_TYPE_LABELS, developerHref } from "@/lib/developers";
import type { PublicDeveloper } from "@/types/api";

export function DeveloperTypeBadge({ type }: { type: PublicDeveloper["company_type"] }) {
  return <span className={`developer-type developer-type-${type}`}>{DEVELOPER_TYPE_LABELS[type]}</span>;
}

export function DeveloperCard({ developer }: { developer: PublicDeveloper }) {
  const projects = developer.projects_count ?? 0;
  const meta = [developer.city?.name, developer.established_year ? `Since ${developer.established_year}` : null].filter(Boolean).join(" · ");

  return (
    <Link href={developerHref(developer.slug)} className="agency-card">
      <div className="agency-card-head">
        <AgencyLogo name={developer.name} logoUrl={developer.logo_url} size={56} />
        <div style={{ minWidth: 0 }}>
          <h3>{developer.name}</h3>
          {meta && <p>{meta}</p>}
        </div>
      </div>
      {(developer.short_description ?? developer.tagline) && <p className="agency-card-about">{developer.short_description ?? developer.tagline}</p>}
      <div className="agency-card-foot">
        <span>
          <strong>{projects.toLocaleString("en-PK")}</strong> live project{projects === 1 ? "" : "s"}
        </span>
        <DeveloperTypeBadge type={developer.company_type} />
      </div>
    </Link>
  );
}
