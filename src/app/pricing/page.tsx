import type { Metadata } from "next";
import { publicApi } from "@/lib/api";
import { formatPrice } from "@/lib/labels";
import { openGraph } from "@/lib/seo";
import { portalUrl } from "@/lib/site";
import type { Collection, Offer, OfferItem } from "@/types/api";

export const revalidate = 300;

const TITLE = "Pricing for owners and agencies";
const DESCRIPTION = "Compare listing plans for property owners and real estate agencies: property listings, featured ads, refresh credits and more.";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: "/pricing" },
    openGraph: await openGraph({ title: TITLE, description: DESCRIPTION, url: "/pricing" }),
  };
}

function featureText(item: OfferItem): string {
  const name = item.quota_item?.name ?? "";

  if (item.quota_item?.type === "boolean") {
    return name;
  }

  const value = item.is_unlimited ? "Unlimited" : item.limit_value.toLocaleString("en-PK");
  const suffix = item.reset_period === "monthly" ? " per month" : item.reset_period === "yearly" ? " per year" : "";

  return `${value} ${name}${suffix}`;
}

export default async function PricingPage() {
  const offers = await publicApi<Collection<Offer>>("offers", { revalidate: 300 })
    .then((response) => response.data)
    .catch(() => []);

  const plans = offers.filter((offer) => !offer.is_addon);
  const addons = offers.filter((offer) => offer.is_addon);

  return (
    <div className="container page-section">
      <div className="page-hero">
        <h1>Simple plans for every seller</h1>
        <p>Start free, then upgrade when you need more listings, featured ads or agent accounts.</p>
      </div>

      <div className="pricing-grid">
        {plans.map((offer) => (
          <article key={offer.id} className={`pricing-card${offer.badge_text ? " highlight" : ""}`}>
            {offer.badge_text && <span className="pricing-badge">{offer.badge_text}</span>}
            <h3>{offer.name}</h3>
            <p>{offer.audience === "agency" ? "For real estate agencies" : offer.audience === "individual" ? "For property owners" : offer.audience === "developer" ? "For developers" : "For owners and agencies"}</p>
            <div className="pricing-price">
              {offer.is_free ? "Free" : formatPrice(offer.current_price)}
              <small>{offer.duration_days ? ` / ${offer.duration_days} days` : " forever"}</small>
            </div>
            <ul className="pricing-features">
              {(offer.items ?? []).map((item) => (
                <li key={item.id}>{featureText(item)}</li>
              ))}
            </ul>
            <a className={`btn ${offer.badge_text ? "btn-primary" : "btn-outline"}`} href={portalUrl("/register")}>
              {offer.is_free ? "Start free" : "Get started"}
            </a>
          </article>
        ))}
      </div>

      {addons.length > 0 && (
        <>
          <div className="section-head" style={{ marginTop: 56 }}>
            <div>
              <h2>Add-ons</h2>
              <p>Boost any plan when you need a little more</p>
            </div>
          </div>
          <div className="pricing-grid">
            {addons.map((offer) => (
              <article key={offer.id} className="pricing-card">
                <h3>{offer.name}</h3>
                <div className="pricing-price">
                  {formatPrice(offer.current_price)}
                  <small>{offer.duration_days ? ` / ${offer.duration_days} days` : ""}</small>
                </div>
                <ul className="pricing-features">
                  {(offer.items ?? []).map((item) => (
                    <li key={item.id}>{featureText(item)}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
