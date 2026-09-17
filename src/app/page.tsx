import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import { AgencyCard } from "@/components/agency-card";
import { BannerSlot } from "@/components/banner-slot";
import { HeroSearch } from "@/components/hero-search";
import { BellIcon, ChatIcon, KeyIcon, MegaphoneIcon, ShieldIcon } from "@/components/icons";
import { PostCard } from "@/components/post-card";
import { ProjectCard } from "@/components/project-card";
import { PropertyCard } from "@/components/property-card";
import { Rail } from "@/components/rail";
import { RecentlyViewed } from "@/components/recently-viewed";
import { publicApi } from "@/lib/api";
import { openGraph } from "@/lib/seo";
import { portalUrl } from "@/lib/site";
import { getSiteSettings, siteNameOf } from "@/lib/site-data";
import type { AgencyProfile, Collection, HomeData, HomeSections, Paginated, PropertyType, PublicProject, Resource } from "@/types/api";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const title = `${siteNameOf(settings)}: homes, plots and commercial property for sale and rent`;
  const description =
    "Search houses, flats, plots and commercial property for sale and rent in DHA Gujranwala, Lahore, Islamabad and Karachi. Contact owners and agencies directly.";

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: "/" },
    openGraph: await openGraph({ title, description, url: "/" }),
    twitter: { card: "summary", title, description },
  };
}

const EMPTY_HOME: HomeData = { total_listings: 0, hot: [], featured: [], latest: [], posts: [], cities: [], popular_societies: [] };

const DEFAULT_HERO_TITLE = "Find your place in DHA and beyond";
const DEFAULT_HERO_SUBTITLE = "Homes, plots and commercial property for sale and rent across Gujranwala, Lahore, Islamabad and Karachi.";

/** Home page settings with defaults: every section shows unless an admin switched it off. */
function sectionsOf(home: HomeData): HomeSections {
  const saved = home.sections ?? {};
  const text = (value: unknown) => (typeof value === "string" && value.trim() !== "" ? value.trim() : null);
  const show = (value: unknown) => value !== false && value !== 0 && value !== "0";

  return {
    hero_title: text(saved.hero_title),
    hero_subtitle: text(saved.hero_subtitle),
    hero_image_url: text(saved.hero_image_url),
    show_hot: show(saved.show_hot),
    show_featured: show(saved.show_featured),
    show_latest: show(saved.show_latest),
    show_cities: show(saved.show_cities),
    show_societies: show(saved.show_societies),
    show_agencies: show(saved.show_agencies),
    show_blog: show(saved.show_blog),
  };
}

/** A background image behind the hero, darkened so the white text stays readable. Only http(s) URLs are used. */
function heroStyle(imageUrl: string | null): CSSProperties | undefined {
  if (!imageUrl || !/^https?:\/\//i.test(imageUrl)) {
    return undefined;
  }

  return {
    backgroundImage: `linear-gradient(135deg, rgba(36, 30, 82, 0.88) 0%, rgba(58, 48, 127, 0.72) 55%, rgba(36, 30, 82, 0.55) 100%), url(${JSON.stringify(imageUrl)})`,
  };
}

const FEATURES = [
  {
    icon: <ShieldIcon />,
    title: "Reviewed before they go live",
    text: "Our team checks every listing before it appears, so you browse real properties with real prices.",
    href: "/properties?sort=newest",
    cta: "Browse new listings",
  },
  {
    icon: <BellIcon />,
    title: "Alerts for new matches",
    text: "Create an alert on any search and we email you when a matching property is listed.",
    href: "/properties",
    cta: "Start a search",
  },
  {
    icon: <ChatIcon />,
    title: "Talk to sellers directly",
    text: "Call, WhatsApp or message owners and agencies straight from the listing page.",
    href: "/agencies",
    cta: "Find an agency",
  },
];

const POPULAR_SEARCHES = [
  { title: "Homes for sale", query: "purpose=sale&category=residential", label: (city: string) => `Homes for sale in ${city}` },
  { title: "Homes for rent", query: "purpose=rent&category=residential", label: (city: string) => `Homes for rent in ${city}` },
  { title: "Plots for sale", query: "purpose=sale&category=plot", label: (city: string) => `Plots for sale in ${city}` },
  { title: "Commercial property", query: "category=commercial", label: (city: string) => `Commercial property in ${city}` },
];

