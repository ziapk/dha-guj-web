import type { Metadata } from "next";
import Link from "next/link";
import { RequirementForm } from "@/components/requirement-form";
import { getMasterData } from "@/lib/master-data";

export const metadata: Metadata = { title: "Post a requirement", robots: { index: false } };

export default async function NewRequirementPage() {
  const masterData = await getMasterData();

  return (
    <div className="container page-section account-narrow">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/account/requirements">My requirements</Link>
        <span>/</span>
        <span aria-current="page">New</span>
      </nav>
      <div className="section-head">
        <div>
          <h1 className="account-title">Post your requirement</h1>
          <p>Tell owners and agencies what you want. It stays visible for 30 days; you can have up to 5 open at a time.</p>
        </div>
      </div>
      <RequirementForm {...masterData} />
    </div>
  );
}
