import type { CSSProperties } from "react";
import { HeroSearch } from "@/components/hero-search";
import { ChartIcon, PinIcon, ShieldIcon, UsersIcon } from "@/components/icons";
import { HERO_TRUST, type TrustItem } from "@/lib/home-content";
import type { PropertyType, Society } from "@/types/api";

/** Drop your own photo here to change the hero; until then the gradient below shows through. */
const DEFAULT_HERO_IMAGE = "/hero-dha-gujranwala.jpg";

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
function heroStyle(imageUrl: string | null): CSSProperties {
  const image = imageUrl && /^https?:\/\//i.test(imageUrl) ? imageUrl : DEFAULT_HERO_IMAGE;

  return { backgroundImage: `url(${JSON.stringify(image)})` };
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
  return (
    <section className="home-hero">
      <div className="home-hero-image" style={heroStyle(imageUrl)} aria-hidden="true" />
      <div className="container home-hero-inner">
        <p className="hero-eyebrow">{DEFAULT_HERO_EYEBROW}</p>
        <h1>
          {title ?? (
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
