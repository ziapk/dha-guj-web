import Image from "next/image";
import Link from "next/link";
import { PinIcon } from "@/components/icons";
import { sizedImage } from "@/lib/image";
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

/** An agency as a compact row: the logo on the left, the name and area beside it. */
export function AgencyLogoCard({ agency }: { agency: AgencyProfile }) {
  return (
    <Link href={`/dealer/${agency.slug}`} className="agency-tile">
      <span className="agency-tile-plate">
        {agency.logo_url ? (
          <Image src={sizedImage(agency.logo_url, "thumbnail")} alt={`${agency.name} logo`} width={120} height={120} className="agency-tile-logo" />
        ) : (
          <span className="agency-tile-initials" aria-hidden="true">
            {initials(agency.name)}
          </span>
        )}
      </span>
      <span className="agency-tile-body">
        <strong>{agency.name}</strong>
        <small>
          <PinIcon className="icon" />
          {agency.city?.name ? `DHA ${agency.city.name}` : "DHA Gujranwala"}
        </small>
      </span>
    </Link>
  );
}
