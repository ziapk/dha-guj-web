"use client";

import { Modal } from "antd";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowRightIcon,
  BuildingIcon,
  CameraIcon,
  ChartIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  ExpandIcon,
  HomeIcon,
  LayersIcon,
  PinIcon,
  TagIcon,
} from "@/components/icons";
import { Rail } from "@/components/rail";
import { CONSTRUCTION_STATUS_LABELS } from "@/lib/labels";
import { projectHref, projectLocationOf, projectPhotosOf, projectPriceOf } from "@/lib/project";
import { mediumUrl, thumbnailUrl } from "@/lib/property";
import type { PublicProject } from "@/types/api";

type Slide = { key: string; kind: "image"; src: string; thumb: string } | { key: string; kind: "video"; embed: string; thumb: string | null };

/** The YouTube video id in a watch, share, shorts or embed link, or null for anything else. */
function youtubeIdOf(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);

  return match ? match[1] : null;
}

function slidesOf(project: PublicProject): Slide[] {
  const slides: Slide[] = projectPhotosOf(project).map((photo) => ({ key: `p${photo.id}`, kind: "image", src: mediumUrl(photo), thumb: thumbnailUrl(photo) }));
  const videoId = project.video_url ? youtubeIdOf(project.video_url) : null;

  if (videoId) {
    slides.push({ key: "video", kind: "video", embed: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`, thumb: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` });
  }

  return slides;
}

/** "Residential Plots", "Houses, Apartments" or "4 unit types" — what the project sells. */
function unitsOf(project: PublicProject): string | null {
  if (project.unit_type) {
    return project.unit_type;
  }

  const units = project.units ?? [];
  const types = [...new Set(units.map((unit) => unit.property_type?.name).filter(Boolean))];

  return types.length ? types.join(", ") : units.length ? `${units.length} unit type${units.length === 1 ? "" : "s"}` : null;
}

function locationText(project: PublicProject): string {
  return project.location || projectLocationOf(project) || project.city?.name || "";
}

/** A developer's portfolio: light cards in a rail; each opens the project showcase. */
export function PortfolioProjects({ projects, label }: { projects: PublicProject[]; label: string }) {
  const [open, setOpen] = useState<PublicProject | null>(null);

  return (
    <>
      <Rail label={label}>
        {projects.map((project) => (
          <PortfolioCard key={project.id} project={project} onOpen={() => setOpen(project)} />
        ))}
      </Rail>
      <Modal
        open={open !== null}
        onCancel={() => setOpen(null)}
        footer={null}
        width={1180}
        centered
        destroyOnHidden
        closable={false}
        className="pf-modal"
        title={null}
        aria-label={open?.name}
      >
        {open && <ProjectShowcase project={open} onClose={() => setOpen(null)} />}
      </Modal>
    </>
  );
}

function PortfolioCard({ project, onOpen }: { project: PublicProject; onOpen: () => void }) {
  const photos = projectPhotosOf(project);
  const cover = photos[0] ? mediumUrl(photos[0]) : project.cover_url;
  const location = locationText(project);

  return (
    <article className="pf-card">
      <button type="button" className="pf-card-button" onClick={onOpen} aria-label={`View ${project.name}`}>
        <div className="pf-card-cover">
          {cover ? (
            <Image src={cover} alt={project.name} width={0} height={0} sizes="(max-width: 900px) 86vw, (max-width: 1100px) 50vw, 33vw" className="pf-fit" />
          ) : (
            <BuildingIcon className="placeholder-icon" />
          )}
          <span className="pf-card-shade" />
          <span className={`badge project-status project-status-${project.construction_status}`}>{CONSTRUCTION_STATUS_LABELS[project.construction_status]}</span>
          {photos.length > 1 && (
            <span className="photo-count">
              <CameraIcon /> {photos.length}
            </span>
          )}
          <div className="pf-card-caption">
            <h3>{project.name}</h3>
            {location && (
              <p>
                <PinIcon /> <span>{location}</span>
              </p>
            )}
          </div>
        </div>
      </button>
    </article>
  );
}

