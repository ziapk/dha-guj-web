import Image from "next/image";
import Link from "next/link";
import { BriefcaseIcon, DiamondIcon, HomeIcon, PhoneIcon, WhatsAppIcon } from "@/components/icons";
import { agentHref } from "@/lib/agents";
import { whatsappNumber } from "@/lib/property";
import type { PublicAgent } from "@/types/api";

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
 * One agent: photo, agency, two stats and the call buttons. An agent without their own number
 * falls back to the site's contact details, so the buttons are never dead.
 */
export function AgentCard({ agent, fallbackPhone, fallbackWhatsapp }: { agent: PublicAgent; fallbackPhone: string | null; fallbackWhatsapp: string | null }) {
  const phone = agent.phone ?? fallbackPhone;
  const whatsapp = whatsappNumber(agent.whatsapp ?? fallbackWhatsapp);
  const href = agentHref(agent.slug);

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
    </article>
  );
}
