import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { HomeIcon } from "@/components/icons";

/**
 * The uploaded logo from site settings when there is one, otherwise the built-in DHA GUJ mark.
 * The uploaded logo is served by the API, so it skips image optimisation (its host may not be in next.config).
 */
export function SiteLogo({ siteName, logoUrl, icon, onClick }: { siteName: string; logoUrl: string | null; icon?: ReactNode; onClick?: () => void }) {
  return (
    <Link href="/" className="site-logo" aria-label={`${siteName} home`} onClick={onClick}>
      {logoUrl ? (
        <Image src={logoUrl} alt={siteName} width={180} height={44} className="site-logo-img" unoptimized priority />
      ) : (
        <>
          <span className="brand-logo">{icon ?? <HomeIcon />}</span>
          <span>
            <strong>DHA GUJ</strong>
            <small>Properties</small>
          </span>
        </>
      )}
    </Link>
  );
}