/** Low-contrast city skyline behind the hero. */
function Skyline() {
  return (
    <svg className="hero-skyline" viewBox="0 0 1440 220" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 220V160h70v-40h60v50h50V90h70v50h40V60h60v70h50v-30h70v60h50V80h80v70h50v-40h70v60h50V70h60v60h50V95h70v60h50v-35h70V60h50v80h60v-40h70v65h50v-50h70v35h50v70z" />
    </svg>
  );
}

export default async function HomePage() {
  // The page still renders (with empty sections) if the API is briefly unavailable; it refreshes within a minute.
  const [home, propertyTypes, agencies, projects] = await Promise.all([
    publicApi<Resource<HomeData>>("home").then((response) => response.data).catch(() => EMPTY_HOME),
    publicApi<Collection<PropertyType>>("property-types", { revalidate: 3600 }).then((response) => response.data).catch(() => []),
    publicApi<Paginated<AgencyProfile>>("agencies", { query: { per_page: 8 }, revalidate: 300 }).catch(() => null),
    publicApi<Paginated<PublicProject>>("projects", { query: { per_page: 6 }, revalidate: 300 }).then((response) => response.data).catch(() => []),
  ]);

  const sections = sectionsOf(home);
  const cities = home.cities.slice(0, 8);
  const hot = sections.show_hot ? (home.hot ?? []) : [];
  const featured = sections.show_featured ? home.featured : [];
  const posts = sections.show_blog ? (home.posts ?? []) : [];
  const hero = heroStyle(sections.hero_image_url);

  return (
    <>
      <section className={`home-hero${hero ? " has-image" : ""}`} style={hero}>
        {!hero && <Skyline />}
        <div className="container">
          <h1>{sections.hero_title ?? DEFAULT_HERO_TITLE}</h1>
          <p className="lead">{sections.hero_subtitle ?? DEFAULT_HERO_SUBTITLE}</p>
          <HeroSearch cities={home.cities} propertyTypes={propertyTypes} />
          <ul className="hero-stats">
            {home.total_listings > 0 && (
              <li>
                <strong>{home.total_listings.toLocaleString("en-PK")}</strong> live {home.total_listings === 1 ? "listing" : "listings"}
              </li>
            )}
            {home.cities.length > 0 && (
              <li>
                <strong>{home.cities.length}</strong> {home.cities.length === 1 ? "city" : "cities"}
              </li>
            )}
            {(agencies?.meta.total ?? 0) > 0 && (
              <li>
                <strong>{agencies?.meta.total}</strong> {agencies?.meta.total === 1 ? "agency" : "agencies"}
              </li>
            )}
          </ul>
        </div>
      </section>

      <div className="container">
        <BannerSlot placement="home_top" className="banner-home-top" />
      </div>

      <section className="section section-tight">
        <div className="container">
          <div className="sell-banner">
            <span className="sell-banner-icon">
              <KeyIcon className="icon-lg" />
            </span>
            <div className="sell-banner-body">
              <h2>Selling or renting out a property?</h2>
              <p>List it in minutes and reach buyers and tenants. Your free plan is ready as soon as you sign up.</p>
            </div>
            <div className="sell-banner-actions">
              <a className="btn btn-primary" href={portalUrl("/listings/new")}>
                Post a property
              </a>
              <Link className="btn btn-outline" href="/pricing">
                See plans
              </Link>
            </div>
          </div>
        </div>
      </section>

      {hot.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-head">
              <div>
                <h2>Hot properties</h2>
                <p>Premium listings getting extra attention right now</p>
              </div>
              <Link href="/properties?hot=1">View all</Link>
            </div>
            <Rail label="Hot properties">
              {hot.map((property, index) => (
                <PropertyCard key={property.id} property={property} priority={index < 2} />
              ))}
            </Rail>
          </div>
        </section>
      )}

      {featured.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-head">
              <div>
                <h2>Featured properties</h2>
                <p>Promoted by their owners and agencies</p>
              </div>
              <Link href="/properties?featured=1">View all</Link>
            </div>
            <Rail label="Featured properties">
              {featured.map((property, index) => (
                <PropertyCard key={property.id} property={property} priority={hot.length === 0 && index < 2} />
              ))}
            </Rail>
          </div>
        </section>
      )}

      <section className="section section-tint">
        <div className="container">
          <div className="section-head">
            <div>
              <h2>Property search, made simple</h2>
              <p>Everything you need to find the right place</p>
            </div>
          </div>
          <div className="feature-grid">
            {FEATURES.map((feature) => (
              <Link key={feature.title} href={feature.href} className="feature-card">
                <span className="feature-icon">{feature.icon}</span>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
                <span className="feature-link">{feature.cta} →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {sections.show_latest && (
        <section className="section">
          <div className="container">
            <div className="section-head">
              <div>
                <h2>Latest listings</h2>
                <p>Fresh on the market</p>
              </div>
              <Link href="/properties?sort=newest">View all</Link>
            </div>
            {home.latest.length > 0 ? (
              <div className="property-grid">
                {home.latest.map((property, index) => (
                  <PropertyCard key={property.id} property={property} priority={hot.length === 0 && featured.length === 0 && index < 2} />
                ))}
              </div>
            ) : (
              <div className="empty-results">
                <h2>No listings yet</h2>
                <p>Be the first to list your property.</p>
                <a className="btn btn-primary" href={portalUrl("/listings/new")}>
                  Post a property
                </a>
              </div>
            )}
          </div>
        </section>
      )}

      {projects.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-head">
              <div>
                <h2>New projects</h2>
                <p>Unit types, prices and payment plans straight from developers</p>
              </div>
              <Link href="/projects">View all</Link>
            </div>
            <Rail label="New projects">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </Rail>
          </div>
        </section>
      )}

      <RecentlyViewed />

      {sections.show_societies && home.popular_societies.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-head">
              <div>
                <h2>Search by popular societies</h2>
                <p>Where buyers and tenants are looking right now</p>
              </div>
            </div>
            <Rail label="Popular societies">
              {home.popular_societies.map((society) => (
                <Link
                  key={society.id}
                  href={`/properties?city_id=${society.city_id}&society_id=${society.id}`}
                  className="community-tile"
                  data-initial={society.name.slice(0, 1).toUpperCase()}
                >
                  <strong>{society.name}</strong>
                  <span>
                    {society.city} · {society.listings_count} listing{society.listings_count === 1 ? "" : "s"}
                  </span>
                </Link>
              ))}
            </Rail>
          </div>
        </section>
      )}

      {sections.show_cities && cities.length > 0 && (
        <section className="section section-tight">
          <div className="container">
            <div className="section-head">
              <div>
                <h2>Browse by city</h2>
              </div>
            </div>
            <div className="chip-list">
              {cities.map((city) => (
                <Link key={city.id} href={`/properties?city_id=${city.id}`} className="chip">
                  {city.name}
                  <small>{city.listings_count}</small>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {sections.show_agencies && agencies && agencies.data.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-head">
              <div>
                <h2>Real estate agencies</h2>
                <p>Meet the teams behind the listings</p>
              </div>
              <Link href="/agencies">View all</Link>
            </div>
            <Rail label="Real estate agencies">
              {agencies.data.map((agency) => (
                <AgencyCard key={agency.id} agency={agency} />
              ))}
            </Rail>
          </div>
        </section>
      )}

      <section className="section section-tight">
        <div className="container">
          <div className="sell-banner wanted-banner">
            <span className="sell-banner-icon">
              <MegaphoneIcon className="icon-lg" />
            </span>
            <div className="sell-banner-body">
              <h2>Can&apos;t find the right property?</h2>
              <p>Post what you are looking for and let owners and agencies with a match get in touch.</p>
            </div>
            <div className="sell-banner-actions">
              <Link className="btn btn-primary" href="/account/requirements/new">
                Post your requirement
              </Link>
              <Link className="btn btn-outline" href="/wanted">
                Browse buyer requirements
              </Link>
            </div>
          </div>
        </div>
      </section>

      {posts.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-head">
              <div>
                <h2>From the blog</h2>
                <p>Guides and market updates</p>
              </div>
              <Link href="/blog">View all</Link>
            </div>
            <div className="post-grid">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        </section>
      )}

      {cities.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-head">
              <div>
                <h2>Popular searches</h2>
              </div>
            </div>
            <div className="link-accordion">
              {POPULAR_SEARCHES.map((group, index) => (
                <details key={group.title} open={index === 0}>
                  <summary>{group.title}</summary>
                  <ul className="link-columns">
                    {cities.map((city) => (
                      <li key={city.id}>
                        <Link href={`/properties?${group.query}&city_id=${city.id}`}>{group.label(city.name)}</Link>
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
