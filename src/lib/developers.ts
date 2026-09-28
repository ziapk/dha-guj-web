import { cache } from "react";
import { NotFoundError, publicApi } from "@/lib/api";
import type { DeveloperType, Paginated, PublicDeveloper, PublicProject, Resource } from "@/types/api";

const DEVELOPERS_REVALIDATE = 300;

/** GET /public/developers/{slug} returns the company plus a page of its live projects. */
export type DeveloperPage = Resource<PublicDeveloper> & { projects: Paginated<PublicProject> };

export const DEVELOPER_TYPE_LABELS: Record<DeveloperType, string> = {
  developer: "Developer",
  construction: "Construction company",
  developer_builder: "Developer & builder",
};

export const DEVELOPER_TYPES = Object.keys(DEVELOPER_TYPE_LABELS) as DeveloperType[];

export function developerHref(slug: string): string {
  return `/developers/${slug}`;
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

/** The company's links, in the order they are shown, skipping the ones left empty. */
export function developerSocials(developer: PublicDeveloper): { key: string; label: string; url: string }[] {
  return (
    [
      { key: "facebook", label: "Facebook", url: developer.facebook },
      { key: "instagram", label: "Instagram", url: developer.instagram },
      { key: "linkedin", label: "LinkedIn", url: developer.linkedin },
      { key: "youtube", label: "YouTube", url: developer.youtube },
    ] as const
  )
    .filter((social): social is typeof social & { url: string } => Boolean(social.url))
    .map((social) => ({ key: social.key, label: social.label, url: social.url }));
}
