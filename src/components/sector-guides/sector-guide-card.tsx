import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, MapIcon } from "@/components/icons";
import { sizedImage } from "@/lib/image";
import type { SectorGuide } from "@/types/api";

/** A sector in the directory: its map, summary and blocks, each published one linked to its own guide. */
export function SectorGuideCard({ guide }: { guide: SectorGuide }) {
  return (
    <article className="sg-card">
      <Link href={guide.path} className="sg-card-thumb" tabIndex={-1} aria-hidden="true">
        {guide.map ? <Image src={sizedImage(guide.map.image_url, "medium")} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 400px" style={{ objectFit: "cover" }} /> : <MapIcon className="icon" />}
      </Link>
      <div className="sg-card-body">
        <h3>
          <Link href={guide.path}>{guide.title}</Link>
        </h3>
        <p>{guide.summary}</p>
        {guide.blocks.length > 0 && (
          <ul className="sg-chips" aria-label={`Blocks in ${guide.title}`}>
            {guide.blocks.map((block) => (
              <li key={block.id}>{block.path ? <Link href={block.path}>{block.title}</Link> : <span>{block.title}</span>}</li>
            ))}
          </ul>
        )}
        <div className="sg-card-foot">
          <span>
            {guide.listings_count} {guide.listings_count === 1 ? "property" : "properties"} listed
          </span>
          <Link href={guide.path} className="sg-card-more">
            Read the {guide.title} guide <ArrowRightIcon className="icon" />
          </Link>
        </div>
      </div>
    </article>
  );
}
