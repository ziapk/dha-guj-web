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

/** An agency as a logo tile: the plate holds the logo, the name sits underneath. */
export function AgencyLogoCard({ agency }: { agency: AgencyProfile }) {
  return (
    <Link href={`/agencies/${agency.slug}`} className="agency-tile">
      <span className="agency-tile-plate">
        {agency.logo_url ? (
          <Image src={agency.logo_url} alt={`${agency.name} logo`} width={200} height={160} className="agency-tile-logo" />
        ) : (
          <span className="agency-tile-initials" aria-hidden="true">
            {initials(agency.name)}
          </span>
        )}
      </span>
      <strong>{agency.name}</strong>
    </Link>
  );
}
