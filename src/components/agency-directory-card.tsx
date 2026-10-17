import Image from "next/image";
import Link from "next/link";
import { initials } from "@/components/home/agent-card";
import { ArrowRightIcon, CalendarIcon, CrownIcon, HandshakeIcon, HomeIcon, PhoneIcon, PinIcon, ShieldCheckIcon, StarIcon, WhatsAppIcon } from "@/components/icons";
import { sizedImage } from "@/lib/image";
import { whatsappNumber } from "@/lib/property";
import type { AgencyProfile } from "@/types/api";

/**
 * The agencies directory card: the agency's cover photo across the top, its round logo overlapping
 * it with the name and location beside it, then listed / sold counts and the View Profile and
 * WhatsApp buttons. Titanium agencies get a badge and their live listing count on the cover.
 * `featured` is the Top Dealers rail: years in business as a third stat, and on phones a "Featured" badge
 * with View Profile and Contact Now in place of the WhatsApp button.
 */
export function AgencyDirectoryCard({ agency, fallbackWhatsapp, featured = false }: { agency: AgencyProfile; fallbackWhatsapp: string | null; featured?: boolean }) {
  const href = `/dealer/${agency.slug}`;
  const listed = agency.listings_count ?? 0;
  const sold = agency.sold_count ?? 0;
  // An agency without its own number falls back to the site's, so the button is never dead.
  const whatsapp = whatsappNumber(agency.whatsapp ?? agency.phone ?? fallbackWhatsapp);
  const location = agency.city?.name ? `DHA ${agency.city.name}` : "DHA Gujranwala";
  const years = featured && agency.established_year ? new Date().getFullYear() - agency.established_year : 0;

  return (
    <article className={`dealer-card${agency.is_titanium ? " is-titanium" : ""}${featured ? " is-featured" : ""}`}>
      <Link href={href} className="dealer-cover" tabIndex={-1} aria-hidden="true">
        {agency.cover_url && <Image src={sizedImage(agency.cover_url, "thumbnail")} alt="" fill sizes="(max-width: 640px) 100vw, 320px" style={{ objectFit: "cover" }} />}
        {agency.is_titanium && (
          <>
            {featured ? (
              <span className="titanium-badge">
                <CrownIcon className="icon text-long" />
                <StarIcon className="icon text-short" />
                <span className="text-long">Titanium Agency</span>
                <span className="text-short">Featured</span>
              </span>
            ) : (
              <span className="titanium-badge">
                <CrownIcon className="icon" /> Titanium Agency
              </span>
            )}
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

      <ul className={`dealer-stats${years > 0 ? " has-3" : ""}`}>
        <li>
          <HomeIcon className="icon" />
          <div>
            <strong>{listed.toLocaleString("en-PK")}</strong>
            <small>
              <span className="text-long">Listed Properties</span>
              <span className="text-short">Listed</span>
            </small>
          </div>
        </li>
        <li>
          <HandshakeIcon className="icon" />
          <div>
            <strong>{sold.toLocaleString("en-PK")}</strong>
            <small>
              <span className="text-long">Sold Properties</span>
              <span className="text-short">Sold</span>
            </small>
          </div>
        </li>
        {years > 0 && (
          <li>
            <CalendarIcon className="icon" />
            <div>
              <strong>{years}+</strong>
              <small>
                <span className="text-long">Years in Business</span>
                <span className="text-short">Years</span>
              </small>
            </div>
          </li>
        )}
      </ul>

      <div className="dealer-actions">
        <Link href={href} className="btn btn-primary dealer-view">
          View Profile <ArrowRightIcon className="icon" />
        </Link>
        {/* Phones get Call Now in place of View Profile; the logo and name still open the profile. */}
        {agency.phone && (
          <a className="btn btn-primary dealer-call" href={`tel:${agency.phone.replace(/[^\d+]/g, "")}`} aria-label={`Call ${agency.name}`}>
            <PhoneIcon className="icon" /> {featured ? "Contact Now" : "Call"}
          </a>
        )}
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
