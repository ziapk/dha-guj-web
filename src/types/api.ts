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
export type AccountType = "individual" | "agency" | "agent" | "developer";
export type QuotaItemType = "credit" | "concurrent" | "per_entity" | "boolean" | "duration";
export type ResetPeriod = "none" | "monthly" | "yearly";

export type City = { id: number; name: string; slug: string };
export type Society = { id: number; city_id: number; name: string; slug: string };
export type PropertyType = { id: number; category: PropertyCategory; name: string; slug: string };
export type AmenityGroup = { id: number; name: string; slug: string; sort_order: number };
export type AmenityIconType = "none" | "preset" | "custom";
export type Amenity = {
  id: number;
  name: string;
  slug: string;
  /** "preset": draw the built-in icon named by `icon`; "custom": show the uploaded `icon_url`; "none": no icon. */
  icon_type?: AmenityIconType;
  icon: string | null;
  icon_url?: string | null;
  amenity_group_id?: number | null;
  group?: AmenityGroup | null;
};
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
  sector: string | null;
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
  audience: "individual" | "agency" | "both" | "developer";
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

/** GET /public/agents and /public/agents/{slug} — only admin-approved agents are returned. */
export type PublicAgent = {
  id: number;
  slug: string;
  name: string;
  designation: string | null;
  short_bio: string | null;
  /** Sanitised by the API and safe to render. Only on GET /public/agents/{slug}. */
  bio_html?: string;
  photo_url: string | null;
  experience_years: number | null;
  specialisation: string | null;
  areas_of_expertise: string[];
  languages: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  facebook: string | null;
  instagram: string | null;
  linkedin: string | null;
  x: string | null;
  youtube: string | null;
  tiktok: string | null;
  website: string | null;
  city?: City | null;
  agency?: { name: string; slug: string } | null;
  listings_count?: number;
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
  /** The designed layout the page uses; "default" is the plain rich-text page. */
  template?: string;
  meta_title: string | null;
  meta_description: string | null;
  is_published: boolean;
  show_in_footer: boolean;
  sort_order: number;
  updated_at: string | null;
};

/** GET /public/pages/{slug} — content_html is sanitised by the API and safe to render. */
export type CmsPage = CmsPageSummary & { content: string; content_html: string; sections?: Record<string, unknown> };

/** Icons the website can draw for CMS-chosen section icons. */
export type PageIcon =
  | "home" | "building" | "plot" | "key" | "chart" | "shield" | "users" | "user" | "star" | "diamond"
  | "briefcase" | "map" | "pin" | "phone" | "whatsapp" | "mail" | "clock" | "calendar" | "chat" | "search" | "megaphone";

/** Typed content for the About Us layout. */
export type AboutSections = {
  hero: { title: string | null; subtitle: string | null; image_url: string | null };
  intro_html: string | null;
  offers: { icon: PageIcon | null; title: string; text: string | null }[];
  why_us: { icon: PageIcon | null; title: string; text: string | null }[];
  vision: { heading: string | null; text: string | null };
  mission: { heading: string | null; text: string | null; points: string[] };
  stats: { value: string; label: string }[];
  leadership: { name: string; role: string | null; bio: string | null; photo_url: string | null; linkedin: string | null }[];
  cta: { heading: string | null; text: string | null; button_label: string | null; button_url: string | null };
};

/** Typed content for the Contact layout. */
export type ContactSections = {
  hero: { title: string | null; subtitle: string | null; image_url: string | null };
  intro_html: string | null;
  cards: { icon: PageIcon | null; title: string; lines: string[]; link_url: string | null }[];
  office_hours: { days: string; hours: string }[];
  map_embed_url: string | null;
  form: { heading: string | null; text: string | null; consent_text: string | null; success_message: string | null };
  dealers: { show: boolean; heading: string | null; text: string | null };
  faqs: { question: string; answer: string }[];
};

export type RateTrend = "up" | "down" | "stable";