function ProjectShowcase({ project, onClose }: { project: PublicProject; onClose: () => void }) {
  const slides = slidesOf(project);
  const [index, setIndex] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const location = locationText(project);
  const price = projectPriceOf(project);
  const units = unitsOf(project);
  const status = CONSTRUCTION_STATUS_LABELS[project.construction_status];
  const type = project.project_type || project.category;
  const current = slides[index];

  const go = (next: number) => slides.length && setIndex((next + slides.length) % slides.length);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") setIndex((value) => (value - 1 + slides.length) % Math.max(slides.length, 1));
      if (event.key === "ArrowRight") setIndex((value) => (value + 1) % Math.max(slides.length, 1));
    }

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [slides.length]);

  // Keep the active thumbnail in view.
  useEffect(() => {
    stripRef.current?.querySelector<HTMLElement>(`[data-index="${index}"]`)?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, [index]);

  function fullscreen() {
    const stage = stageRef.current;

    if (!stage) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void stage.requestFullscreen?.();
  }

  function scrollStrip(direction: 1 | -1) {
    const strip = stripRef.current;

    strip?.scrollBy({ left: direction * strip.clientWidth * 0.8, behavior: "smooth" });
  }

  const facts: { key: string; label: string; icon: ReactNode; value: ReactNode }[] = [
    type ? { key: "type", label: "Project Type", icon: <HomeIcon />, value: type } : null,
    location ? { key: "location", label: "Location", icon: <PinIcon />, value: location } : null,
    { key: "status", label: "Status", icon: <ClockIcon />, value: <span className={`pf-pill pf-pill-${project.construction_status}`}>{status}</span> },
    price ? { key: "price", label: "Price Range", icon: <TagIcon />, value: price } : null,
    units ? { key: "units", label: "Units", icon: <LayersIcon />, value: units } : null,
    { key: "developer", label: "Developer", icon: <BuildingIcon />, value: project.developer_name },
  ].filter((fact): fact is NonNullable<typeof fact> => fact !== null);

  return (
    <div className="pf-showcase">
      <button type="button" className="pf-close" onClick={onClose} aria-label="Close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>

      {/* Main photo */}
      <div ref={stageRef} className="pf-stage">
        {!current ? (
          <div className="pf-stage-empty">
            <BuildingIcon className="placeholder-icon" />
          </div>
        ) : current.kind === "image" ? (
          <Image key={current.key} src={current.src} alt={`${project.name} photo ${index + 1}`} width={0} height={0} sizes="(max-width: 1200px) 100vw, 1180px" className="pf-fit" priority />
        ) : (
          <iframe key={current.key} src={current.embed} title={`${project.name} video`} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
        )}
        {slides.length > 1 && (
          <>
            <button type="button" className="pf-nav prev" onClick={() => go(index - 1)} aria-label="Previous photo">
              <ChevronLeftIcon />
            </button>
            <button type="button" className="pf-nav next" onClick={() => go(index + 1)} aria-label="Next photo">
              <ChevronRightIcon />
            </button>
          </>
        )}
        {slides.length > 0 && (
          <div className="pf-stage-meta">
            <span>
              {index + 1} / {slides.length}
            </span>
            <button type="button" onClick={fullscreen} aria-label="Full screen">
              <ExpandIcon />
            </button>
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {slides.length > 1 && (
        <div className="pf-strip-wrap">
          <div ref={stripRef} className="pf-strip">
            {slides.map((slide, position) => (
              <button
                key={slide.key}
                type="button"
                data-index={position}
                className={position === index ? "is-active" : undefined}
                onClick={() => setIndex(position)}
                aria-label={slide.kind === "video" ? "Play video" : `Photo ${position + 1}`}
                aria-current={position === index}
              >
                {slide.kind === "image" ? (
                  <Image src={slide.thumb} alt="" fill sizes="160px" style={{ objectFit: "cover" }} />
                ) : (
                  // YouTube's own thumbnail host is not an optimised image domain.
                  // eslint-disable-next-line @next/next/no-img-element
                  slide.thumb && <img src={slide.thumb} alt="" loading="lazy" />
                )}
                {slide.kind === "video" && (
                  <span className="pf-play">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M8 5v14l11-7z" fill="currentColor" />
                    </svg>
                  </span>
                )}
              </button>
            ))}
          </div>
          <button type="button" className="pf-strip-next" onClick={() => scrollStrip(1)} aria-label="More photos">
            <ChevronRightIcon />
          </button>
        </div>
      )}

      {/* Details */}
      <div className="pf-body">
        <div className="pf-main">
          <div className="pf-title">
            <h2>{project.name}</h2>
            <span className={`pf-pill pf-pill-${project.construction_status}`}>
              <i aria-hidden="true" /> {status}
            </span>
          </div>
          {type && <p className="pf-type">{type}</p>}
          {location && (
            <p className="pf-location">
              <PinIcon /> {location}
            </p>
          )}
          <hr />
          <h3>Project Overview</h3>
          {project.description ? (
            <div className="prose pf-overview" dangerouslySetInnerHTML={{ __html: project.description }} />
          ) : (
            <p className="pf-overview">{project.short_description ?? `${project.name} by ${project.developer_name}.`}</p>
          )}
        </div>

        <aside className="pf-facts">
          <dl>
            {facts.map((fact) => (
              <div key={fact.key}>
                <dt>
                  {fact.icon} {fact.label}
                </dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
          {project.kind !== "portfolio" && (
            <Link href={projectHref(project.slug)} className="pf-more">
              <ChartIcon /> View full project details <ArrowRightIcon />
            </Link>
          )}
        </aside>
      </div>
    </div>
  );
}
