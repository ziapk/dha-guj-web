import type { NextRequest } from "next/server";

/** Most photos one submission may carry (the API enforces the same limit). */
const MAX_PHOTOS = 10;

/**
 * Forward a Sell Property submission (multipart, with photos) to the API, passing the visitor's IP so the
 * lead rate limit applies per visitor. Only the known fields are passed on.
 */
export async function POST(request: NextRequest): Promise<Response> {
  const base = process.env.API_URL;

  if (!base) {
    return Response.json({ message: "API_URL is not set." }, { status: 500 });
  }

  let incoming: FormData;

  try {
    incoming = await request.formData();
  } catch {
    return Response.json({ message: "The form could not be read. Please try again." }, { status: 400 });
  }

  const fields = [
    "purpose",
    "property_type_id",
    "area_size",
    "area_unit",
    "possession",
    "phase_id",
    "sector_id",
    "block_id",
    "street",
    "plot_number",
    "price",
    "is_negotiable",
    "title",
    "description",
    "video_url",
    "name",
    "phone",
    "email",
    "owner_type",
    "website",
  ];

  const outgoing = new FormData();

  for (const field of fields) {
    const value = incoming.get(field);

    if (typeof value === "string" && value.trim() !== "") {
      outgoing.append(field, value.trim());
    }
  }

  incoming
    .getAll("photos[]")
    .filter((file): file is File => file instanceof File && file.size > 0)
    .slice(0, MAX_PHOTOS)
    .forEach((file) => outgoing.append("photos[]", file, file.name));

  const forwardedFor = request.headers.get("x-forwarded-for");

  try {
    const response = await fetch(`${base.replace(/\/$/, "")}/api/v1/public/sell-requests`, {
      method: "POST",
      headers: { Accept: "application/json", ...(forwardedFor ? { "X-Forwarded-For": forwardedFor } : {}) },
      body: outgoing,
      cache: "no-store",
    });

    const payload = await response.json().catch(() => ({}));

    return Response.json(payload, { status: response.status });
  } catch {
    return Response.json({ message: "Our server could not be reached. Please try again in a moment." }, { status: 502 });
  }
}
