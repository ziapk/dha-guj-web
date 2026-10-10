import type { Metadata } from "next";
import { PurposeListingPage, purposeMetadata } from "@/components/purpose/purpose-page";

export function generateMetadata({ searchParams }: PageProps<"/properties-for-sale">): Promise<Metadata> {
  return purposeMetadata("sale", searchParams);
}

/** Only properties for sale; the design is shared with /rent. */
export default function BuyPage({ searchParams }: PageProps<"/properties-for-sale">) {
  return <PurposeListingPage purpose="sale" searchParams={searchParams} />;
}
