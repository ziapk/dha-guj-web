import type { NextRequest } from "next/server";
import { publicApi } from "@/lib/api";
import type { Collection, Phase } from "@/types/api";

/** Active phases of one society for the requirement form: GET /api/phases?society_id=3. Empty when the API fails. */
export async function GET(request: NextRequest): Promise<Response> {
  const societyId = Number.parseInt(request.nextUrl.searchParams.get("society_id") ?? "", 10);

  if (!Number.isInteger(societyId) || societyId <= 0) {
    return Response.json({ data: [] });
  }

  const phases = await publicApi<Collection<Phase>>("phases", { query: { society_id: societyId }, revalidate: 3600 })
    .then((response) => response.data)
    .catch(() => []);

  return Response.json({ data: phases });
}
