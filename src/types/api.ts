/** Shapes returned by the Laravel public API (see dha-guj-api PublicPropertyResource and HomeController). */

export type Resource<T> = { data: T };

export type Collection<T> = { data: T[] };

export type Paginated<T> = {
  data: T[];
  meta: { current_page: number; last_page: number; per_page: number; total: number };
};

export type PropertyPurpose = "sale" | "rent";
export type PropertyCategory = "residential" | "plot" | "commercial";
export type AreaUnit = "marla" | "kanal" | "sq_ft" | "sq_yd" | "sq_m";
export type FurnishedStatus = "unfurnished" | "semi_furnished" | "furnished";
export type AccountType = "individual" | "agency" | "agent";
export type QuotaItemType = "credit" | "concurrent" | "per_entity" | "boolean" | "duration";
export type ResetPeriod = "none" | "monthly" | "yearly";

export type City = { id: number; name: string; slug: string };
export type Society = { id: number; city_id: number; name: string; slug: string };
export type PropertyType = { id: number; category: PropertyCategory; name: string; slug: string };
export type Amenity = { id: number; name: string; slug: string; icon: string | null };
/** thumbnail_url (≈480px) and medium_url (≈1280px) fall back to the original until the resize job has run. */
export type PropertyMedia = {
  id: number;
  type: "image" | "video";
  url: string;
  thumbnail_url?: string | null;
  medium_url?: string | null;
  sort_order: number;
  is_cover: boolean;
};

export type PublicProperty = {
  id: number;
  slug: string;
  purpose: PropertyPurpose;
  title: string;
  description: string;
  price: string;
  is_negotiable: boolean;
  installment_available: boolean;
  advance_amount: string | null;
  monthly_installment: string | null;
  installments_count: number | null;
  area_size: string;
  area_unit: AreaUnit;
  property_type?: PropertyType;
  city?: City;
  society?: Society | null;
  phase: string | null;
  block: string | null;
  address: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  floors: number | null;
  year_built: number | null;
  furnished: FurnishedStatus | null;
  amenities?: Amenity[];
  media?: PropertyMedia[];
  contact?: { name: string; phone: string | null; whatsapp: string | null; account_type: AccountType; agency?: AgencyLink | null };
  is_featured: boolean;
  /** Hot (premium) promotion; older API responses may leave it out. */
  is_hot?: boolean;
  published_at: string | null;
  refreshed_at: string | null;
  views_count: number;
};

/** Home page settings (GET /public/home → sections, also in GET /public/settings → home). */
export type HomeSections = {
  hero_title: string | null;
  hero_subtitle: string | null;
  hero_image_url: string | null;
  show_hot: boolean;
  show_featured: boolean;
  show_latest: boolean;
  show_cities: boolean;
  show_societies: boolean;
  show_agencies: boolean;
  show_blog: boolean;
};

export type HomeData = {
  sections?: Partial<HomeSections> | null;
  posts?: BlogPostSummary[];
  hot?: PublicProperty[];
  total_listings: number;
  featured: PublicProperty[];
  latest: PublicProperty[];
  cities: (City & { listings_count: number })[];
  popular_societies: (Society & { city: string; listings_count: number })[];
};

export type OfferItem = {
  id: number;
  quota_item?: { id: number; code: string; name: string; type: QuotaItemType; unit_label: string | null };
  limit_value: number;
  is_unlimited: boolean;
  reset_period: ResetPeriod;
};

export type Offer = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  audience: "individual" | "agency" | "both";
  price: string;
  current_price: string;
  is_on_sale: boolean;
  duration_days: number | null;
  is_free: boolean;
  is_addon: boolean;
  badge_text: string | null;
  items?: OfferItem[];
};

export type User = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  account_type: AccountType;
  status: "active" | "suspended";
  created_at: string;
};

export type AlertFrequency = "none" | "daily" | "weekly";

export type SavedSearch = {
  id: number;
  name: string;
  filters: Record<string, string | number | boolean>;
  alert_frequency: AlertFrequency;
  last_alerted_at: string | null;
  created_at: string;
};

export type AgencyLink = { name: string; slug: string; logo_url: string | null; is_verified: boolean };

export type AgencyProfile = {
  id: number;
  slug: string;
  name: string;
  about: string | null;
  logo_url: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  city?: City | null;
  is_verified: boolean;
  verified_at: string | null;
  listings_count?: number;
  agents?: { id: number; name: string }[];
  created_at: string;
};

/** GET /public/settings — any value may be null. */
export type SiteSettings = {
  general: { site_name: string | null; tagline: string | null; logo_url: string | null };
  contact: { email: string | null; phone: string | null; whatsapp: string | null; address: string | null; office_hours: string | null };
  social: { facebook: string | null; instagram: string | null; youtube: string | null; x: string | null; linkedin: string | null; tiktok: string | null };
};

export type SocialNetwork = keyof SiteSettings["social"];

/** GET /public/pages — published CMS pages without their content. */
export type CmsPageSummary = {
  id: number;
  slug: string;
  title: string;
  meta_title: string | null;
  meta_description: string | null;
  is_published: boolean;
  show_in_footer: boolean;
  sort_order: number;
  updated_at: string | null;
};

/** GET /public/pages/{slug} — content_html is sanitised by the API and safe to render. */
export type CmsPage = CmsPageSummary & { content: string; content_html: string };

/** GET /public/posts — published articles without their content. */
export type BlogPostSummary = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  is_published: boolean;
  published_at: string | null;
  author?: { id: number; name: string } | null;
  meta_title: string | null;
  meta_description: string | null;
  updated_at: string | null;
};

/** GET /public/posts/{slug} — content_html is sanitised by the API and safe to render. */
export type BlogPost = BlogPostSummary & { content: string; content_html: string };

export type BannerPlacement = "home_top" | "search_top" | "search_sidebar" | "listing_sidebar";

/** GET /public/banners?placement= — every banner returned counts as an impression. */
export type Banner = { id: number; title: string; image_url: string; link_url: string | null; placement: BannerPlacement };

export type Phase = { id: number; society_id: number; name: string; slug: string };

export type WantedPostStatus = "active" | "closed";

export type WantedPostApproval = "pending" | "approved" | "rejected";

/** A buyer requirement. contact is always null on the public API; only approved requirements shown to every seller are public. */
export type WantedPost = {
  id: number;
  purpose: PropertyPurpose;
  property_type?: PropertyType | null;
  city?: City | null;
  society?: Society | null;
  phase: string | null;
  min_price: string | null;
  max_price: string | null;
  min_area: string | null;
  max_area: string | null;
  area_unit: AreaUnit | null;
  bedrooms: number | null;
  description: string;
  status: WantedPostStatus;
  is_open: boolean;
  /** Open and approved by an admin, so sellers can see it. */
  is_live: boolean;
  /** Only on the buyer's own requirements. */
  approval_status?: WantedPostApproval;
  rejection_reason?: string | null;
  is_unlocked?: boolean;
  unlocks_count?: number;
  contact: { name: string; phone: string; email: string | null } | null;
  expires_at: string | null;
  created_at: string;
};
