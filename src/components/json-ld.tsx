import { schemaGraph, type Schema } from "@/lib/schema";
import { jsonLd } from "@/lib/seo";

/** The page's structured data as one <script type="application/ld+json"> holding a cleaned "@graph" (empty blocks skipped). */
export function JsonLd({ data }: { data: (Schema | null | undefined | false)[] }) {
  const graph = schemaGraph(data);

  if ((graph["@graph"] as Schema[]).length === 0) {
    return null;
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(graph) }} />;
}
