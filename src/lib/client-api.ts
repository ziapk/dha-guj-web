export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly errors: Record<string, string[]> = {},
  ) {
    super(message);
  }
}

type QueryValue = string | number | boolean | null | undefined;

/** Browser calls to the logged-in API areas through /api/backend (favourites, saved searches, buyer requirements, auth/me). */
export async function clientApi<T>(
  path: string,
  { method = "GET", body, query = {} }: { method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"; body?: unknown; query?: Record<string, QueryValue> } = {},
): Promise<T> {
  const url = new URL(`/api/backend/${path.replace(/^\//, "")}`, window.location.origin);

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url, {
    method,
    headers: { Accept: "application/json", ...(body !== undefined ? { "Content-Type": "application/json" } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(response.status, payload.message ?? "Something went wrong.", payload.errors ?? {});
  }

  return payload as T;
}
