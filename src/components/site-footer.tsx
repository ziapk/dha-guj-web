import Link from "next/link";
import { ContactList, SocialLinks } from "@/components/site-contact";
import { SiteLogo } from "@/components/site-logo";
import { publicApi } from "@/lib/api";
import { portalUrl } from "@/lib/site";
import { DEFAULT_TAGLINE, cmsPageHref, siteNameOf } from "@/lib/site-data";
import type { City, CmsPageSummary, Collection, SiteSettings } from "@/types/api";

export async function SiteFooter({ settings, pages }: { settings: SiteSettings; pages: CmsPageSummary[] }) {
  const siteName = siteNameOf(settings);

  const cities = await publicApi<Collection<City>>("cities", { revalidate: 3600 })
    .then((response) => response.data.slice(0, 6))
    .catch(() => []);

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <SiteLogo siteName={siteName} logoUrl={settings.general.logo_url} />
            <p>{settings.general.tagline ?? DEFAULT_TAGLINE}</p>
            <ContactList contact={settings.contact} className="contact-list footer-contact" />
            <SocialLinks social={settings.social} siteName={siteName} />
          </div>
          <div>
            <h4>Search</h4>
            <ul>
              <li>
                <Link href="/properties?purpose=sale">Properties for sale</Link>
              </li>
              <li>
                <Link href="/properties?purpose=rent">Properties for rent</Link>
              </li>
              <li>
                <Link href="/properties?category=plot">Plots</Link>
              </li>
              <li>
                <Link href="/properties?category=commercial">Commercial</Link>
              </li>
              <li>
                <Link href="/projects">New projects</Link>
              </li>
              <li>
                <Link href="/agencies">Real estate agencies</Link>
              </li>
              <li>
                <Link href="/account/requirements/new">Post your requirement</Link>
              </li>
            </ul>
          </div>
          {cities.length > 0 && (
            <div>
              <h4>Popular cities</h4>
              <ul>
                {cities.map((city) => (
                  <li key={city.id}>
                    <Link href={`/properties?city_id=${city.id}`}>Property in {city.name}</Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <h4>For owners & agencies</h4>
            <ul>
              <li>
                <a href={portalUrl("/listings/new")}>Post a property</a>
              </li>
              <li>
                <Link href="/wanted">Buyer requirements</Link>
              </li>
              <li>
                <Link href="/pricing">Plans & pricing</Link>
              </li>
              <li>
                <a href={portalUrl("/register")}>Create an account</a>
              </li>
              <li>
                <a href={portalUrl("/login")}>Property Admin login</a>
              </li>
            </ul>
          </div>
          <div>
            <h4>Company</h4>
            <ul>
              <li>
                <Link href="/blog">Blog</Link>
              </li>
              {pages.map((page) => (
                <li key={page.id}>
                  <Link href={cmsPageHref(page.slug)}>{page.title}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} {settings.general.site_name ?? "DHA GUJ Real Estate Services"}. All rights reserved.
          </span>
          <nav aria-label="Footer">
            <Link href="/login">Buyer login</Link>
            <a href="/sitemap.xml">Sitemap</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
