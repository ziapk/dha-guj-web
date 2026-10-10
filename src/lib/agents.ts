import { cache } from "react";
import { NotFoundError, publicApi } from "@/lib/api";
import type { Paginated, PublicAgent, Resource } from "@/types/api";

const AGENTS_REVALIDATE = 300;

export const AGENTS_PER_PAGE = 24;

export function agentHref(slug: string): string {
  return `/agent/${slug}`;
}

export type AgentFilters = {
  /** Part of the agent's name. */
  name?: string;
  /** Part of their agency's name. */
  agency?: string;
  /** Only agents an admin tagged as Superstars. */
  superstar?: boolean;
};

/**
 * Approved agents, most active first. Returns an empty page rather than throwing, so the
 * directory and the home page still render when the API is unavailable.
 */
export const getAgents = cache(async (page = 1, perPage = AGENTS_PER_PAGE, filters: AgentFilters = {}): Promise<Paginated<PublicAgent> | null> => {
  const query = {
    page,
    per_page: perPage,
    name: filters.name || undefined,
    agency: filters.agency || undefined,
    superstar: filters.superstar ? 1 : undefined,
  };

  try {
    return await publicApi<Paginated<PublicAgent>>("agents", { query, revalidate: AGENTS_REVALIDATE });
  } catch {
    return null;
  }
});

export const getAgent = cache(async (slug: string): Promise<PublicAgent | null> => {
  try {
    const { data } = await publicApi<Resource<PublicAgent>>(`agents/${encodeURIComponent(slug)}`, { revalidate: AGENTS_REVALIDATE });

    return data;
  } catch (error) {
    if (error instanceof NotFoundError) {
      return null;
    }

    throw error;
  }
});

/** The agent's social links, in the order they are shown, skipping the ones they left empty. */
export function agentSocials(agent: PublicAgent): { key: string; label: string; url: string }[] {
  return (
    [
      { key: "facebook", label: "Facebook", url: agent.facebook },
      { key: "instagram", label: "Instagram", url: agent.instagram },
      { key: "linkedin", label: "LinkedIn", url: agent.linkedin },
      { key: "x", label: "X", url: agent.x },
      { key: "youtube", label: "YouTube", url: agent.youtube },
      { key: "tiktok", label: "TikTok", url: agent.tiktok },
      { key: "website", label: "Website", url: agent.website },
    ] as const
  )
    .filter((social): social is typeof social & { url: string } => Boolean(social.url))
    .map((social) => ({ key: social.key, label: social.label, url: social.url }));
}
