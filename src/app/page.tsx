import type { Metadata } from "next";
import { BannerSlot } from "@/components/banner-slot";
import { AgencyLogoCard } from "@/components/home/agency-logo-card";
import { AgentCard } from "@/components/home/agent-card";
import { Carousel } from "@/components/home/carousel";
import { FeaturedProjects } from "@/components/home/featured-projects";
import { HomeHero } from "@/components/home/hero";
import { MapCard, sectorMapCard, societyMapCard } from "@/components/home/map-card";
import { PillLink, SectionHeading } from "@/components/home/section-heading";
import { SeoLinks } from "@/components/home/seo-links";
import { PropertyCard } from "@/components/property-card";
import { publicApi } from "@/lib/api";
import { getAgents } from "@/lib/agents";
import { SECTOR_MAPS } from "@/lib/home-content";
import { getSocietyMaps } from "@/lib/society-maps";
import { getMasterData } from "@/lib/master-data";
import { PAGE_META } from "@/lib/page-meta";
import { openGraph } from "@/lib/seo";
import { getSiteSettings } from "@/lib/site-data";
import type { AgencyProfile, HomeData, HomeSections, Paginated, PublicProject, Resource } from "@/types/api";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const { title, description } = PAGE_META.home;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: "/" },
    openGraph: await openGraph({ title, description, url: "/" }),
    twitter: { card: "summary", title, description },
  };
}

const EMPTY_HOME: HomeData = { total_listings: 0, hot: [], featured: [], latest: [], posts: [], cities: [], popular_societies: [] };

/** The design's 3 x 2 block of property cards; the carousel pages through one block at a time. */
const PROPERTIES_PER_PAGE = 6;

/** Two rows of five dealer tiles per page, as in the design. */
const AGENCIES_PER_PAGE = 10;

function chunk<T>(items: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, page) => items.slice(page * size, page * size + size));
}

/** Home page settings with defaults: every section shows unless an admin switched it off. */
function sectionsOf(home: HomeData): Pick<HomeSections, "hero_title" | "hero_subtitle" | "hero_image_url" | "show_featured" | "show_agencies"> {
  const saved = home.sections ?? {};
  const text = (value: unknown) => (typeof value === "string" && value.trim() !== "" ? value.trim() : null);
  const show = (value: unknown) => value !== false && value !== 0 && value !== "0";

  return {
    hero_title: text(saved.hero_title),
    hero_subtitle: text(saved.hero_subtitle),
    hero_image_url: text(saved.hero_image_url),
    show_featured: show(saved.show_featured),
    show_agencies: show(saved.show_agencies),
  };
}

/** Verified agencies first, then the rest — the closest the API has to the design's "titanium" tier. */
function rankAgencies(agencies: AgencyProfile[]): AgencyProfile[] {
  return [...agencies].sort((a, b) => Number(b.is_verified) - Number(a.is_verified) || (b.listings_count ?? 0) - (a.listings_count ?? 0));
}

export default async function HomePage() {
  // The page still renders (with empty sections) if the API is briefly unavailable; it refreshes within a minute.
  const [home, master, settings, agencies, projects, agentPage, societyMaps] = await Promise.all([
    publicApi<Resource<HomeData>>("home").then((response) => response.data).catch(() => EMPTY_HOME),
    getMasterData(),
    getSiteSettings(),
    publicApi<Paginated<AgencyProfile>>("agencies", { query: { per_page: 12 }, revalidate: 300 }).then((response) => response.data).catch(() => [] as AgencyProfile[]),
    publicApi<Paginated<PublicProject>>("projects", { query: { per_page: 6 }, revalidate: 300 }).then((response) => response.data).catch(() => [] as PublicProject[]),
    getAgents(1, 12),
    getSocietyMaps(1, {}, 8),
  ]);
  // Maps published from the admin; the built-in placeholders until there are some.
  const mapCards = societyMaps?.data.length ? societyMaps.data.map(societyMapCard) : SECTOR_MAPS.map(sectorMapCard);

  const sections = sectionsOf(home);
  // Promoted listings first, newest ones when nothing is promoted, so the row is never empty.
  const promoted = [...(home.hot ?? []), ...(sections.show_featured ? home.featured : [])];
  const pool = promoted.length > 0 ? [...promoted, ...home.latest] : home.latest;
  const properties = [...new Map(pool.map((property) => [property.id, property])).values()].slice(0, PROPERTIES_PER_PAGE * 4);
  const propertyPages = chunk(properties, PROPERTIES_PER_PAGE);
  const titanium = sections.show_agencies ? rankAgencies(agencies) : [];
  const agents = agentPage?.data ?? [];

  return (
    <>
      <HomeHero
        title={sections.hero_title}
        subtitle={sections.hero_subtitle}
        imageUrl={sections.hero_image_url}
        societies={master.societies}
        propertyTypes={master.propertyTypes}
      />

      <div className="container">
        <BannerSlot placement="home_top" className="banner-home-top" />
      </div>

      {titanium.length > 0 && (
        <section className="section">
          <div className="container">
            <Carousel label="Titanium dealers" title="Titanium" highlight="Dealers" paged>
              {chunk(titanium, AGENCIES_PER_PAGE).map((page) => (
                <div key={page[0].id} className="agency-grid carousel-page">
                  {page.map((agency) => (
                    <AgencyLogoCard key={agency.id} agency={agency} />
                  ))}
                </div>
              ))}
            </Carousel>
          </div>
        </section>
      )}

      {projects.length > 0 && (
        <section className="section">
          <div className="container">
            <SectionHeading
              title="Featured"
              highlight="Projects"
              subtitle="Explore the top real estate projects in DHA Gujranwala with modern living and prime investment opportunities."
            >
              <PillLink href="/projects">View All Projects</PillLink>
            </SectionHeading>
            <div className="projects-panel">
              <FeaturedProjects projects={projects} />
            </div>
          </div>
        </section>
      )}

      {properties.length > 0 && (
        <section className="section">
          <div className="container">
            <Carousel
              label="Featured properties"
              title="Featured"
              highlight="Properties"
              subtitle="Discover the best residential and commercial properties in DHA Gujranwala."
              arrows="head"
              paged
            >
              {propertyPages.map((page, pageIndex) => (
                <div key={page[0].id} className="property-grid carousel-page">
                  {page.map((property, index) => (
                    <PropertyCard key={property.id} property={property} priority={pageIndex === 0 && index < 3} />
                  ))}
                </div>
              ))}
            </Carousel>
          </div>
        </section>
      )}

      {agents.length > 0 && (
        <section className="section">
          <div className="container">
            <Carousel
              label="Top rated agents"
              title="Top Rated"
              highlight="Agents"
              subtitle="Our professional real estate agents are here to help you find the best properties in DHA Gujranwala."
              action={<PillLink href="/agents">View All Agents</PillLink>}
              dots
            >
              {agents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} fallbackPhone={settings.contact.phone} fallbackWhatsapp={settings.contact.whatsapp} layout="row" />
              ))}
            </Carousel>
          </div>
        </section>
      )}

      <section className="section section-tint">
        <div className="container">
          <Carousel
            label="DHA Gujranwala maps"
            eyebrow="Explore"
            title="DHA Gujranwala"
            highlight="Maps"
            subtitle="Browse and download sector maps, commercial zones and key locations of DHA Gujranwala."
            action={<PillLink href="/dha-gujranwala-maps">View All Maps</PillLink>}
            arrows="head"
            dots
          >
            {mapCards.map((map) => (
              <MapCard key={map.key} map={map} />
            ))}
          </Carousel>
        </div>
      </section>

      <SeoLinks />
    </>
  );
}
