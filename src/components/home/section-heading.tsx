import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRightIcon } from "@/components/icons";

/**
 * The shared home page heading: a short blue rule, an optional eyebrow word, a two-tone title
 * ("Featured" in ink, "Properties" in blue) and an optional action on the right.
 */
export function SectionHeading({
  eyebrow,
  title,
  highlight,
  subtitle,
  children,
}: {
  eyebrow?: string;
  title: string;
  highlight?: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <div className="home-head">
      <div className="home-head-text">
        <p className="home-eyebrow">
          <span className="home-eyebrow-rule" aria-hidden="true" />
          {eyebrow}
        </p>
        <h2>
          {title}
          {highlight && <span> {highlight}</span>}
        </h2>
        {subtitle && <p className="home-head-sub">{subtitle}</p>}
      </div>
      {children && <div className="home-head-action">{children}</div>}
    </div>
  );
}

/** The outlined "View All …" pill used beside most section headings. */
export function PillLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="pill-link">
      {children}
      <ArrowRightIcon className="icon" />
    </Link>
  );
}
