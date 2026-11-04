import Link from "next/link";
import { SECTORS_PATH } from "@/lib/sector-guides";
import type { SectorGuide } from "@/types/api";

/** Every published sector guide as plain links, closing the plot rates page. */
export function SectorGuideLinks({ guides }: { guides: SectorGuide[] }) {
  return (
    <section className="detail-section sg-link-section" aria-labelledby="sector-guide-links">
      <h2 id="sector-guide-links">Guides to DHA Gujranwala sectors</h2>
      <p>
        Prices tell part of the story. See the map, blocks, roads and facilities of each area in the <Link href={SECTORS_PATH}>DHA Gujranwala sectors guide</Link>.
      </p>
      <ul className="sg-chips">
        {guides.map((guide) => (
          <li key={guide.id}>
            <Link href={guide.path}>{guide.title}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
