/** Public URL of this site, without a trailing slash. */
export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3002").replace(/\/$/, "");
}

/** Property Admin page where sellers browse buyer requirements and unlock contact details. */
export const PORTAL_WANTED_PATH = "/buyer-requirements";

/** Public URL of the Property Admin app, e.g. portalUrl("/listings/new"). */
export function portalUrl(path = ""): string {
  return `${(process.env.NEXT_PUBLIC_PORTAL_URL ?? "http://localhost:3001").replace(/\/$/, "")}${path}`;
}
