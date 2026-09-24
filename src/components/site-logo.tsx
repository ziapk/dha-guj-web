import Image from "next/image";
import Link from "next/link";

/**
 * The uploaded logo from site settings when there is one, otherwise the built-in DHA logo.
 * The uploaded logo is served by the API, so it skips image optimisation (its host may not be in next.config).
 */
export function SiteLogo({ siteName, logoUrl, onClick }: { siteName: string; logoUrl: string | null; onClick?: () => void }) {
  return (
    <Link href="/" className="site-logo" aria-label={`${siteName} home`} onClick={onClick}>
      {logoUrl ? (
        <Image src={logoUrl} alt={siteName} width={180} height={44} className="site-logo-img" unoptimized priority />
      ) : (
        <Image src="/brand/logo-wide.png" alt={siteName} width={515} height={160} className="site-logo-img" priority />
      )}
    </Link>
  );
}
