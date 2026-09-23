import { cache } from "react";
import { NotFoundError, publicApi } from "@/lib/api";
import type { CmsPage, FileRatesSections, FileRateTable, Resource } from "@/types/api";

/** The CMS page this module renders. Created by the API's FileRatesSeeder. */
export const FILE_RATES_SLUG = "dha-gujranwala-files-rates";

const FILE_RATES_REVALIDATE = 300;

/** GET /public/pages/{slug} on a file-rates page also carries the live rate tables. */
type FileRatesPage = Resource<CmsPage> & { rate_tables?: FileRateTable[] };

const EMPTY_SECTIONS: FileRatesSections = {
  hero: { title: null, subtitle: null, updated_label: null },
  intro_html: null,
  content_blocks: [],
  comparisons: [],
  steps: [],
  documents: [],
  faqs: [],
  disclaimer_html: null,
  cta: { heading: null, text: null, phone: null, whatsapp: null, button_label: null },
};

/**
 * The File Rates page and its rate tables, or null when an admin has not published it.
 * Anything the CMS has not filled in falls back to an empty section, so the page always renders.
 */
export const getFileRates = cache(async (): Promise<{ page: CmsPage; sections: FileRatesSections; tables: FileRateTable[] } | null> => {
  try {
    const response = await publicApi<FileRatesPage>(`pages/${FILE_RATES_SLUG}`, { revalidate: FILE_RATES_REVALIDATE });
    const saved = (response.data.sections ?? {}) as Partial<FileRatesSections>;

    return {
      page: response.data,
      sections: {
        ...EMPTY_SECTIONS,
        ...saved,
        hero: { ...EMPTY_SECTIONS.hero, ...(saved.hero ?? {}) },
        cta: { ...EMPTY_SECTIONS.cta, ...(saved.cta ?? {}) },
        content_blocks: saved.content_blocks ?? [],
        comparisons: saved.comparisons ?? [],
        steps: saved.steps ?? [],
        documents: saved.documents ?? [],
        faqs: saved.faqs ?? [],
      },
      tables: response.rate_tables ?? [],
    };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return null;
    }

    throw error;
  }
});
