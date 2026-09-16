import type { NextRequest } from "next/server";

const EVENTS = new Set(["view", "phone", "whatsapp"]);

/** Forward listing view/call/WhatsApp events to the API, passing the visitor's IP for rate limiting. */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/track/[slug]">): Promise<Response> {
  const { slug } = await ctx.params;
  const body = (await request.json().catch(() => ({}))) as { event?: string };

  if (!body.event || !EVENTS.has(body.event)) {
    return Response.json({ message: "Invalid event." }, { status: 422 });
  }

  const base = process.env.API_URL;

  if (!base) {
    return Response.json({ message: "API_URL is not set." }, { status: 500 });
  }

  const forwardedFor = request.headers.get("x-forwarded-for");

  const response = await fetch(`${base.replace(/\/$/, "")}/api/v1/public/properties/${encodeURIComponent(slug)}/track`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(forwardedFor ? { "X-Forwarded-For": forwardedFor } : {}),
    },
    body: JSON.stringify({ event: body.event }),
    cache: "no-store",
  });

  return new Response(null, { status: response.status });
}
