import type { NextRequest } from "next/server";
import { publicApi } from "@/lib/api";
import type { Block, Collection } from "@/types/api";

/** Active blocks of one sector for the Sell Property form: GET /api/blocks?sector_id=3. Empty when the API fails. */
export async function GET(request: NextRequest): Promise<Response> {
  const sectorId = Number.parseInt(request.nextUrl.searchParams.get("sector_id") ?? "", 10);

  if (!Number.isInteger(sectorId) || sectorId <= 0) {
    return Response.json({ data: [] });
  }

  const blocks = await publicApi<Collection<Block>>("blocks", { query: { sector_id: sectorId }, revalidate: 3600 })
    .then((response) => response.data)
    .catch(() => []);

  return Response.json({ data: blocks });
}
