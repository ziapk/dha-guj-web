import type { NextRequest } from "next/server";
import type { BannerPlacement } from "@/types/api";

const PLACEMENTS = new Set<BannerPlacement>(["home_top", "search_top", "search_sidebar", "listing_sidebar"]);

/**
 * Banners for one placement: GET /api/banners?placement=home_top&limit=1.
 * Never cached — the API counts an impression for every banner it returns, so each real page view asks again.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const placement = request.nextUrl.searchParams.get("placement") as BannerPlacement | null;
  const limit = Math.min(10, Math.max(1, Number.parseInt(request.nextUrl.searchParams.get("limit") ?? "", 10) || 1));
  const base = process.env.API_URL;

  if (!placement || !PLACEMENTS.has(placement)) {
    return Response.json({ message: "Invalid placement." }, { status: 422 });
  }

  if (!base) {
    return Response.json({ data: [] }, { headers: { "Cache-Control": "no-store" } });
  }

  const url = new URL(`${base.replace(/\/$/, "")}/api/v1/public/banners`);
  url.searchParams.set("placement", placement);
  url.searchParams.set("limit", String(limit));

  const forwardedFor = request.headers.get("x-forwarded-for");

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json", ...(forwardedFor ? { "X-Forwarded-For": forwardedFor } : {}) },
      cache: "no-store",
    });

    const payload = response.ok ? await response.json() : { data: [] };

    return Response.json({ data: Array.isArray(payload?.data) ? payload.data : [] }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ data: [] }, { headers: { "Cache-Control": "no-store" } });
  }
}
