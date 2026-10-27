import type { Metadata } from "next";

/** Account pages are private to the signed-in visitor, so they are never indexed. */
export const metadata: Metadata = {
  title: "My account",
  robots: { index: false, follow: false },
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return children;
}
