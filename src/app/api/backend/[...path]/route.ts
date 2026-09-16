import type { NextRequest } from "next/server";
import { clearToken, getToken, userApiUrl } from "@/lib/session";

/** The only logged-in API areas the Public Web may reach. */
const ALLOWED_PATHS = [/^auth\/me$/, /^portal\/favorites(\/\d+)?$/, /^portal\/saved-searches(\/\d+)?$/, /^portal\/my-wanted-posts(\/\d+)?$/];

/**
 * Forward buyer requests (favourites, saved searches, buyer requirements) to the Laravel API with the token from the cookie.
 * Paths are matched after decoding, so encoded dot segments cannot slip through.
 */
async function forward(request: NextRequest, ctx: RouteContext<"/api/backend/[...path]">): Promise<Response> {
  const token = await getToken();

  if (!token) {
    return Response.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const { path } = await ctx.params;
  let joined: string;

  try {
    joined = path.map((segment) => decodeURIComponent(segment)).join("/");
  } catch {
    return Response.json({ message: "Invalid path." }, { status: 400 });
  }

  if (!ALLOWED_PATHS.some((pattern) => pattern.test(joined))) {
    return Response.json({ message: "Not found." }, { status: 404 });
  }

  const target = userApiUrl(joined);
  target.search = request.nextUrl.search;

  const hasBody = request.method !== "GET" && request.method !== "HEAD";

  const response = await fetch(target, {
    method: request.method,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
    },
    body: hasBody ? await request.text() : undefined,
    cache: "no-store",
  });

  if (response.status === 401) {
    await clearToken();
  }

  return new Response(response.status === 204 ? null : await response.text(), {
    status: response.status,
    headers: { "Content-Type": response.headers.get("content-type") ?? "application/json" },
  });
}

export { forward as GET, forward as POST, forward as PUT, forward as PATCH, forward as DELETE };
