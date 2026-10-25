import type { Metadata } from "next";
import Link from "next/link";
import type { ComponentType } from "react";
import { BuildingIcon, DocumentIcon, HomeIcon, KeyIcon, MapIcon, SearchIcon, UserIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

const QUICK_LINKS: { href: string; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { href: "/properties-for-sale", label: "Properties for sale", icon: HomeIcon },
  { href: "/properties-for-rent", label: "Properties for rent", icon: KeyIcon },
  { href: "/projects", label: "Projects", icon: BuildingIcon },
  { href: "/dha-gujranwala-maps", label: "DHA Gujranwala maps", icon: MapIcon },
  { href: "/dealers", label: "Dealers", icon: UserIcon },
  { href: "/dha-gujranwala-files-rates", label: "File rates", icon: DocumentIcon },
];

export default function NotFound() {
  return (
    <div className="container not-found">
      <div className="not-found-code" aria-hidden="true">
        404
      </div>
      <h1>We could not find that page</h1>
      <p>The link may be broken, or the page or listing may have been sold, rented or removed.</p>

      <div className="not-found-actions">
        <Link className="btn btn-primary" href="/">
          <HomeIcon /> Go to homepage
        </Link>
        <Link className="btn btn-outline" href="/properties">
          <SearchIcon /> Browse properties
        </Link>
      </div>

      <nav className="not-found-links" aria-label="Popular pages">
        <h2>Popular pages</h2>
        <ul>
          {QUICK_LINKS.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link href={href}>
                <Icon />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
