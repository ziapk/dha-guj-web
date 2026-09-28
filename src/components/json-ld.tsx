import { jsonLd } from "@/lib/seo";

/** One <script type="application/ld+json"> per schema block (skipping empty ones). */
export function JsonLd({ data }: { data: (Record<string, unknown> | null | undefined)[] }) {
  return (
    <>
      {data.filter(Boolean).map((block, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(block) }} />
      ))}
    </>
  );
}
