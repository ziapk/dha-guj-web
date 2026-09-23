import { cache } from "react";
import { NotFoundError, publicApi } from "@/lib/api";
import type { BlogPostSummary, Paginated, PublicAuthor, Resource } from "@/types/api";

const AUTHORS_REVALIDATE = 300;

/** GET /public/authors/{slug} returns the author plus a page of their published articles. */
type AuthorPage = Resource<PublicAuthor> & { posts: Paginated<BlogPostSummary> };

export function authorHref(slug: string): string {
  return `/author/${slug}`;
}

/**
 * The author directory. Returns null rather than throwing, so a page still renders when the
 * API is unavailable.
 */
export const getAuthors = cache(async (perPage = 24): Promise<PublicAuthor[]> => {
  try {
    const { data } = await publicApi<Paginated<PublicAuthor>>("authors", { query: { per_page: perPage }, revalidate: AUTHORS_REVALIDATE });

    return data;
  } catch {
    return [];
  }
});

export const getAuthor = cache(async (slug: string, page = 1): Promise<AuthorPage | null> => {
  try {
    return await publicApi<AuthorPage>(`authors/${encodeURIComponent(slug)}`, { query: { page }, revalidate: AUTHORS_REVALIDATE });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return null;
    }

    throw error;
  }
});

/** The author's links, in the order they are shown, skipping the ones left empty. */
export function authorSocials(author: PublicAuthor): { key: string; label: string; url: string }[] {
  return (
    [
      { key: "facebook", label: "Facebook", url: author.facebook },
      { key: "instagram", label: "Instagram", url: author.instagram },
      { key: "linkedin", label: "LinkedIn", url: author.linkedin },
      { key: "x", label: "X", url: author.x },
      { key: "youtube", label: "YouTube", url: author.youtube },
      { key: "tiktok", label: "TikTok", url: author.tiktok },
      { key: "website", label: "Website", url: author.website },
    ] as const
  )
    .filter((social): social is typeof social & { url: string } => Boolean(social.url))
    .map((social) => ({ key: social.key, label: social.label, url: social.url }));
}
