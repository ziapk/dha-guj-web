import { AreaIcon, BedIcon, ClockIcon, HomeIcon, PinIcon } from "@/components/icons";
import { formatAreaRange, formatPriceRange, listedAgo } from "@/lib/labels";
import type { WantedPost } from "@/types/api";

export function wantedLocation(post: WantedPost): string {
  return [post.phase, post.society?.name, post.city?.name].filter(Boolean).join(", ");
}

/** A buyer requirement as sellers see it on the public site: never any contact details. */
export function WantedCard({ post }: { post: WantedPost }) {
  const budget = formatPriceRange(post.min_price, post.max_price);
  const area = formatAreaRange(post.min_area, post.max_area, post.area_unit);
  const location = wantedLocation(post);
  const subject = post.property_type?.name ?? "Property";

  return (
    <article className="wanted-card">
      <div className="wanted-card-head">
        <span className={`badge ${post.purpose === "rent" ? "badge-outline" : "badge-featured"}`}>{post.purpose === "rent" ? "Tenant" : "Buyer"}</span>
        <span className="wanted-card-date">
          <ClockIcon /> Posted <time dateTime={post.created_at}>{listedAgo(post.created_at)}</time>
        </span>
      </div>
      <h3 className="wanted-card-title">
        {subject} wanted to {post.purpose === "rent" ? "rent" : "buy"}
        {post.city ? ` in ${post.city.name}` : ""}
      </h3>
      <p className="wanted-card-budget">
        <span className="sr-only">Budget: </span>
        {budget ?? "Budget not specified"}
        {budget && post.purpose === "rent" ? <small> / month</small> : null}
      </p>
      <ul className="property-card-facts">
        {post.property_type && (
          <li>
            <HomeIcon /> {post.property_type.name}
          </li>
        )}
        {area && (
          <li>
            <AreaIcon /> {area}
          </li>
        )}
        {post.bedrooms !== null && post.bedrooms > 0 && (
          <li>
            <BedIcon /> {post.bedrooms}+ beds
          </li>
        )}
      </ul>
      {location && (
        <p className="property-card-location">
          <PinIcon /> <span>{location}</span>
        </p>
      )}
      <p className="wanted-card-description">{post.description}</p>
    </article>
  );
}
