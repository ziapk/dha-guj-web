/** Server-side access to the Laravel public API. Only import this from Server Components and route handlers. */

export class NotFoundError extends Error {}

export class ValidationError extends Error {}

type QueryValue = string | number | boolean | null | undefined;

export async function publicApi<T>(
  path: string,
  { query = {}, revalidate = 60 }: { query?: Record<string, QueryValue>; revalidate?: number | false } = {},
): Promise<T> {
  const base = process.env.API_URL;

  if (!base) {
    throw new Error("API_URL is not set. Add it to .env.local.");
  }

  const url = new URL(`${base.replace(/\/$/, "")}/api/v1/public/${path.replace(/^\//, "")}`);

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url, { headers: { Accept: "application/json" }, next: { revalidate } });

  if (response.status === 404) {
    throw new NotFoundError(`Not found: ${url.pathname}`);
  }

  if (response.status === 422) {
    throw new ValidationError(`Invalid request: ${url.pathname}${url.search}`);
  }

  if (!response.ok) {
    throw new Error(`API responded ${response.status} for ${url.pathname}`);
  }

  return (await response.json()) as T;
}
