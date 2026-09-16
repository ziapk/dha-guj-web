import { NextResponse, type NextRequest } from "next/server";
import { TOKEN_COOKIE } from "@/lib/constants";

/** Account pages need a login; everything else on the Public Web is open. */
export function proxy(request: NextRequest) {
  if (!request.cookies.has(TOKEN_COOKIE)) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", request.nextUrl.pathname);

    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*"],
};