/** One published rate. The rate is free text, e.g. "18.50 Lac" or "210-220 Lac". */
export type FileRateRow = {
  id: number;
  file_type: string;
  current_rate: string;
  contact_number: string | null;
  trend: RateTrend;
  updated_label: string | null;
  note: string | null;
};

export type FileRateTable = {
  id: number;
  title: string;
  subtitle: string | null;
  note: string | null;
  rates_updated_at: string | null;
  rows?: FileRateRow[];
};

/** A comparison table built column by column in the CMS. */
export type PageComparison = { title: string; intro?: string | null; columns: string[]; rows: (string | null)[][] };

/** Typed content for the File Rates layout. */
export type FileRatesSections = {
  hero: { title: string | null; subtitle: string | null; updated_label: string | null };
  intro_html: string | null;
  content_blocks: { heading: string; body_html: string | null }[];
  comparisons: PageComparison[];
  steps: { title: string; text: string | null }[];
  documents: string[];
  faqs: { question: string; answer: string }[];
  disclaimer_html: string | null;
  cta: { heading: string | null; text: string | null; phone: string | null; whatsapp: string | null; button_label: string | null };
};

/** A blog category, used to group and filter articles. */
export type PostCategory = { id: number; name: string; slug: string; description?: string | null; posts_count?: number };

/** The byline on an article; links to the author's own page. */
export type PostAuthor = { id: number; name: string; slug: string; designation: string | null; photo_url: string | null };

