import type { Metadata } from "next";
import Link from "next/link";
import { CompareView } from "@/components/compare-view";

export const metadata: Metadata = {
  title: "Compare properties",
  description: "Compare up to three properties side by side: price, area, bedrooms, location and amenities.",
  alternates: { canonical: "/compare" },
  // The comparison lives in the visitor's browser, so the page has nothing to index.
  robots: { index: false, follow: true },
};

export default function ComparePage() {
  return (
    <div className="container page-section">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <span aria-current="page">Compare</span>
      </nav>
      <div className="search-header">
        <div>
          <h1>Compare properties</h1>
          <p>Up to three listings side by side. Your selection is saved in this browser.</p>
        </div>
      </div>
      <CompareView />
    </div>
  );
}
