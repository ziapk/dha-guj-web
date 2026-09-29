import type { Metadata } from "next";
import { PurposeListingPage, purposeMetadata } from "@/components/purpose/purpose-page";

export function generateMetadata({ searchParams }: PageProps<"/buy">): Promise<Metadata> {
  return purposeMetadata("sale", searchParams);
}

/** Only properties for sale; the design is shared with /rent. */
export default function BuyPage({ searchParams }: PageProps<"/buy">) {
  return <PurposeListingPage purpose="sale" searchParams={searchParams} />;
}
