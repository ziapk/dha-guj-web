"use client";

import Image from "next/image";
import Link from "next/link";
import { DeckSlider, type DeckCardState } from "@/components/home/deck-slider";
import { BuildingIcon, ChartIcon, HomeIcon, PinIcon } from "@/components/icons";
import { sizedImage } from "@/lib/image";
import { CONSTRUCTION_STATUS_LABELS } from "@/lib/labels";
import { projectHref, projectLocationOf, projectPhotosOf, projectPriceOf } from "@/lib/project";
import { thumbnailUrl } from "@/lib/property";
import type { PublicProject } from "@/types/api";

/** The four facts under the project name, all drawn from the project itself. */
function factsOf(project: PublicProject) {
  const unitCount = project.units?.length ?? 0;
  const price = projectPriceOf(project);

  return [
    { icon: <HomeIcon className="icon" />, label: CONSTRUCTION_STATUS_LABELS[project.construction_status] },
    { icon: <PinIcon className="icon" />, label: projectLocationOf(project) || "DHA Gujranwala" },
    { icon: <BuildingIcon className="icon" />, label: unitCount > 0 ? `${unitCount} unit type${unitCount === 1 ? "" : "s"}` : "Residential & Commercial" },
    { icon: <ChartIcon className="icon" />, label: price ?? "High investment potential" },
  ];
}

function coverOf(project: PublicProject): string | null | undefined {
  const photos = projectPhotosOf(project);

  return photos[0] ? thumbnailUrl(photos[0]) : sizedImage(project.cover_url, "thumbnail");
}

/** The big card at the front of the deck. The outgoing copy is laid over the incoming one while it fades. */
function FrontCard({ project, state }: { project: PublicProject; state: DeckCardState }) {
  const cover = coverOf(project);
  const leaving = state === "leaving";

  return (
    <article className={`project-hero-card is-${state}`} aria-hidden={leaving} inert={leaving}>
      {cover ? (
        <Image src={cover} alt="" fill priority sizes="(max-width: 1040px) 100vw, 620px" style={{ objectFit: "cover" }} />
      ) : (
        <BuildingIcon className="placeholder-icon" />
      )}
      <span className="project-hero-badge">{CONSTRUCTION_STATUS_LABELS[project.construction_status]}</span>
      <div className="project-hero-body">
        <h3>{project.name}</h3>
        <p>By {project.developer_name}</p>
        <ul className="project-hero-facts">
          {factsOf(project).map((fact) => (
            <li key={fact.label}>
              {fact.icon}
              <span>{fact.label}</span>
            </li>
          ))}
        </ul>
        <div className="project-hero-actions">
          <Link className="btn btn-primary" href={projectHref(project.slug)}>
            View Project
          </Link>
          <Link className="btn btn-light" href={`${projectHref(project.slug)}#enquire`}>
            Show Interest
          </Link>
        </div>
      </div>
    </article>
  );
}

/** Featured projects as a deck; see DeckSlider for how it moves. */
export function FeaturedProjects({ projects }: { projects: PublicProject[] }) {
  return (
    <DeckSlider
      items={projects}
      noun="project"
      nameOf={(project) => project.name}
      renderFront={(project, state) => <FrontCard project={project} state={state} />}
      peekCoverOf={coverOf}
      peekBadgeOf={(project) => CONSTRUCTION_STATUS_LABELS[project.construction_status]}
    />
  );
}
