import type { NextRequest } from "next/server";
import { publicApi } from "@/lib/api";
import type { Collection, Sector } from "@/types/api";

/** Active sectors of one phase for the Sell Property form: GET /api/sectors?phase_id=3. Empty when the API fails. */
export async function GET(request: NextRequest): Promise<Response> {
  const phaseId = Number.parseInt(request.nextUrl.searchParams.get("phase_id") ?? "", 10);

  if (!Number.isInteger(phaseId) || phaseId <= 0) {
    return Response.json({ data: [] });
  }

  const sectors = await publicApi<Collection<Sector>>("sectors", { query: { phase_id: phaseId }, revalidate: 3600 })
    .then((response) => response.data)
    .catch(() => []);

  return Response.json({ data: sectors });
}
