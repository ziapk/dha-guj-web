import "@fontsource-variable/plus-jakarta-sans";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import type { Metadata } from "next";
import { CompareTray } from "@/components/compare-tray";
import { GOOGLE_SITE_VERIFICATION, GoogleTagManagerNoscript, GoogleTags } from "@/components/google-tags";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ScrollToTop } from "@/components/scroll-to-top";
import { defaultOgImages, robots } from "@/lib/seo";
import { siteUrl } from "@/lib/site";
import { getCmsPages, getSiteSettings, siteNameOf } from "@/lib/site-data";
import { Providers } from "./providers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const siteName = siteNameOf(settings);
  const images = defaultOgImages(settings);
  const description = "Search houses, flats, plots and commercial property for sale and rent in DHA Gujranwala, Lahore, Islamabad and Karachi.";

  return {
    metadataBase: new URL(siteUrl()),
    title: { default: `${siteName}: homes, plots and commercial property`, template: `%s | ${siteName}` },
    description,
    applicationName: siteName,
    robots: robots(),
    verification: { google: GOOGLE_SITE_VERIFICATION },
    openGraph: { siteName, type: "website", locale: "en_PK", description, images },
    twitter: { card: images ? "summary_large_image" : "summary" },
  };
}

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
