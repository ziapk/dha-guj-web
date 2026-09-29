import Image from "next/image";
import Link from "next/link";
import { AgencyLogo } from "@/components/agency-card";
import { BriefcaseIcon, HandshakeIcon, HomeIcon, KeyIcon, PhoneIcon, PinIcon, ShieldCheckIcon, WhatsAppIcon } from "@/components/icons";
import { agentHref } from "@/lib/agents";
import { whatsappNumber } from "@/lib/property";
import type { AgencyAgent, AgencyProfile } from "@/types/api";

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

/**
 * One agent on the agency page. Agents without an approved public profile are named only, and their
 * buttons reach the agency instead.
 */
export function AgencyAgentRow({ agent, agency }: { agent: AgencyAgent; agency: AgencyProfile }) {
  const href = agent.slug ? agentHref(agent.slug) : null;
  const phone = agent.phone ?? agency.phone;
  const whatsapp = whatsappNumber(agent.whatsapp ?? agent.phone ?? agency.whatsapp ?? agency.phone);
  const place = agent.city ?? agency.city?.name ?? null;

  const photo = agent.photo_url ? (
    <Image src={agent.photo_url} alt={agent.name} fill sizes="200px" style={{ objectFit: "cover" }} />
  ) : (
    <span aria-hidden="true">{initials(agent.name)}</span>
  );

  const stats = [
    { icon: <HomeIcon />, value: agent.for_sale_count ?? 0, label: "Properties for Sale" },
    { icon: <KeyIcon />, value: agent.for_rent_count ?? 0, label: "Properties for Rent" },
    { icon: <HandshakeIcon />, value: agent.closed_deals_count ?? 0, label: "Closed Deals" },
  ];

  return (
    <article className="agency-agent">
      {href ? (
        <Link href={href} className="agency-agent-photo" aria-label={`${agent.name}'s profile`}>
          {photo}
        </Link>
      ) : (
        <div className="agency-agent-photo">{photo}</div>
      )}

      <div className="agency-agent-body">
        <div className="agency-agent-head">
          <div>
            <h3>
              {href ? <Link href={href}>{agent.name}</Link> : agent.name}
              {agent.slug && <ShieldCheckIcon className="icon agency-verified-tick" />}
            </h3>
            <p className="agency-agent-role">{agent.designation ?? "Property Agent"}</p>
          </div>
          <span className="agency-agent-logo">
            <AgencyLogo name={agency.name} logoUrl={agency.logo_url} size={48} />
          </span>
        </div>

        {(place || agent.experience_years) && (
          <ul className="agency-agent-meta">
            {place && (
              <li>
                <PinIcon /> {place}
              </li>
            )}
            {agent.experience_years ? (
              <li>
                <BriefcaseIcon /> {agent.experience_years}+ Years Experience
              </li>
            ) : null}
          </ul>
        )}

        <div className="agency-agent-foot">
          <ul className="agency-agent-stats">
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
          <div className="agency-agent-actions">
            {phone && (
              <a className="btn btn-outline" href={`tel:${phone.replace(/[^\d+]/g, "")}`} aria-label={`Call ${agent.name}`}>
                <PhoneIcon /> Call
              </a>
            )}
            {whatsapp && (
              <a className="btn btn-whatsapp" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${agent.name} (opens in a new tab)`}>
                <WhatsAppIcon /> WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
