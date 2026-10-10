import Link from "next/link";
import { getSearchPages, searchPageGroups } from "@/lib/search-pages";

/** The keyword link columns at the foot of the home page; each opens a landing page managed in the Admin Portal. */
export async function SeoLinks() {
  const groups = searchPageGroups(await getSearchPages(true));

  if (groups.length === 0) {
    return null;
  }

  return (
    <section className="section section-seo">
      <div className="container">
        <nav className="seo-links" aria-label="Popular searches">
          {groups.map((group) => (
            <div key={group.title} className="seo-group">
              <h2>{group.title}</h2>
              <ul>
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </section>
  );
}
