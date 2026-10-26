import type { PublicProject } from "@/types/api";

/**
 * Alt text for images: the alt saved in the admin when someone wrote one (null until then), else a short
 * description built from the record. Decorative images (in a link or card that already names the same thing)
 * take alt="" at the call site instead.
 */
export function altText(saved: string | null | undefined, fallback: string): string {
  return saved?.trim() || fallback;
}

/** A company or dealer logo: "{name} logo". */
export function logoAlt(name: string, saved?: string | null): string {
  return altText(saved, `${name} logo`);
}

/**
 * A photo in a gallery whose heading already names the listing or project: the first (cover) photo takes the title,
 * the rest a short "Photo 3 of 12" rather than repeating the title on every one.
 */
export function galleryPhotoAlt(saved: string | null | undefined, title: string, index: number, total: number): string {
  return altText(saved, index === 0 ? title : `Photo ${index + 1} of ${total}`);
}

/** A project's cover picture (its first gallery photo, else the cover): saved alt, else the project name. */
export function projectCoverAlt(project: Pick<PublicProject, "name" | "media" | "cover_alt">): string {
  const photo = (project.media ?? []).find((media) => media.type === "image");

  return altText(photo?.alt_text || project.cover_alt, project.name);
}
