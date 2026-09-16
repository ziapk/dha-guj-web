import type { NextRequest } from "next/server";
import { siteUrl } from "@/lib/site";

/**
 * A banner link: GET /api/banners/12/click counts the click (POST /public/banners/{id}/click) and redirects to the advertiser.
 * Banners link here with target="_blank", so the new tab opens straight from the click (no popup blocker) and works without JavaScript.
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/banners/[id]/click">): Promise<Response> {
  const { id } = await ctx.params;
  const base = process.env.API_URL;
  const home = new URL("/", siteUrl());

  if (!/^\d{1,10}$/.test(id) || !base) {
    return Response.redirect(home, 302);
  }

  const forwardedFor = request.headers.get("x-forwarded-for");

  try {
    const response = await fetch(`${base.replace(/\/$/, "")}/api/v1/public/banners/${id}/click`, {
      method: "POST",
      headers: { Accept: "application/json", ...(forwardedFor ? { "X-Forwarded-For": forwardedFor } : {}) },
      cache: "no-store",
    });

    const payload = response.ok ? ((await response.json()) as { data?: { url?: string | null } }) : null;
    const target = payload?.data?.url ? new URL(payload.data.url) : null;

    // Only follow web links; anything else (or a banner that stopped running) goes back to the home page.
    if (target && (target.protocol === "https:" || target.protocol === "http:")) {
      return new Response(null, { status: 302, headers: { Location: target.toString(), "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } });
    }
  } catch {
    // Invalid URL or API unavailable.
  }

  return Response.redirect(home, 302);
}
