import Image from "next/image";
import Link from "next/link";
import { ContactButtons, initials } from "@/components/home/agent-card";
import { BriefcaseIcon, HandshakeIcon, KeyIcon, PinIcon, StarIcon, TagIcon } from "@/components/icons";
import { agentHref } from "@/lib/agents";
import { whatsappNumber } from "@/lib/property";
import type { PublicAgent } from "@/types/api";

/**
 * The agents directory card: the agency's cover photo across the top, the agent's round photo
 * overlapping it with their name and agency beside it, then sale / rent / closed-deal counts and
 * the contact buttons. Superstars get a gold badge on the cover.
 */
export function AgentProfileCard({
  agent,
  fallbackPhone,
  fallbackWhatsapp,
}: {
  agent: PublicAgent;
  fallbackPhone: string | null;
  fallbackWhatsapp: string | null;
}) {
  const href = agentHref(agent.slug);
  // An agent without their own number falls back to the site's, so the buttons are never dead.
  const phone = agent.phone ?? fallbackPhone;
  const whatsapp = whatsappNumber(agent.whatsapp ?? fallbackWhatsapp);
  const cover = agent.agency?.cover_url;

  const stats = [
    { icon: <TagIcon className="icon" />, value: agent.for_sale_count ?? agent.listings_count ?? 0, label: "For Sale" },
    { icon: <KeyIcon className="icon" />, value: agent.for_rent_count ?? 0, label: "For Rent" },
    { icon: <HandshakeIcon className="icon" />, value: agent.closed_deals_count ?? 0, label: "Closed Deals" },
  ];

  return (
    <article className={`agent-pro-card${agent.is_superstar ? " is-superstar" : ""}`}>
      <div className="agent-pro-cover">
        {cover && <Image src={cover} alt="" fill sizes="(max-width: 640px) 100vw, 320px" style={{ objectFit: "cover" }} />}
        {agent.is_superstar && (
          <span className="superstar-badge">
            <StarIcon className="icon" /> Superstar Agent
          </span>
        )}
      </div>

      <div className="agent-pro-head">
        <Link href={href} className="agent-pro-photo" aria-label={`${agent.name}'s profile`}>
          {agent.photo_url ? (
            <Image src={agent.photo_url} alt={agent.name} fill sizes="92px" style={{ objectFit: "cover" }} />
          ) : (
            <span aria-hidden="true">{initials(agent.name)}</span>
          )}
        </Link>
        <div className="agent-pro-name">
          <h3>
            <Link href={href}>{agent.name}</Link>
          </h3>
          {agent.agency ? (
            <p className="agent-agency">
              <Link href={`/dealer/${agent.agency.slug}`}>{agent.agency.name}</Link>
            </p>
          ) : (
            <p className="agent-agency">{agent.designation ?? "Independent agent"}</p>
          )}
        </div>
      </div>

      <p className="agent-pro-meta">
        <span>
          <PinIcon className="icon" />
          {agent.city?.name ? `DHA ${agent.city.name}` : "DHA Gujranwala"}
        </span>
        {agent.experience_years ? (
          <span>
            <BriefcaseIcon className="icon" />
            {agent.experience_years}+ Years Exp.
          </span>
        ) : null}
      </p>

      <ul className="agent-pro-stats">
        {stats.map((stat) => (
          <li key={stat.label}>
            {stat.icon}
            <div>
              <strong>{stat.value}</strong>
              <small>{stat.label}</small>
            </div>
          </li>
        ))}
      </ul>

      <ContactButtons agent={agent} phone={phone} whatsapp={whatsapp} />
    </article>
  );
}
