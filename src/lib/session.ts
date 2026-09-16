import { cookies } from "next/headers";
import { TOKEN_COOKIE } from "@/lib/constants";

/** Secure cookies need HTTPS. SESSION_COOKIE_SECURE=false allows a production build to run over plain http locally. */
const secureCookie = () => (process.env.SESSION_COOKIE_SECURE ? process.env.SESSION_COOKIE_SECURE === "true" : process.env.NODE_ENV === "production");

const TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const cookieDomain = () => process.env.SESSION_COOKIE_DOMAIN || undefined;

export async function getToken(): Promise<string | undefined> {
  return (await cookies()).get(TOKEN_COOKIE)?.value;
}

export async function setToken(token: string): Promise<void> {
  (await cookies()).set(TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: secureCookie(),
    sameSite: "lax",
    path: "/",
    domain: cookieDomain(),
    maxAge: TOKEN_MAX_AGE_SECONDS,
  });
}

export async function clearToken(): Promise<void> {
  (await cookies()).delete({ name: TOKEN_COOKIE, path: "/", domain: cookieDomain() });
}

/** Build a URL for the Laravel API, e.g. userApiUrl("auth/login") → {API_URL}/api/v1/auth/login. */
export function userApiUrl(path: string): URL {
  const base = process.env.API_URL;

  if (!base) {
    throw new Error("API_URL is not set. Add it to .env.local.");
  }

  return new URL(`${base.replace(/\/$/, "")}/api/v1/${path.replace(/^\//, "")}`);
}
