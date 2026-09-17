import Image from "next/image";
import Link from "next/link";
import { BuildingIcon, CalendarIcon, CameraIcon, PinIcon } from "@/components/icons";
import { CONSTRUCTION_STATUS_LABELS } from "@/lib/labels";
import { completionOf, projectHref, projectLocationOf, projectPhotosOf, projectPriceOf } from "@/lib/project";
import { thumbnailUrl } from "@/lib/property";
import type { PublicProject } from "@/types/api";

export function ProjectCard({ project, priority = false }: { project: PublicProject; priority?: boolean }) {
  const photos = projectPhotosOf(project);
  const cover = photos[0] ? thumbnailUrl(photos[0]) : project.cover_url;
  const price = projectPriceOf(project);
  const unitCount = project.units?.length ?? 0;
  const location = projectLocationOf(project);

  return (
    <article className="property-card project-card">
      <Link href={projectHref(project.slug)} className="property-card-link">
        <div className="property-card-cover">
          {cover ? (
            <Image src={cover} alt={project.name} fill priority={priority} sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 33vw" style={{ objectFit: "cover" }} />
          ) : (
            <BuildingIcon className="placeholder-icon" />
          )}
          <div className="property-card-badges">
            <span className={`badge project-status project-status-${project.construction_status}`}>{CONSTRUCTION_STATUS_LABELS[project.construction_status]}</span>
          </div>
          {photos.length > 1 && (
            <span className="photo-count">
              <CameraIcon /> {photos.length}
            </span>
          )}
        </div>

        <div className="property-card-body">
          <span className="property-card-type">By {project.developer_name}</span>
          <div className="property-card-price">{price ?? <small>Price on request</small>}</div>
          <h3 className="property-card-title">{project.name}</h3>
          {location && (
            <p className="property-card-location">
              <PinIcon /> <span>{location}</span>
            </p>
          )}
          <div className="property-card-foot">
            <span>
              <BuildingIcon /> {unitCount} unit type{unitCount === 1 ? "" : "s"}
            </span>
            {project.completion_date && project.construction_status !== "ready" && (
              <span className="project-card-date">
                <CalendarIcon /> Completion {completionOf(project.completion_date)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}
