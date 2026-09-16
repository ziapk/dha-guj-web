import "@fontsource-variable/open-sans";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import type { Metadata } from "next";
import { CompareTray } from "@/components/compare-tray";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { siteUrl } from "@/lib/site";
import { getCmsPages, getSiteSettings, siteNameOf } from "@/lib/site-data";
import { Providers } from "./providers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const siteName = siteNameOf(settings);
  const description = "Search houses, flats, plots and commercial property for sale and rent in DHA Gujranwala, Lahore, Islamabad and Karachi.";

  return {
    metadataBase: new URL(siteUrl()),
    title: { default: `${siteName}: homes, plots and commercial property`, template: `%s | ${siteName}` },
    description,
    applicationName: siteName,
    openGraph: { siteName, type: "website", locale: "en_PK", description },
    twitter: { card: "summary" },
  };
}

/** Applies the saved light/dark mode before first paint to avoid a white flash in dark mode. */
const themeScript = `(function(){try{var s=JSON.parse(localStorage.getItem('dha-web-theme')||'{}');var m=s.mode||'system';var d=m==='dark'||(m==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light';}catch(e){}})();`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Both fall back to empty values, so the site still renders when the API is unavailable.
  const [settings, pages] = await Promise.all([getSiteSettings(), getCmsPages()]);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <AntdRegistry>
          <Providers>
            <SiteHeader settings={settings} />
            <main>{children}</main>
            <SiteFooter settings={settings} pages={pages.filter((page) => page.show_in_footer)} />
            <CompareTray />
          </Providers>
        </AntdRegistry>
      </body>
    </html>
  );
}
