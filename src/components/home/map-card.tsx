import Image from "next/image";
import { ArrowRightIcon, MapIcon } from "@/components/icons";
import type { SectorMap } from "@/lib/home-content";

/** A sector map: badged thumbnail, title and description, then the link to the full-size file. */
export function MapCard({ map }: { map: SectorMap }) {
  const isImage = map.file !== null && !map.file.toLowerCase().endsWith(".pdf");

  return (
    <article className={`map-card tone-${map.tone}`}>
      <div className="map-card-thumb">
        {isImage && map.file ? (
          <Image src={map.file} alt={map.title} fill sizes="(max-width: 720px) 100vw, 280px" style={{ objectFit: "cover" }} />
        ) : (
          <MapIcon className="placeholder-icon" />
        )}
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

      {map.file ? (
        <a className="btn btn-primary btn-block" href={map.file} target="_blank" rel="noopener noreferrer">
          View Map <ArrowRightIcon className="icon" />
        </a>
      ) : (
        <span className="btn btn-block map-card-soon">Coming soon</span>
      )}
    </article>
  );
}
