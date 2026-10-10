"use client";

import Image from "next/image";
import Link from "next/link";
import { AgencyLogo } from "@/components/agency-card";
import { VerifiedTick, developerFacts } from "@/components/developer-card";
import { DeckSlider, type DeckCardState } from "@/components/home/deck-slider";
import { BuildingIcon } from "@/components/icons";
import { developerHref } from "@/lib/developers";
import { sizedImage } from "@/lib/image";
import type { PublicDeveloper } from "@/types/api";

/** The big card at the front of the deck, drawn with the same classes as the home page's featured projects. */
function FrontCard({ developer, state }: { developer: PublicDeveloper; state: DeckCardState }) {
  const leaving = state === "leaving";
  const projects = developer.projects_count ?? 0;
  const facts = [
    { key: "projects", icon: <BuildingIcon className="icon" />, label: `${projects.toLocaleString("en-PK")} project${projects === 1 ? "" : "s"}` },
    ...developerFacts(developer).map((fact) => ({ key: fact.key, icon: fact.icon, label: fact.key === "units" ? `${fact.value} units` : fact.value })),
  ];

  return (
    <article className={`project-hero-card is-${state}`} aria-hidden={leaving} inert={leaving}>
      {developer.card_image_url ? (
        <Image src={sizedImage(developer.card_image_url, "medium")} alt="" fill priority sizes="(max-width: 1040px) 100vw, 620px" style={{ objectFit: "cover" }} />
      ) : (
        <BuildingIcon className="placeholder-icon" />
      )}
      <span className="project-hero-badge">Featured Developer</span>
      <div className="project-hero-body">
        <div className="dl-deck-head">
          <AgencyLogo name={developer.name} logoUrl={developer.logo_url} size={64} />
          <div style={{ minWidth: 0 }}>
            <h3>
              {developer.name}
              <VerifiedTick developer={developer} />
            </h3>
            {developer.tagline && <p>{developer.tagline}</p>}
          </div>
        </div>
        <ul className="project-hero-facts">
          {facts.map((fact) => (
            <li key={fact.key}>
              {fact.icon}
              <span>{fact.label}</span>
            </li>
          ))}
        </ul>
        <div className="project-hero-actions">
          <Link className="btn btn-primary" href={developerHref(developer.slug)}>
            View Developer Profile
          </Link>
          <Link className="btn btn-light" href={`${developerHref(developer.slug)}#projects`}>
            View Projects
          </Link>
        </div>
      </div>
    </article>
  );
}

/** Featured developers in the same deck slider as the home page's featured projects. */
export function FeaturedDevelopers({ developers }: { developers: PublicDeveloper[] }) {
  return (
    <DeckSlider
      items={developers}
      noun="developer"
      nameOf={(developer) => developer.name}
      renderFront={(developer, state) => <FrontCard developer={developer} state={state} />}
      peekCoverOf={(developer) => sizedImage(developer.card_image_url, "thumbnail")}
      peekBadgeOf={(developer) => (developer.is_verified ? "Trusted" : "Featured")}
    />
  );
}
