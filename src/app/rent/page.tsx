import type { Metadata } from "next";
import { PurposeListingPage, purposeMetadata } from "@/components/purpose/purpose-page";

export function generateMetadata({ searchParams }: PageProps<"/rent">): Promise<Metadata> {
  return purposeMetadata("rent", searchParams);
}

/** Only properties for rent; the design is shared with /buy. */
export default function RentPage({ searchParams }: PageProps<"/rent">) {
  return <PurposeListingPage purpose="rent" searchParams={searchParams} />;
}
