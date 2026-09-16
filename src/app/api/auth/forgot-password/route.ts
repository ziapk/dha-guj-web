import { userApiUrl } from "@/lib/session";

/** Ask the API to email a password reset link. The API replies the same whether or not the email has an account. */
export async function POST(request: Request): Promise<Response> {
  const body = (await request.json().catch(() => ({}))) as { email?: unknown };

  try {
    const response = await fetch(userApiUrl("auth/forgot-password"), {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ email: typeof body.email === "string" ? body.email.trim() : "" }),
      cache: "no-store",
    });

    const payload = await response.json().catch(() => null);

    if (response.status === 429) {
      return Response.json({ message: "Too many attempts. Please wait a minute and try again." }, { status: 429 });
    }

    return Response.json(payload ?? { message: "Something went wrong. Please try again." }, { status: response.ok || payload ? response.status : 502 });
  } catch {
    return Response.json({ message: "Cannot reach the server. Please try again." }, { status: 502 });
  }
}
