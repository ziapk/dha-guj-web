import Image from "next/image";
import Link from "next/link";
import { BriefcaseIcon, DiamondIcon, HomeIcon, KeyIcon, PhoneIcon, PinIcon, ShieldCheckIcon, TagIcon, WhatsAppIcon } from "@/components/icons";
import { agentHref } from "@/lib/agents";
import { whatsappNumber } from "@/lib/property";
import type { PublicAgent } from "@/types/api";

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function ContactButtons({ agent, phone, whatsapp }: { agent: PublicAgent; phone: string | null; whatsapp: string | null }) {
  return (
    <div className="agent-actions">
      {phone && (
        <a className="btn btn-primary" href={`tel:${phone.replace(/[^\d+]/g, "")}`} aria-label={`Call ${agent.name}`}>
          <PhoneIcon className="icon" /> Call
        </a>
      )}
      {whatsapp && (
        <a
          className="btn btn-whatsapp"
          href={`https://wa.me/${whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`WhatsApp ${agent.name} (opens in a new tab)`}
        >
          <WhatsAppIcon className="icon" /> WhatsApp
        </a>
      )}
    </div>
  );
}

/**
 * The home page's "Top Rated Agents" card: photo on the left with the name beside it, then a
 * strip of three stats. The sale/rent/deal counts only come with the agent's own page, so the
 * list's live listing count and experience stand in when they are missing.
 */
function AgentRowCard({ agent, phone, whatsapp }: { agent: PublicAgent; phone: string | null; whatsapp: string | null }) {
  const href = agentHref(agent.slug);
  const stats =
    agent.for_sale_count !== undefined
      ? [
          { icon: <TagIcon className="icon" />, value: agent.for_sale_count, label: "Properties for Sale" },
          { icon: <KeyIcon className="icon" />, value: agent.for_rent_count ?? 0, label: "Properties for Rent" },
          { icon: <BriefcaseIcon className="icon" />, value: agent.closed_deals_count ?? 0, label: "Closed Deals" },
        ]
      : [
          { icon: <HomeIcon className="icon" />, value: agent.listings_count ?? 0, label: "Live Listings" },
          { icon: <BriefcaseIcon className="icon" />, value: agent.experience_years ? `${agent.experience_years}+` : "—", label: "Years Experience" },
        ];

  return (
    <article className="agent-card agent-card-row">
      <span className="agent-verified">
        <ShieldCheckIcon className="icon" /> Verified
      </span>

      <div className="agent-card-top">
        <Link href={href} className="agent-photo" aria-label={`${agent.name}'s profile`}>
          {agent.photo_url ? (
            <Image src={agent.photo_url} alt={agent.name} fill sizes="96px" style={{ objectFit: "cover" }} />
          ) : (
            <span aria-hidden="true">{initials(agent.name)}</span>
          )}
        </Link>
        <div className="agent-card-info">
          <h3>
            <Link href={href}>{agent.name}</Link>
          </h3>
          {agent.agency ? (
            <p className="agent-agency">
              <Link href={`/agencies/${agent.agency.slug}`}>{agent.agency.name}</Link>
            </p>
          ) : (
            agent.designation && <p className="agent-agency">{agent.designation}</p>
          )}
          <p className="agent-card-meta">
            <span>
              <PinIcon className="icon" />
              {agent.city?.name ? `DHA ${agent.city.name}` : "DHA Gujranwala"}
            </span>
            {agent.experience_years ? (
              <span>
                <BriefcaseIcon className="icon" />
                {agent.experience_years}+ Years Experience
              </span>
            ) : null}
          </p>
        </div>
      </div>

      <ul className="agent-stats">
        {stats.map((stat) => (
          <li key={stat.label}>
            {stat.icon}
            <strong>{stat.value}</strong>
            <small>{stat.label}</small>
          </li>
        ))}
      </ul>

      <ContactButtons agent={agent} phone={phone} whatsapp={whatsapp} />
    </article>
  );
}

/**
 * One agent: photo, agency, two stats and the call buttons. An agent without their own number
 * falls back to the site's contact details, so the buttons are never dead.
 */
export function AgentCard({
  agent,
  fallbackPhone,
  fallbackWhatsapp,
  layout = "column",
}: {
  agent: PublicAgent;
  fallbackPhone: string | null;
  fallbackWhatsapp: string | null;
  /** "row" is the home page's wide card; the agents directory keeps the tall one. */
  layout?: "column" | "row";
}) {
  const phone = agent.phone ?? fallbackPhone;
  const whatsapp = whatsappNumber(agent.whatsapp ?? fallbackWhatsapp);
  const href = agentHref(agent.slug);

  if (layout === "row") {
    return <AgentRowCard agent={agent} phone={phone} whatsapp={whatsapp} />;
  }

  return (
    <article className="agent-card">
      {agent.designation && (
        <span className="agent-badge tone-blue">
          <DiamondIcon className="icon" />
          {agent.designation}
        </span>
      )}

      <Link href={href} className="agent-photo" aria-label={`${agent.name}'s profile`}>
        {agent.photo_url ? (
          <Image src={agent.photo_url} alt={agent.name} fill sizes="140px" style={{ objectFit: "cover" }} />
        ) : (
          <span aria-hidden="true">{initials(agent.name)}</span>
        )}
      </Link>

      <h3>
        <Link href={href}>{agent.name}</Link>
      </h3>
      {agent.agency ? (
        <p className="agent-agency">
          <Link href={`/agencies/${agent.agency.slug}`}>{agent.agency.name}</Link>
        </p>
      ) : (
        agent.specialisation && <p className="agent-agency">{agent.specialisation}</p>
      )}

      <ul className="agent-stats">
        <li>
          <BriefcaseIcon className="icon" />
          <div>
            <strong>{agent.experience_years ? `${agent.experience_years}+` : "—"}</strong>
            <small>Years Experience</small>
          </div>
        </li>
        <li>
          <HomeIcon className="icon" />
          <div>
            <strong>{agent.listings_count ?? 0}</strong>
            <small>Live Listings</small>
          </div>
        </li>
      </ul>

      <ContactButtons agent={agent} phone={phone} whatsapp={whatsapp} />
    </article>
  );
}
