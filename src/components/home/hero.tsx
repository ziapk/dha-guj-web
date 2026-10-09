import type { CSSProperties } from "react";
import { preload } from "react-dom";
import { HeroSearch } from "@/components/hero-search";
import { ChartIcon, PinIcon, ShieldIcon, UsersIcon } from "@/components/icons";
import { HERO_TRUST, type TrustItem } from "@/lib/home-content";
import type { PropertyType, Society } from "@/types/api";

/**
 * The default photo lives in globals.css (`.home-hero-image` and friends) as AVIF/WebP/JPG at 960 and
 * 1920 wide, built from public/home/DHA Gujranwala Sunset Entrance Boulevard.png.
 */
const DEFAULT_HERO_SRCSET = "/home/hero-dha-gujranwala-960.avif 960w, /home/hero-dha-gujranwala-1920.avif 1920w";

export const DEFAULT_HERO_EYEBROW = "Buy . Rent . Invest";
export const DEFAULT_HERO_TITLE = "Find Your Perfect Property in";
export const DEFAULT_HERO_HIGHLIGHT = "DHA Gujranwala";
export const DEFAULT_HERO_SUBTITLE = "Trusted Listings. Verified Dealers. Better Opportunities.";

const TRUST_ICONS: Record<TrustItem["icon"], typeof ShieldIcon> = {
  shield: ShieldIcon,
  users: UsersIcon,
  pin: PinIcon,
  chart: ChartIcon,
};

/**
 * The photo behind the hero, darkened from the left so the white headline stays readable.
 * An admin-uploaded URL wins; otherwise the local file above is tried and the gradient covers it
 * if the file is not there yet. Only http(s) URLs are accepted from the API.
 */
/** Colours the place name in an admin-written title too, the way the default title shows it. */
function withHighlight(title: string) {
  const at = title.indexOf(DEFAULT_HERO_HIGHLIGHT);

  if (at === -1) {
    return title;
  }

  return (
    <>
      {title.slice(0, at)}
      <span>{DEFAULT_HERO_HIGHLIGHT}</span>
      {title.slice(at + DEFAULT_HERO_HIGHLIGHT.length)}
    </>
  );
}

function isRemoteImage(imageUrl: string | null): imageUrl is string {
  return !!imageUrl && /^https?:\/\//i.test(imageUrl);
}

export function heroStyle(imageUrl: string | null): CSSProperties {
  return isRemoteImage(imageUrl) ? { backgroundImage: `url(${JSON.stringify(imageUrl)})` } : {};
}

export function HomeHero({
  title,
  subtitle,
  imageUrl,
  societies,
  propertyTypes,
}: {
  title: string | null;
  subtitle: string | null;
  imageUrl: string | null;
  societies: Society[];
  propertyTypes: PropertyType[];
}) {
  // The hero photo is the page's largest paint, so start fetching it before the stylesheet asks for it.
  if (!isRemoteImage(imageUrl)) {
    preload("/home/hero-dha-gujranwala-1920.avif", {
      as: "image",
      type: "image/avif",
      imageSrcSet: DEFAULT_HERO_SRCSET,
      imageSizes: "100vw",
      fetchPriority: "high",
    });
  }

  return (
    <section className="home-hero">
      <div className="home-hero-image" style={heroStyle(imageUrl)} aria-hidden="true" />
      <div className="container home-hero-inner">
        <p className="hero-eyebrow">{DEFAULT_HERO_EYEBROW}</p>
        <h1>
          {title ? (
            withHighlight(title)
          ) : (
            <>
              {DEFAULT_HERO_TITLE} <span>{DEFAULT_HERO_HIGHLIGHT}</span>
            </>
          )}
        </h1>
        <p className="hero-lead">{subtitle ?? DEFAULT_HERO_SUBTITLE}</p>
        <HeroSearch societies={societies} propertyTypes={propertyTypes} />
      </div>

      <div className="hero-trust">
        <ul className="container hero-trust-inner">
          {HERO_TRUST.map((item) => {
            const Icon = TRUST_ICONS[item.icon];

            return (
              <li key={item.title}>
                <Icon className="icon-lg" />
                <div>
                  <strong>{item.title}</strong>
                  <small>{item.text}</small>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
