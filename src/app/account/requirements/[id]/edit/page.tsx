import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RequirementForm } from "@/components/requirement-form";
import { getMasterData } from "@/lib/master-data";

export const metadata: Metadata = { title: "Edit requirement", robots: { index: false } };

export default async function EditRequirementPage({ params }: PageProps<"/account/requirements/[id]/edit">) {
  const { id } = await params;

  if (!/^\d{1,10}$/.test(id)) {
    notFound();
  }

  const masterData = await getMasterData();

  return (
    <div className="container page-section account-narrow">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/account/requirements">My requirements</Link>
        <span>/</span>
        <span aria-current="page">Edit</span>
      </nav>
      <div className="section-head">
        <div>
          <h1 className="account-title">Edit requirement</h1>
          <p>Changes show to sellers straight away.</p>
        </div>
      </div>
      <RequirementForm id={Number(id)} {...masterData} />
    </div>
  );
}
