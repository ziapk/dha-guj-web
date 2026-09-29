import type { NextRequest } from "next/server";
import { ValidationError, publicApi } from "@/lib/api";
import { pickFilters } from "@/lib/property";
import { PURPOSE_PAGE_SIZE } from "@/lib/purpose-search";
import type { Paginated, PublicProperty } from "@/types/api";

/**
 * The next page of a Buy / Rent search for the "Load more" button: GET /api/properties?purpose=rent&page=2.
 * Only known search filters are forwarded to the API.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const filters = pickFilters(Object.fromEntries(request.nextUrl.searchParams));

  try {
    const result = await publicApi<Paginated<PublicProperty>>("properties", { query: { ...filters, per_page: PURPOSE_PAGE_SIZE }, revalidate: 30 });

    return Response.json(result);
  } catch (error) {
    return Response.json({ message: "Could not load properties." }, { status: error instanceof ValidationError ? 422 : 502 });
  }
}
