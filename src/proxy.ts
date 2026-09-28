import { NextResponse, type NextRequest } from "next/server";
import { TOKEN_COOKIE } from "@/lib/constants";

type Resolution = { state: "ok" | "redirect" | "gone"; path: string | null };

/**
 * Asks the API how a listing URL should be answered. Null when the listing does not exist or is not public
 * (the page then renders its 404), or when the API cannot be reached (the page handles it).
 */
async function resolveListing(key: string): Promise<Resolution | null> {
  const base = process.env.API_URL;

  if (!base) {
    return null;
  }

  try {
    const response = await fetch(`${base.replace(/\/$/, "")}/api/v1/public/properties/${encodeURIComponent(key)}/resolve`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    return response.ok ? ((await response.json()) as { data: Resolution }).data : null;
  } catch {
    return null;
  }
}

/** A deleted listing with no replacement: 410 Gone, so search engines drop it instead of retrying a 404. */
function gone(): NextResponse {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Listing removed</title>
<style>body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;background:#f6f9fd;color:#12233f;display:grid;place-items:center;min-height:100vh;padding:16px;box-sizing:border-box}main{max-width:440px;text-align:center}h1{font-size:24px;margin:0 0 8px}p{color:#64748b;margin:0 0 20px;line-height:1.5}a{display:inline-block;background:#1a73e8;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600}</style></head>
<body><main><h1>This listing has been removed</h1><p>The property is no longer listed on our site. Browse properties that are available now.</p><a href="/properties">Browse properties</a></main></body></html>`;

  return new NextResponse(html, { status: 410, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

/**
 * Listing URLs: old /properties/{slug} links and outdated slugs get a 301 to the permanent /property/{id}/{slug};
 * deleted listings answer 301 to their replacement or 410 Gone.
 */
async function listing(request: NextRequest, key: string): Promise<NextResponse> {
  const resolution = await resolveListing(key);

  if (resolution === null) {
    return NextResponse.next();
  }

  if (resolution.state === "gone" || resolution.path === null) {
    return gone();
  }

  if (resolution.path !== request.nextUrl.pathname) {
    const target = new URL(resolution.path, request.url);
    target.search = request.nextUrl.search;

    return NextResponse.redirect(target, 301);
  }

  return NextResponse.next();
}

/** Account pages need a login; listing URLs are checked against the API; everything else is open. */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const permanent = pathname.match(/^\/property\/(\d+)(?:\/[^/]*)?\/?$/);
  const legacy = pathname.match(/^\/properties\/([^/]+)\/?$/);

  if (permanent || legacy) {
    return listing(request, permanent ? permanent[1] : decodeURIComponent(legacy![1]));
  }

  if (!request.cookies.has(TOKEN_COOKIE)) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);

    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*", "/property/:path*", "/properties/:slug"],
};
