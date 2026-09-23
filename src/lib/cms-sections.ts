import { cache } from "react";
import { NotFoundError, publicApi } from "@/lib/api";
import type { AboutSections, CmsPage, ContactSections, Resource } from "@/types/api";

const SECTIONS_REVALIDATE = 300;

export const ABOUT_SLUG = "about-us";
export const CONTACT_SLUG = "contact";

const EMPTY_ABOUT: AboutSections = {
  hero: { title: null, subtitle: null, image_url: null },
  intro_html: null,
  offers: [],
  why_us: [],
  vision: { heading: null, text: null },
  mission: { heading: null, text: null, points: [] },
  stats: [],
  leadership: [],
  cta: { heading: null, text: null, button_label: null, button_url: null },
};

const EMPTY_CONTACT: ContactSections = {
  hero: { title: null, subtitle: null, image_url: null },
  intro_html: null,
  cards: [],
  office_hours: [],
  map_embed_url: null,
  form: { heading: null, text: null, consent_text: null, success_message: null },
  dealers: { show: true, heading: null, text: null },
  faqs: [],
};

/** One published page by slug, or null when an admin has unpublished or deleted it. */
const getPage = cache(async (slug: string): Promise<CmsPage | null> => {
  try {
    const { data } = await publicApi<Resource<CmsPage>>(`pages/${slug}`, { revalidate: SECTIONS_REVALIDATE });

    return data;
  } catch (error) {
    if (error instanceof NotFoundError) {
      return null;
    }

    throw error;
  }
});

/**
 * The About page with its sections. Anything the CMS has not filled in falls back to an empty
 * section, so a half-finished page still renders rather than throwing.
 */
export const getAboutPage = cache(async (): Promise<{ page: CmsPage; sections: AboutSections } | null> => {
  const page = await getPage(ABOUT_SLUG);

  if (!page) {
    return null;
  }

  const saved = (page.sections ?? {}) as Partial<AboutSections>;

  return {
    page,
    sections: {
      ...EMPTY_ABOUT,
      ...saved,
      hero: { ...EMPTY_ABOUT.hero, ...(saved.hero ?? {}) },
      vision: { ...EMPTY_ABOUT.vision, ...(saved.vision ?? {}) },
      mission: { ...EMPTY_ABOUT.mission, ...(saved.mission ?? {}), points: saved.mission?.points ?? [] },
      cta: { ...EMPTY_ABOUT.cta, ...(saved.cta ?? {}) },
      offers: saved.offers ?? [],
      why_us: saved.why_us ?? [],
      stats: saved.stats ?? [],
      leadership: saved.leadership ?? [],
    },
  };
});

export const getContactPage = cache(async (): Promise<{ page: CmsPage; sections: ContactSections } | null> => {
  const page = await getPage(CONTACT_SLUG);

  if (!page) {
    return null;
  }

  const saved = (page.sections ?? {}) as Partial<ContactSections>;

  return {
    page,
    sections: {
      ...EMPTY_CONTACT,
      ...saved,
      hero: { ...EMPTY_CONTACT.hero, ...(saved.hero ?? {}) },
      form: { ...EMPTY_CONTACT.form, ...(saved.form ?? {}) },
      dealers: { ...EMPTY_CONTACT.dealers, ...(saved.dealers ?? {}) },
      cards: (saved.cards ?? []).map((card) => ({ ...card, lines: card.lines ?? [] })),
      office_hours: saved.office_hours ?? [],
      faqs: saved.faqs ?? [],
    },
  };
});
