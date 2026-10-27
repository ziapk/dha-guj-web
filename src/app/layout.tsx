import "@fontsource-variable/plus-jakarta-sans";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import type { Metadata, Viewport } from "next";
import { CompareTray } from "@/components/compare-tray";
import { JsonLd } from "@/components/json-ld";
import { GOOGLE_SITE_VERIFICATION, GoogleTagManagerNoscript, GoogleTags } from "@/components/google-tags";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ScrollToTop } from "@/components/scroll-to-top";
import { navigationSchema, organizationSchema, websiteSchema } from "@/lib/schema";
import { SEO, noindex, pageMetadata, robots } from "@/lib/seo";
import { siteUrl } from "@/lib/site";
import { getCmsPages, getSiteSettings } from "@/lib/site-data";
import { Providers } from "./providers";
import "./globals.css";

/**
 * Site-wide defaults from the SEO spec. Every public page sets its own metadata with pageMetadata() (src/lib/seo.ts);
 * these only fill in for pages that set none, such as the sign-in and account pages.
 */
export async function generateMetadata(): Promise<Metadata> {
  const defaults = await pageMetadata({ title: SEO.title, absoluteTitle: true, description: SEO.description, path: "/" });

  return {
    ...defaults,
    metadataBase: new URL(siteUrl()),
    title: { default: SEO.title, template: `%s | ${SEO.siteName}` },
    // A page without its own canonical URL must not claim the home page's.
    alternates: undefined,
    openGraph: { ...defaults.openGraph, url: undefined },
    // Public pages set their own robots; leaving it unset here keeps the 404 page's noindex from conflicting.
    robots: noindex() ? robots() : undefined,
    applicationName: SEO.siteName,
    verification: { google: GOOGLE_SITE_VERIFICATION },
  };
}

export const viewport: Viewport = { themeColor: SEO.themeColor };

/** Applies dark mode before first paint only when the visitor chose it with the toggle; otherwise light. */
const themeScript = `(function(){var d=false;try{d=JSON.parse(localStorage.getItem('dha-web-theme')||'{}').mode==='dark';}catch(e){}document.documentElement.dataset.theme=d?'dark':'light';})();`;

export default async function RootLayout({ children, modal }: LayoutProps<"/">) {
  // Both fall back to empty values, so the site still renders when the API is unavailable.
  const [settings, pages] = await Promise.all([getSiteSettings(), getCmsPages()]);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <GoogleTagManagerNoscript />
        <GoogleTags />
        {/* The brand, website and main menu, on every page; page-level structured data refers to them by "@id". */}
        <JsonLd data={[organizationSchema(settings), websiteSchema(settings), navigationSchema()]} />
        <AntdRegistry>
          <Providers>
            <ScrollToTop />
            <SiteHeader settings={settings} />
            <main>{children}</main>
            <SiteFooter settings={settings} pages={pages.filter((page) => page.show_in_footer)} />
            <CompareTray />
            {modal}
          </Providers>
        </AntdRegistry>
      </body>
    </html>
  );
}
