import type { NextRequest } from "next/server";

/** Forward a Contact page message to the API, passing the visitor's IP so rate limits apply per visitor. */
export async function POST(request: NextRequest): Promise<Response> {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const base = process.env.API_URL;

  if (!base) {
    return Response.json({ message: "API_URL is not set." }, { status: 500 });
  }

  const forwardedFor = request.headers.get("x-forwarded-for");

  const response = await fetch(`${base.replace(/\/$/, "")}/api/v1/public/contact`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(forwardedFor ? { "X-Forwarded-For": forwardedFor } : {}),
    },
    body: JSON.stringify({
      name: body.name,
      phone: body.phone,
      email: body.email || null,
      subject: body.subject || null,
      message: body.message,
      website: body.website || null,
    }),
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({}));

  return Response.json(payload, { status: response.status });
}
