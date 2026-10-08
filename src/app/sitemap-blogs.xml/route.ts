import { sitemapResponse } from "@/lib/sitemap";

export const revalidate = 3600;

export function GET() {
  return sitemapResponse("sitemap-blogs.xml");
}
