import { clearToken, getToken, userApiUrl } from "@/lib/session";

/** Revoke the Laravel token (best effort) and clear the shared cookie. */
export async function POST(): Promise<Response> {
  const token = await getToken();

  if (token) {
    await fetch(userApiUrl("auth/logout"), {
      method: "POST",
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      cache: "no-store",
    }).catch(() => undefined);
  }

  await clearToken();

  return new Response(null, { status: 204 });
}
