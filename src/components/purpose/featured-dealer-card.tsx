import Image from "next/image";
import Link from "next/link";
import { AgencyLogo } from "@/components/agency-card";
import { ArrowRightIcon, CalendarIcon, HomeIcon, PinIcon, ShieldCheckIcon, UsersIcon } from "@/components/icons";
import type { AgencyProfile } from "@/types/api";

/** The sidebar dealer spotlight on /buy and /rent: cover photo, name, and a few numbers from the agency profile. */
export function FeaturedDealerCard({ agency }: { agency: AgencyProfile }) {
  const href = `/agencies/${agency.slug}`;
  const listings = agency.listings_count ?? 0;
  const years = agency.established_year ? new Date().getFullYear() - agency.established_year : null;
  const agents = agency.agents?.length ?? 0;

  const stats = [
    { icon: <HomeIcon />, value: listings.toLocaleString("en-PK"), label: listings === 1 ? "Property" : "Properties" },
    years !== null && years > 0 ? { icon: <CalendarIcon />, value: `${years}+`, label: years === 1 ? "Year" : "Years" } : null,
    agents > 0 ? { icon: <UsersIcon />, value: String(agents), label: agents === 1 ? "Agent" : "Agents" } : null,
  ].filter((stat) => stat !== null);

  return (
    <article className="dealer-spotlight">
      <Link href={href} className="dealer-spotlight-cover" tabIndex={-1} aria-hidden="true">
        {agency.cover_url ? (
          <Image src={agency.cover_url} alt="" fill sizes="(max-width: 1023px) 100vw, 300px" style={{ objectFit: "cover" }} />
        ) : (
          <span className="dealer-spotlight-logo">
            <AgencyLogo name={agency.name} logoUrl={agency.logo_url} size={72} />
          </span>
        )}
        <span className="dealer-spotlight-badge">Featured</span>
      </Link>

      <div className="dealer-spotlight-body">
        <h3>
          <Link href={href}>{agency.name}</Link>
        </h3>
        {agency.is_verified && (
          <p className="dealer-spotlight-meta is-verified">
            <ShieldCheckIcon /> Verified Dealer
          </p>
        )}
        <p className="dealer-spotlight-meta">
          <PinIcon /> {agency.city?.name ?? "DHA Gujranwala"}
        </p>

        <ul className="dealer-spotlight-stats">
          {stats.map((stat) => (
            <li key={stat.label}>
              {stat.icon}
              <span>
                <strong>{stat.value}</strong>
                <small>{stat.label}</small>
              </span>
            </li>
          ))}
        </ul>

        <Link href={href} className="dealer-spotlight-link">
          View Dealer Profile <ArrowRightIcon />
        </Link>
      </div>
    </article>
  );
}
