import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, DownloadIcon, MapIcon } from "@/components/icons";
import { societyMapHref, societyMapLocation } from "@/lib/society-maps";
import type { PublicSocietyMap } from "@/types/api";

/**
 * A map in the listing: the image with its ribbon and code, a map badge, the title and subtitle, a short
 * description, then view and download.
 */
export function SocietyMapCard({ map, headingLevel = "h2" }: { map: PublicSocietyMap; headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;
  const href = societyMapHref(map.slug);
  const subtitle = map.subtitle ?? societyMapLocation(map);

  return (
    <article className="smap-card">
      <Link href={href} className="smap-card-thumb" tabIndex={-1} aria-hidden="true">
        <Image src={map.image_url} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 400px" style={{ objectFit: "cover" }} />
        <span className="smap-ribbon">{map.card_label ?? map.category_label}</span>
        {map.code && <span className="smap-code">{map.code}</span>}
      </Link>
      <span className="smap-card-badge" aria-hidden="true">
        <MapIcon className="icon" />
      </span>
      <div className="smap-card-body">
        <Heading>
          <Link href={href}>{map.title}</Link>
        </Heading>
        {subtitle && <p className="smap-card-subtitle">{subtitle}</p>}
        <span className="smap-card-rule" aria-hidden="true" />
        {map.description_text && <p className="smap-card-text">{map.description_text}</p>}
        <div className="smap-card-foot">
          <Link className="smap-view-btn" href={href}>
            View Map <ArrowRightIcon className="icon" />
          </Link>
          <a className="smap-download-btn" href={map.download_url} download={map.download_name} target="_blank" rel="noopener noreferrer" aria-label={`Download ${map.title}`} title="Download">
            <DownloadIcon className="icon" />
          </a>
        </div>
      </div>
    </article>
  );
}
