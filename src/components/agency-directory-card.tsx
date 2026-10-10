import Image from "next/image";
import Link from "next/link";
import { initials } from "@/components/home/agent-card";
import { ArrowRightIcon, CrownIcon, HandshakeIcon, HomeIcon, PinIcon, ShieldCheckIcon, WhatsAppIcon } from "@/components/icons";
import { sizedImage } from "@/lib/image";
import { whatsappNumber } from "@/lib/property";
import type { AgencyProfile } from "@/types/api";

/**
 * The agencies directory card: the agency's cover photo across the top, its round logo overlapping
 * it with the name and location beside it, then listed / sold counts and the View Profile and
 * WhatsApp buttons. Titanium agencies get a badge and their live listing count on the cover.
 */
export function AgencyDirectoryCard({ agency, fallbackWhatsapp }: { agency: AgencyProfile; fallbackWhatsapp: string | null }) {
  const href = `/dealer/${agency.slug}`;
  const listed = agency.listings_count ?? 0;
  const sold = agency.sold_count ?? 0;
  // An agency without its own number falls back to the site's, so the button is never dead.
  const whatsapp = whatsappNumber(agency.whatsapp ?? agency.phone ?? fallbackWhatsapp);
  const location = agency.city?.name ? `DHA ${agency.city.name}` : "DHA Gujranwala";

  return (
    <article className={`dealer-card${agency.is_titanium ? " is-titanium" : ""}`}>
      <Link href={href} className="dealer-cover" tabIndex={-1} aria-hidden="true">
        {agency.cover_url && <Image src={sizedImage(agency.cover_url, "thumbnail")} alt="" fill sizes="(max-width: 640px) 100vw, 320px" style={{ objectFit: "cover" }} />}
        {agency.is_titanium && (
          <>
            <span className="titanium-badge">
              <CrownIcon className="icon" /> Titanium Agency
            </span>
            <span className="dealer-cover-count">
              <strong>{listed.toLocaleString("en-PK")}+</strong> Properties
            </span>
          </>
        )}
      </Link>

      <div className="dealer-head">
        <Link href={href} className="dealer-logo" aria-label={`${agency.name} profile`}>
          {agency.logo_url ? (
            <Image src={sizedImage(agency.logo_url, "thumbnail")} alt={`${agency.name} logo`} fill sizes="84px" style={{ objectFit: "contain" }} />
          ) : (
            <span aria-hidden="true">{initials(agency.name)}</span>
          )}
        </Link>
        <div className="dealer-name">
          <h3>
            <Link href={href}>{agency.name}</Link>
            {agency.is_verified && (
              <span className="dealer-verified" title="Documents checked by our team">
                <ShieldCheckIcon className="icon" />
                <span className="sr-only">Verified agency</span>
              </span>
            )}
          </h3>
          <p>
            <PinIcon className="icon" />
            {location}
          </p>
        </div>
      </div>

      <ul className="dealer-stats">
        <li>
          <HomeIcon className="icon" />
          <div>
            <strong>{listed.toLocaleString("en-PK")}</strong>
            <small>Listed Properties</small>
          </div>
        </li>
        <li>
          <HandshakeIcon className="icon" />
          <div>
            <strong>{sold.toLocaleString("en-PK")}</strong>
            <small>Sold Properties</small>
          </div>
        </li>
      </ul>

      <div className="dealer-actions">
        <Link href={href} className="btn btn-primary">
          View Profile <ArrowRightIcon className="icon" />
        </Link>
        {whatsapp && (
          <a
            className="btn btn-whatsapp-outline"
            href={`https://wa.me/${whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`WhatsApp ${agency.name} (opens in a new tab)`}
          >
            <WhatsAppIcon className="icon" /> WhatsApp
          </a>
        )}
      </div>
    </article>
  );
}
