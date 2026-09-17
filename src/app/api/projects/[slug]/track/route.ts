import type { NextRequest } from "next/server";

/** Forward a project page view to the API, passing the visitor's IP for rate limiting. Projects only count views. */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/projects/[slug]/track">): Promise<Response> {
  const { slug } = await ctx.params;
  const body = (await request.json().catch(() => ({}))) as { event?: string };

  if (body.event !== "view") {
    return Response.json({ message: "Invalid event." }, { status: 422 });
  }

  const base = process.env.API_URL;

  if (!base) {
    return Response.json({ message: "API_URL is not set." }, { status: 500 });
  }

  const forwardedFor = request.headers.get("x-forwarded-for");

  const response = await fetch(`${base.replace(/\/$/, "")}/api/v1/public/projects/${encodeURIComponent(slug)}/track`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      ...(forwardedFor ? { "X-Forwarded-For": forwardedFor } : {}),
    },
    cache: "no-store",
  });

  return new Response(null, { status: response.status });
}