/** A blog byline with its own public page. GET /public/authors and /public/authors/{slug}. */
export type PublicAuthor = {
  id: number;
  slug: string;
  name: string;
  designation: string;
  short_bio: string;
  /** Sanitised by the API and safe to render. Only on GET /public/authors/{slug}. */
  bio_html?: string;
  photo_url: string | null;

  experience: string | null;
  specialisation: string | null;
  areas_of_expertise: string[];
  languages: string[];

  facebook: string | null;
  instagram: string | null;
  linkedin: string | null;
  x: string | null;
  youtube: string | null;
  tiktok: string | null;
  website: string | null;

  tagline: string | null;
  highlights: string[];
  education: string[];
  awards: string[];
  personal_note: string | null;

  meta_title: string | null;
  meta_description: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image_url: string | null;

  /** Worked out by the API from published blogs. */
  total_articles?: number;
  public_url: string;
  is_featured: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

/** GET /public/posts — published articles without their content. */
export type BlogPostSummary = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  is_published: boolean;
  published_at: string | null;
  author?: PostAuthor | null;
  category?: PostCategory | null;
  /** Typed in by the editor; null means the website works one out from the article. */
  read_time_minutes: number | null;
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

export type ConstructionStatus = "upcoming" | "under_construction" | "ready";

/** A project photo, video (YouTube/Vimeo link) or PDF brochure. thumbnail_url and medium_url are only set on images. */
export type ProjectMedia = {
  id: number;
  type: "image" | "video" | "brochure" | "master_plan" | "location_map" | "floor_plan" | "payment_plan" | "construction" | "logo";
  url: string;
  thumbnail_url: string | null;
  medium_url: string | null;
  original_name: string | null;
  sort_order: number;
  is_cover: boolean;
};

/** A unit type in a project with its own price and payment plan. Decimal fields come back as strings. */
export type ProjectUnit = {
  id: number;
  name: string;
  property_type?: PropertyType | null;
  property_type_id: number | null;
  area_size: string | null;
  area_unit: AreaUnit | null;
  price_from: string;
  price_to: string | null;
  price_per_sq_ft: string | null;
  down_payment: string | null;
  monthly_installment: string | null;
  installments_count: number | null;
  payment_plan: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  drawing_rooms: number | null;
  lounges: number | null;
  kitchens: number | null;
  study_rooms: number | null;
  store_rooms: number | null;
  balconies: number | null;
  terraces: number | null;
  parking_spaces: number | null;
  availability: string | null;
  description: string | null;
  floor_plan_url: string | null;
};

/** The grouped feature lists on a project; each one is a plain list of strings. */
export type ProjectFeatureGroup =
  | "main" | "smart_home" | "security" | "sustainability" | "energy" | "construction" | "community" | "business" | "other";

export type ProjectFeatures = Partial<Record<ProjectFeatureGroup, string[]>>;

export type ProjectNearbyPlace = {
  id: number;
  name: string;
  distance: string | null;
  distance_unit: string | null;
  description: string | null;
  maps_url: string | null;
};

export type ProjectPaymentPlan = {
  id: number;
  name: string;
  unit_type: string | null;
  total_price: string | null;
  booking_amount: string | null;
  down_payment: string | null;
  monthly_installment: string | null;
  quarterly_installment: string | null;
  half_yearly_installment: string | null;
  possession_payment: string | null;
  development_charges: string | null;
  other_charges: string | null;
  notes: string | null;
  image_url: string | null;
  pdf_url: string | null;
};

export type ProjectFloorPlan = {
  id: number;
  name: string;
  unit_type: string | null;
  level: string | null;
  area_size: string | null;
  area_unit: AreaUnit | null;
  bedrooms: number | null;
  bathrooms: number | null;
  image_url: string | null;
  pdf_url: string | null;
  description: string | null;
};

/** A live developer project (see dha-guj-api PublicProjectResource). contact is only on GET /public/projects/{slug}. */
export type PublicProject = {
  id: number;
  slug: string;

  name: string;
  project_type: string | null;
  short_description: string | null;
  description: string;
  video_url: string | null;
  virtual_tour_url: string | null;

  developer_name: string;
  developer_description: string | null;
  developer_website: string | null;
  sponsors: string | null;
  management_company: string | null;
  architect: string | null;
  consultant: string | null;
  construction_company: string | null;

  city?: City;
  society?: Society | null;
  city_id: number;
  society_id: number | null;
  country: string | null;
  province: string | null;
  phase: string | null;
  sector: string | null;
  block: string | null;
  street: string | null;
  address: string | null;
  landmark: string | null;
  maps_url: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
  location_description: string | null;

  category: string | null;
  property_type_ids: number[];
  total_land_area: string | null;
  project_size: string | null;
  buildings_count: number | null;
  towers_count: number | null;
  floors_count: number | null;
  /** Total units in the project. */
  units_total: number | null;
  launch_date: string | null;
  construction_status: ConstructionStatus;
  completion_date: string | null;
  possession_date: string | null;
  approval_number: string | null;

  /** Headline prices; fall back to the min and max over the unit types. */
  price_from: number | null;
  price_to: number | null;
  min_unit_size: string | null;
  max_unit_size: string | null;
  unit_size_unit: AreaUnit | null;
  currency: string | null;
  price_disclaimer: string | null;
  price_updated_at: string | null;

  features: ProjectFeatures;
  units?: ProjectUnit[];
  amenities?: Amenity[];
  nearby_places?: ProjectNearbyPlace[];
  payment_plans?: ProjectPaymentPlan[];
  floor_plans?: ProjectFloorPlan[];
  media?: ProjectMedia[];
  cover_url?: string | null;

  meta_title: string | null;
  meta_description: string | null;
  published_at: string | null;
  views_count: number;
  is_featured: boolean;
  /** Only on GET /public/projects/{slug}. */
  contact?: { name: string; office: string | null; phone: string | null; whatsapp: string | null; email: string | null };
};

/** Keyword autocomplete from GET /public/search/suggestions; each group holds at most five matches. */
export type SearchSuggestions = {
  societies: { id: number; name: string; slug: string; city_id: number; city: string | null }[];
  phases: { id: number; name: string; society_id: number; society: string | null; city_id: number | null }[];
  projects: { id: number; name: string; slug: string; developer_name: string; city: string | null }[];
  agencies: { id: number; name: string; slug: string; city: string | null; is_verified: boolean }[];
};
