import type { Metadata } from "next";
import { MapCard } from "@/components/home/map-card";
import { SectionHeading } from "@/components/home/section-heading";
import { SECTOR_MAPS } from "@/lib/home-content";
import { openGraph } from "@/lib/seo";

export const revalidate = 3600;

const TITLE = "DHA Gujranwala maps";
const DESCRIPTION = "Sector maps, commercial zone maps and the location map of DHA Gujranwala — view them online or download the full-size files.";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: "/maps" },
    openGraph: await openGraph({ title: TITLE, description: DESCRIPTION, url: "/maps" }),
  };
}

export default function MapsPage() {
  return (
    <section className="section">
      <div className="container">
        <SectionHeading eyebrow="Explore" title="DHA Gujranwala" highlight="Maps" subtitle={DESCRIPTION} />
        <div className="map-grid">
          {SECTOR_MAPS.map((map) => (
            <MapCard key={map.slug} map={map} />
          ))}
        </div>
      </div>
    </section>
  );
}
