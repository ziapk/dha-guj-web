import type { Metadata } from "next";
import { BannerSlot } from "@/components/banner-slot";
import { AgencyLogoCard } from "@/components/home/agency-logo-card";
import { AgentCard } from "@/components/home/agent-card";
import { Carousel } from "@/components/home/carousel";
import { FeaturedProjects } from "@/components/home/featured-projects";
import { HomeHero } from "@/components/home/hero";
import { MapCard } from "@/components/home/map-card";
import { PillLink } from "@/components/home/section-heading";
import { SeoLinks } from "@/components/home/seo-links";
import { ChartIcon, PinIcon, ShieldIcon } from "@/components/icons";
import { PropertyCard } from "@/components/property-card";
import { publicApi } from "@/lib/api";
import { getAgents } from "@/lib/agents";
import { PROJECT_HIGHLIGHTS, SECTOR_MAPS, type ProjectHighlight } from "@/lib/home-content";
import { getMasterData } from "@/lib/master-data";
import { openGraph } from "@/lib/seo";
import { getSiteSettings, siteNameOf } from "@/lib/site-data";
import type { AgencyProfile, HomeData, HomeSections, Paginated, PublicProject, Resource } from "@/types/api";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const title = `${siteNameOf(settings)}: homes, plots and commercial property for sale and rent`;
  const description =
    "Search houses, plots, villas and commercial property for sale and rent in DHA Gujranwala. Verified listings, trusted dealers, sector maps and file rates.";

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: "/" },
    openGraph: await openGraph({ title, description, url: "/" }),
    twitter: { card: "summary", title, description },
  };
}

const EMPTY_HOME: HomeData = { total_listings: 0, hot: [], featured: [], latest: [], posts: [], cities: [], popular_societies: [] };

const HIGHLIGHT_ICONS: Record<ProjectHighlight["icon"], typeof ChartIcon> = { chart: ChartIcon, shield: ShieldIcon, pin: PinIcon };

/** The design's 3 x 2 block of property cards; the carousel pages through one block at a time. */
const PROPERTIES_PER_PAGE = 6;

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
  const [home, master, settings, agencies, projects, agentPage] = await Promise.all([
    publicApi<Resource<HomeData>>("home").then((response) => response.data).catch(() => EMPTY_HOME),
    getMasterData(),
    getSiteSettings(),
    publicApi<Paginated<AgencyProfile>>("agencies", { query: { per_page: 12 }, revalidate: 300 }).then((response) => response.data).catch(() => [] as AgencyProfile[]),
    publicApi<Paginated<PublicProject>>("projects", { query: { per_page: 6 }, revalidate: 300 }).then((response) => response.data).catch(() => [] as PublicProject[]),
    getAgents(1, 12),
  ]);

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
            <Carousel label="Titanium agencies" title="Titanium" highlight="Agencies" subtitle="Trusted real estate agencies in DHA Gujranwala." action={<PillLink href="/agencies">View All Agencies</PillLink>}>
              {titanium.map((agency) => (
                <AgencyLogoCard key={agency.id} agency={agency} />
              ))}
            </Carousel>
          </div>
        </section>
      )}

      {projects.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="projects-panel">
              <div className="projects-intro">
                <p className="home-eyebrow home-eyebrow-plain">Exclusive Opportunities</p>
                <h2>
                  Featured Projects <span>in DHA Gujranwala</span>
                </h2>
                <p className="projects-intro-text">
                  Explore the most promising and newly launched projects in DHA Gujranwala. Find the perfect investment opportunity today.
                </p>
                <ul className="projects-highlights">
                  {PROJECT_HIGHLIGHTS.map((highlight) => {
                    const Icon = HIGHLIGHT_ICONS[highlight.icon];

                    return (
                      <li key={highlight.title}>
                        <span>
                          <Icon className="icon" />
                        </span>
                        {highlight.title}
                      </li>
                    );
                  })}
                </ul>
                <PillLink href="/projects">View All Projects</PillLink>
              </div>
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

      <section className="section section-tint">
        <div className="container">
          <Carousel
            label="DHA Gujranwala maps"
            eyebrow="Explore"
            title="DHA Gujranwala"
            highlight="Maps"
            subtitle="Browse and download sector maps, commercial zones and key locations of DHA Gujranwala."
            action={<PillLink href="/maps">View All Maps</PillLink>}
            arrows="head"
            dots
          >
            {SECTOR_MAPS.map((map) => (
              <MapCard key={map.slug} map={map} />
            ))}
          </Carousel>
        </div>
      </section>

      {agents.length > 0 && (
        <section className="section">
          <div className="container">
            <Carousel
              label="Our agents"
              title="Our"
              highlight="Agents"
              subtitle="Trusted Real Estate Professionals in DHA Gujranwala."
              action={<PillLink href="/agents">View All Agents</PillLink>}
              dots
            >
              {agents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} fallbackPhone={settings.contact.phone} fallbackWhatsapp={settings.contact.whatsapp} />
              ))}
            </Carousel>
          </div>
        </section>
      )}

      <section className="section section-seo">
        <div className="container">
          <SeoLinks />
        </div>
      </section>
    </>
  );
}
