import { cache } from "react";
import { NotFoundError, publicApi } from "@/lib/api";
import type { AgencyAgent, AgencyProfile, Paginated, PublicAgent, Resource } from "@/types/api";

const AGENTS_REVALIDATE = 300;

export const AGENTS_PER_PAGE = 24;

export function agentHref(slug: string): string {
  return `/agent/${slug}`;
}

/**
 * An agent from an agency's page, in the directory's shape so it can use the same card. Agents without an
 * approved public profile come through with an empty slug (the card then has no profile link) and no contact
 * details of their own, so the card's fallbacks — the agency's numbers — take over.
 */
export function agencyAgentAsPublic(agent: AgencyAgent, agency: AgencyProfile): PublicAgent {
  return {
    id: agent.id,
    slug: agent.slug ?? "",
    name: agent.name,
    designation: agent.designation,
    short_bio: null,
    photo_url: agent.photo_url,
    experience_years: agent.experience_years,
    specialisation: null,
    areas_of_expertise: [],
    languages: null,
    phone: agent.phone,
    whatsapp: agent.whatsapp ?? agent.phone,
    email: null,
    facebook: null,
    instagram: null,
    linkedin: null,
    x: null,
    youtube: null,
    tiktok: null,
    website: null,
    is_superstar: false,
    // The agency page only names the agent's city; the card reads nothing but the name.
    city: agent.city ? { id: 0, name: agent.city, slug: "" } : (agency.city ?? null),
    agency: { name: agency.name, slug: agency.slug, logo_url: agency.logo_url, cover_url: agency.cover_url, is_verified: agency.is_verified },
    for_sale_count: agent.for_sale_count,
    for_rent_count: agent.for_rent_count,
    closed_deals_count: agent.closed_deals_count,
    created_at: agency.created_at,
  };
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
