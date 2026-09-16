import Image from "next/image";
import Link from "next/link";
import type { AgencyProfile } from "@/types/api";

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function AgencyLogo({ name, logoUrl, size }: { name: string; logoUrl: string | null; size: number }) {
  if (logoUrl) {
    return <Image src={logoUrl} alt={`${name} logo`} width={size} height={size} className="agency-logo" />;
  }

  return (
    <span className="agency-logo agency-logo-initials" style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }} aria-hidden="true">
      {initials(name)}
    </span>
  );
}

export function VerifiedBadge() {
  return (
    <span className="verified-badge" title="Documents checked by our team">
      ✓ Verified
    </span>
  );
}

export function AgencyCard({ agency }: { agency: AgencyProfile }) {
  const listings = agency.listings_count ?? 0;

  return (
    <Link href={`/agencies/${agency.slug}`} className="agency-card">
      <div className="agency-card-head">
        <AgencyLogo name={agency.name} logoUrl={agency.logo_url} size={56} />
        <div style={{ minWidth: 0 }}>
          <h3>{agency.name}</h3>
          {agency.city && <p>{agency.city.name}</p>}
        </div>
      </div>
      {agency.about && <p className="agency-card-about">{agency.about}</p>}
      <div className="agency-card-foot">
        <span>
          <strong>{listings.toLocaleString("en-PK")}</strong> live listing{listings === 1 ? "" : "s"}
        </span>
        {agency.is_verified && <VerifiedBadge />}
      </div>
    </Link>
  );
}
