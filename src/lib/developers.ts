import { cache } from "react";
import { NotFoundError, publicApi } from "@/lib/api";
import type { DeveloperSection, DeveloperType, GalleryCategory, Paginated, PublicDeveloper, PublicProject, Resource } from "@/types/api";

const DEVELOPERS_REVALIDATE = 300;

/** GET /public/developers/{slug} returns the company plus a page of its live projects. */
/** GET /public/developers adds headline figures for the directory hero. */
export type DeveloperDirectory = Paginated<PublicDeveloper> & { summary?: { developers: number; projects: number; units: number } };

export type DeveloperPage = Resource<PublicDeveloper> & { projects: Paginated<PublicProject>; featured_project_ids?: number[] };

export const GALLERY_CATEGORY_LABELS: Record<GalleryCategory, string> = {
  projects: "Projects",
  construction: "Construction",
  completed_homes: "Completed Homes",
  architecture: "Architecture",
  interior: "Interior",
  exterior: "Exterior",
  site_visits: "Site Visits",
  events: "Events",
};

const SOCIAL_LABELS: Record<PublicDeveloper["social_links"][number]["platform"], string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  youtube: "YouTube",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
  x: "X",
};

export const DEVELOPER_TYPE_LABELS: Record<DeveloperType, string> = {
  developer: "Developer",
  construction: "Construction company",
  developer_builder: "Developer & builder",
};

export const DEVELOPER_TYPES = Object.keys(DEVELOPER_TYPE_LABELS) as DeveloperType[];

export function developerHref(slug: string): string {
  return `/developer/${slug}`;
}

export const getDeveloper = cache(async (slug: string, page = 1): Promise<DeveloperPage | null> => {
  try {
    return await publicApi<DeveloperPage>(`developers/${encodeURIComponent(slug)}`, { query: { page }, revalidate: DEVELOPERS_REVALIDATE });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return null;
    }

    throw error;
  }
});

/** The company's social links in the admin's order (the API already drops hidden ones). */
export function developerSocials(developer: PublicDeveloper): { key: string; label: string; url: string }[] {
  return (developer.social_links ?? []).map((link) => ({ key: link.platform, label: SOCIAL_LABELS[link.platform] ?? link.platform, url: link.url }));
}

/**
 * The eyebrow and heading for a page section: the admin's wording when typed, else the page's default.
 * A typed heading replaces the default title and its coloured accent word together.
 */
export function sectionHeading(
  developer: PublicDeveloper,
  section: DeveloperSection,
  fallback: { eyebrow?: string; title: string; accent?: string; text?: string },
): { eyebrow?: string; title: string; accent?: string; text?: string } {
  const typed = developer.sections?.[section];
  const heading = typed?.heading?.trim();

  return {
    eyebrow: typed?.label?.trim() || fallback.eyebrow,
    title: heading || fallback.title,
    accent: heading ? undefined : fallback.accent,
    text: typed?.description?.trim() || fallback.text,
  };
}

/** Whole years since the company was established, or null when the year is unknown or this year. */
export function yearsInBusiness(developer: PublicDeveloper, now = new Date()): number | null {
  if (!developer.established_year) {
    return null;
  }

  const years = now.getFullYear() - developer.established_year;

  return years > 0 ? years : null;
}
