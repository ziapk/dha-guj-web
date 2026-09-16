import type { NextRequest } from "next/server";
import { ValidationError, publicApi } from "@/lib/api";
import type { Paginated, PublicProperty, Resource } from "@/types/api";

/** Most ids one request may ask for (compare uses 3, recently viewed 10). */
const MAX_IDS = 20;

/** Most listings loaded with full details (compare shows three). */
const MAX_DETAILS = 3;

/**
 * Live listings by id for the browser (compare and recently viewed): GET /api/listings?ids=12,40,7.
 * Listings that are no longer live are simply missing from the result.
 * With details=1 (at most three ids) each listing is loaded in full, because search results leave out amenities.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const ids = [
    ...new Set(
      (request.nextUrl.searchParams.get("ids") ?? "")
        .split(",")
        .map((id) => Number.parseInt(id, 10))
        .filter((id) => Number.isInteger(id) && id > 0),
    ),
  ].slice(0, MAX_IDS);

  if (ids.length === 0) {
    return Response.json({ data: [] });
  }

  try {
    const result = await publicApi<Paginated<PublicProperty>>("properties", { query: { ids: ids.join(","), per_page: MAX_IDS }, revalidate: 60 });

    if (request.nextUrl.searchParams.get("details") === "1" && result.data.length <= MAX_DETAILS) {
      const detailed = await Promise.all(
        result.data.map((property) =>
          publicApi<Resource<PublicProperty>>(`properties/${encodeURIComponent(property.slug)}`, { revalidate: 60 })
            .then((response) => response.data)
            .catch(() => property),
        ),
      );

      return Response.json({ data: detailed });
    }

    return Response.json({ data: result.data });
  } catch (error) {
    return Response.json({ message: "Could not load listings." }, { status: error instanceof ValidationError ? 422 : 502 });
  }
}
