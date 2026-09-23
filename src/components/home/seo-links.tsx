import Link from "next/link";
import { SEO_LINK_GROUPS } from "@/lib/home-content";

/** The keyword link columns at the foot of the home page: size + type + purpose searches. */
export function SeoLinks() {
  return (
    <nav className="seo-links" aria-label="Popular searches">
      {SEO_LINK_GROUPS.map((group) => (
        <div key={group.title} className="seo-group">
          <h2>{group.title}</h2>
          <ul>
            {group.links.map((link) => (
              <li key={link.label}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
