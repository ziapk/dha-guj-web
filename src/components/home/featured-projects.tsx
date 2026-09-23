"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { ArrowLeftIcon, ArrowRightIcon, BuildingIcon, ChartIcon, HomeIcon, PinIcon } from "@/components/icons";
import { CONSTRUCTION_STATUS_LABELS } from "@/lib/labels";
import { projectHref, projectLocationOf, projectPhotosOf, projectPriceOf } from "@/lib/project";
import { thumbnailUrl } from "@/lib/property";
import type { PublicProject } from "@/types/api";

/** How many projects wait behind the front card. Slots past this are not drawn. */
const PEEK_SLOTS = 3;

/** Must outlast the crossfade in globals.css, or the outgoing card is cut off mid-fade. */
const CROSSFADE_MS = 460;

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

  return photos[0] ? thumbnailUrl(photos[0]) : project.cover_url;
}

/** The big card at the front of the deck. The outgoing copy is laid over the incoming one while it fades. */
function FrontCard({ project, state }: { project: PublicProject; state: "entering" | "leaving" }) {
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

/**
 * Featured projects as a deck: the selected project fills the front card and the next few fan out
 * behind it to the right, each one stepped down and veiled a little more blue to read as depth.
 * Changing project crossfades — the outgoing card stays put and fades while the incoming one
 * scales up underneath it, so the panel background never shows through the swap.
 */
export function FeaturedProjects({ projects }: { projects: PublicProject[] }) {
  const [index, setIndex] = useState(0);
  const [leaving, setLeaving] = useState<PublicProject | null>(null);
  const active = projects[index];

  // Retire the outgoing card once its fade has finished.
  useEffect(() => {
    if (!leaving) {
      return;
    }

    const timer = setTimeout(() => setLeaving(null), CROSSFADE_MS);

    return () => clearTimeout(timer);
  }, [leaving]);

  if (!active) {
    return null;
  }

  function show(next: number) {
    if (next === index) {
      return;
    }

    // With reduced motion there is no fade to cover the swap, so nothing is kept behind.
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    setLeaving(reduceMotion ? null : projects[index]);
    setIndex(next);
  }

  const step = (direction: 1 | -1) => show((index + direction + projects.length) % projects.length);
  /** The projects queued behind the front card, nearest first. */
  const behind = Array.from({ length: Math.min(PEEK_SLOTS, projects.length - 1) }, (_, offset) => ({
    project: projects[(index + offset + 1) % projects.length],
    slot: offset + 1,
  }));

  return (
    <div className="project-showcase">
      <p className="project-tagline">
        Shaping a brighter
        <strong>DHA Gujranwala</strong>
      </p>

      {/* The deck only reserves room to its right for the cards it actually has. */}
      <div className="project-stack" style={{ "--peeks": behind.length } as CSSProperties}>
        <div className="project-front">
          {/* Keyed by project so the two cards are distinct elements and can animate past each other. */}
          <FrontCard key={active.id} project={active} state="entering" />
          {leaving && <FrontCard key={`leaving-${leaving.id}`} project={leaving} state="leaving" />}
        </div>

        {/* Keyed by slot, not by project: the cards stay mounted and only swap their photo, so the
            deck shifts without each one blinking through its own background first. */}
        {behind.map(({ project, slot }) => {
          const peekCover = coverOf(project);

          return (
            <button key={slot} type="button" className="project-peek" data-slot={slot} onClick={() => show((index + slot) % projects.length)} aria-label={`Show ${project.name}`}>
              {peekCover && <Image src={peekCover} alt="" fill sizes="210px" style={{ objectFit: "cover" }} />}
              <span className="project-peek-badge">{CONSTRUCTION_STATUS_LABELS[project.construction_status]}</span>
            </button>
          );
        })}

        {projects.length > 1 && (
          <>
            <button type="button" className="project-arrow prev" onClick={() => step(-1)} aria-label="Previous project">
              <ArrowLeftIcon className="icon" />
            </button>
            <button type="button" className="project-arrow next" onClick={() => step(1)} aria-label="Next project">
              <ArrowRightIcon className="icon" />
            </button>
          </>
        )}
      </div>

      {projects.length > 1 && (
        <div className="project-dots">
          {projects.map((project, dot) => (
            <button
              key={project.id}
              type="button"
              aria-label={project.name}
              aria-current={dot === index ? "true" : undefined}
              className={dot === index ? "is-active" : undefined}
              onClick={() => show(dot)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
