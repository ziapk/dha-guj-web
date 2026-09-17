import type { NextRequest } from "next/server";

/**
 * Keyword autocomplete for the search inputs: GET /api/search/suggestions?q=dha.
 * Forwards the visitor's IP because the API throttles suggestions per IP; terms under two characters get empty groups without calling the API.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 100);

  if (q.length < 2) {
    return Response.json({ data: { societies: [], phases: [], projects: [], agencies: [] } });
  }

  const base = process.env.API_URL;

  if (!base) {
    return Response.json({ message: "API_URL is not set." }, { status: 500 });
  }

  const forwardedFor = request.headers.get("x-forwarded-for");

  try {
    const response = await fetch(`${base.replace(/\/$/, "")}/api/v1/public/search/suggestions?${new URLSearchParams({ q }).toString()}`, {
      headers: {
        Accept: "application/json",
        ...(forwardedFor ? { "X-Forwarded-For": forwardedFor } : {}),
      },
      signal: request.signal,
      cache: "no-store",
    });

    return new Response(await response.text(), {
      status: response.status,
      headers: { "Content-Type": response.headers.get("content-type") ?? "application/json" },
    });
  } catch {
    return Response.json({ message: "Could not load suggestions." }, { status: 502 });
  }
}
