import dayjs from "dayjs";
import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, DownloadIcon, MapIcon, PinIcon } from "@/components/icons";
import { societyMapHref, societyMapLocation } from "@/lib/society-maps";
import type { PublicSocietyMap } from "@/types/api";

/** A map in the listing: thumbnail with its category, title, location, a short description, then view and download. */
export function SocietyMapCard({ map, headingLevel = "h2" }: { map: PublicSocietyMap; headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;
  const href = societyMapHref(map.slug);
  const location = societyMapLocation(map);

  return (
    <article className="smap-card">
      <Link href={href} className="smap-card-thumb" tabIndex={-1} aria-hidden="true">
        <Image src={map.image_url} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 400px" style={{ objectFit: "cover" }} />
        <span className="smap-tag">
          <MapIcon className="icon" /> {map.category_label}
        </span>
        {map.is_featured && <span className="smap-featured">Featured</span>}
      </Link>
      <div className="smap-card-body">
        <Heading>
          <Link href={href}>{map.title}</Link>
        </Heading>
        {location && (
          <p className="smap-card-location">
            <PinIcon className="icon" /> {location}
          </p>
        )}
        {map.description && <p className="smap-card-text">{map.description}</p>}
        <div className="smap-card-foot">
          {map.published_at && <small>Updated {dayjs(map.updated_at ?? map.published_at).format("MMM D, YYYY")}</small>}
          <div className="smap-card-actions">
            <a className="btn btn-outline" href={map.download_url} download={map.download_name} target="_blank" rel="noopener noreferrer" aria-label={`Download ${map.title}`}>
              <DownloadIcon className="icon" />
            </a>
            <Link className="btn btn-primary" href={href}>
              View map <ArrowRightIcon className="icon" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
