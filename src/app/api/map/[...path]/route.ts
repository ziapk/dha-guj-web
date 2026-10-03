import type { NextRequest } from "next/server";

/** The Plot Finder endpoints the browser may call, with the query parameters each accepts. */
const ROUTES: { pattern: RegExp; params: string[]; revalidate: number | false }[] = [
  // Outlines change only when an admin edits them, so a short cache spares the API on busy pages.
  { pattern: /^plots$/, params: ["sector_id", "block_id", "bbox"], revalidate: 120 },
  { pattern: /^plots\/search$/, params: ["q"], revalidate: false },
  { pattern: /^plots\/\d+$/, params: [], revalidate: 60 },
];

/**
 * GET /api/map/plots?…, /api/map/plots/search?q=…, /api/map/plots/{id}: forwards to the Laravel Plot Finder API.
 * Passes the visitor's IP because search is throttled per IP.
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/map/[...path]">): Promise<Response> {
  const { path } = await ctx.params;
  const joined = path.join("/");
  const route = ROUTES.find((item) => item.pattern.test(joined));

  if (!route) {
    return Response.json({ message: "Not found." }, { status: 404 });
  }

  const base = process.env.API_URL;

  if (!base) {
    return Response.json({ message: "API_URL is not set." }, { status: 500 });
  }

  const query = new URLSearchParams();

  for (const key of route.params) {
    const value = request.nextUrl.searchParams.get(key);

    if (value) {
      query.set(key, value.slice(0, 100));
    }
  }

  const forwardedFor = request.headers.get("x-forwarded-for");

  try {
    const response = await fetch(`${base.replace(/\/$/, "")}/api/v1/public/map/${joined}${query.size ? `?${query}` : ""}`, {
      headers: { Accept: "application/json", ...(forwardedFor ? { "X-Forwarded-For": forwardedFor } : {}) },
      signal: request.signal,
      ...(route.revalidate === false ? { cache: "no-store" as const } : { next: { revalidate: route.revalidate } }),
    });

    return new Response(await response.text(), {
      status: response.status,
      headers: { "Content-Type": response.headers.get("content-type") ?? "application/json" },
    });
  } catch {
    return Response.json({ message: "The map is unavailable right now." }, { status: 502 });
  }
}
