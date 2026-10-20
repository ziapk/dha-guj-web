import Script from "next/script";
import { noindex } from "@/lib/seo";

/** Search Console ownership token, rendered as <meta name="google-site-verification">. */
export const GOOGLE_SITE_VERIFICATION = "JdhX9Gb6jWCHY64Yo2sTmcWB_0-p27_BW56ytbHf7QY";

const GA_MEASUREMENT_ID = "G-SZ8B8F64W8";
const GTM_CONTAINER_ID = "GTM-M9RJTGHX";

/** Analytics run on the live site only: not in development, nor on staging and other NOINDEX builds. */
function tracking(): boolean {
  return process.env.NODE_ENV === "production" && !noindex();
}

/** Google Analytics (gtag.js) and the Google Tag Manager container. */
export function GoogleTags() {
  if (!tracking()) {
    return null;
  }

  return (
    <>
      <Script id="gtm" strategy="afterInteractive">
        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_CONTAINER_ID}');`}
      </Script>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" />
      <Script id="gtag" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_MEASUREMENT_ID}');`}
      </Script>
    </>
  );
}

/** Tag Manager fallback for visitors without JavaScript; goes right after <body>. */
export function GoogleTagManagerNoscript() {
  if (!tracking()) {
    return null;
  }

  return (
    <noscript>
      <iframe src={`https://www.googletagmanager.com/ns.html?id=${GTM_CONTAINER_ID}`} height="0" width="0" style={{ display: "none", visibility: "hidden" }} />
    </noscript>
  );
}
