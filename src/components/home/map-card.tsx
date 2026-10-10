import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, MapIcon } from "@/components/icons";
import type { SectorMap } from "@/lib/home-content";
import { sizedImage } from "@/lib/image";
import { societyMapHref, societyMapLocation } from "@/lib/society-maps";
import type { PublicSocietyMap } from "@/types/api";

export type MapCardData = {
  key: string;
  badge: string;
  tone: "blue" | "green" | "purple";
  title: string;
  description: string;
  image: string | null;
  /** The map's page (or file); null shows "Coming soon". */
  href: string | null;
  external: boolean;
};

const TONES: MapCardData["tone"][] = ["blue", "green", "purple"];

/** A map published from the admin, as a card. */
export function societyMapCard(map: PublicSocietyMap, index = 0): MapCardData {
  return {
    key: `map-${map.id}`,
    badge: map.card_label ?? map.category_label,
    tone: TONES[index % TONES.length],
    title: map.title,
    description: map.description_text || societyMapLocation(map) || "View and download the full-size map.",
    image: map.image_url,
    href: societyMapHref(map.slug),
    external: false,
  };
}

/** One of the built-in placeholders shown until maps are published from the admin. */
export function sectorMapCard(map: SectorMap): MapCardData {
  const isImage = map.file !== null && !map.file.toLowerCase().endsWith(".pdf");

  return { key: map.slug, badge: map.badge, tone: map.tone, title: map.title, description: map.description, image: isImage ? map.file : null, href: map.file, external: true };
}

/** A map: badged thumbnail, title and description, then the link to its page. */
export function MapCard({ map }: { map: MapCardData }) {
  return (
    <article className={`map-card tone-${map.tone}`}>
      <div className="map-card-thumb">
        {map.image ? <Image src={sizedImage(map.image, "thumbnail")} alt={map.title} fill sizes="(max-width: 720px) 100vw, 280px" style={{ objectFit: "cover" }} /> : <MapIcon className="placeholder-icon" />}
        <span className="map-badge">
          <MapIcon className="icon" />
          {map.badge}
        </span>
      </div>

      <div className="map-card-body">
        <span className="map-card-icon">
          <MapIcon className="icon" />
        </span>
        <div>
          <strong>{map.title}</strong>
          <p>{map.description}</p>
        </div>
      </div>

      {map.href === null ? (
        <span className="btn btn-block map-card-soon">Coming soon</span>
      ) : map.external ? (
        <a className="btn btn-primary btn-block" href={map.href} target="_blank" rel="noopener noreferrer">
          View Map <ArrowRightIcon className="icon" />
        </a>
      ) : (
        <Link className="btn btn-primary btn-block" href={map.href}>
          View Map <ArrowRightIcon className="icon" />
        </Link>
      )}
    </article>
  );
}
