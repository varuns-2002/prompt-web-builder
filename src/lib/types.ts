export const SITE_TYPES = [
  "portfolio",
  "business",
  "product",
  "blog",
  "restaurant",
] as const;
export type SiteType = (typeof SITE_TYPES)[number];

export const TONES = ["minimal", "modern", "bold", "elegant", "playful"] as const;
export type Tone = (typeof TONES)[number];

// Canonical page order. Sections are always rendered in this order.
export const SECTION_KINDS = [
  "hero",
  "about",
  "features",
  "projects",
  "gallery",
  "menu",
  "posts",
  "pricing",
  "testimonials",
  "contact",
] as const;
export type SectionKind = (typeof SECTION_KINDS)[number];

export const PALETTE_IDS = [
  "indigo",
  "emerald",
  "rose",
  "amber",
  "sky",
  "violet",
] as const;
export type PaletteId = (typeof PALETTE_IDS)[number];

export const THEME_MODES = ["light", "dark"] as const;
export type ThemeMode = (typeof THEME_MODES)[number];
export const HERO_LAYOUTS = ["centered", "split", "banner"] as const;
export type HeroLayout = (typeof HERO_LAYOUTS)[number];
export const CARD_STYLES = ["outlined", "elevated", "soft"] as const;
export type CardStyle = (typeof CARD_STYLES)[number];
export const HEADING_FONTS = ["sans", "serif"] as const;
export type HeadingFont = (typeof HEADING_FONTS)[number];
export const RADII = ["sm", "lg", "xl"] as const;
export type Radius = (typeof RADII)[number];
export const VARIANT_KINDS = ["safe", "recommended", "creative"] as const;
export type VariantKind = (typeof VARIANT_KINDS)[number];

export const ANIMATION_STYLES = ["none", "subtle", "lively"] as const;
export type AnimationStyle = (typeof ANIMATION_STYLES)[number];

/** Industries that have a matching built-in illustration. */
export const INDUSTRIES = [
  "photography",
  "software",
  "food",
  "fitness",
  "health",
  "legal",
  "realestate",
  "education",
  "travel",
  "fashion",
  "music",
  "beauty",
  "finance",
  "construction",
  "creative",
  "writing",
  "motorsport",
  "automotive",
  "sports",
  "pets",
  "gaming",
  "floral",
  "community",
  "homeservices",
  "bakery",
  "consulting",
  "recruitment",
  "marketing",
  "events",
  "interiors",
  "nonprofit",
  "retail",
  "dental",
  "cleaning",
  "logistics",
  "agriculture",
  "aitools",
  "cybersecurity",
  "fintech",
  "onlinecourses",
  "schools",
  "travelbooking",
  "business",
] as const;
export type IndustryId = (typeof INDUSTRIES)[number];

export const IMAGE_MODES = ["scene", "photo", "none"] as const;
export type ImageMode = (typeof IMAGE_MODES)[number];

/** Structured, validated description of the website the user asked for. */
export interface SiteSpec {
  prompt: string;
  type: SiteType;
  brand: string;
  audience: string | null;
  industry: IndustryId;
  mode: ThemeMode;
  tone: Tone;
  paletteId: PaletteId;
  sections: SectionKind[];
  /** Human-readable signals that drove the interpretation. */
  signals: string[];
  /** Misspelled words that were fixed while reading the prompt. */
  corrections?: Array<{ from: string; to: string }>;
}

/** User-chosen colors that override the palette. All values are #rrggbb. */
export interface CustomColors {
  accent?: string;
  bg?: string;
  text?: string;
}

/** One concrete design built only from approved sections and themes. */
export interface Variant {
  id: VariantKind;
  label: string;
  description: string;
  heroLayout: HeroLayout;
  cardStyle: CardStyle;
  headingFont: HeadingFont;
  radius: Radius;
  paletteId: PaletteId;
  mode: ThemeMode;
  sections: SectionKind[];
  colors?: CustomColors;
  /** Show a color picker on the finished site so visitors can recolor it. Defaults to on. */
  visitorColors?: boolean;
  /** Which built-in illustration to use. Defaults to "business". */
  industry?: IndustryId;
  /** Hero imagery: built-in illustration (default), the owner's photo, or none. */
  imageMode?: ImageMode;
  /** Owner's photo as a JPEG/PNG/WebP data URL. Only used when imageMode is "photo". */
  photo?: string;
  /** Motion on the finished site: none, subtle (default) or lively. Reduced-motion visitors see none. */
  animation?: AnimationStyle;
}

export type VariantFeatures = Pick<
  Variant,
  "heroLayout" | "cardStyle" | "headingFont" | "paletteId" | "mode"
>;

export interface ContentItem {
  title: string;
  body: string;
  meta?: string;
  /** Picture added by the owner, as a JPEG/PNG/WebP data URL. */
  image?: string;
}

export type BodySectionKind = Exclude<SectionKind, "hero">;

/** How a section is titled on the page and in the navigation. Differs per industry. */
export interface SectionLabel {
  title: string;
  nav: string;
}

export interface SiteContent {
  brand: string;
  /** Public destination address used by the static contact form's mailto link. */
  contactEmail?: string;
  headline: string;
  tagline: string;
  ctaLabel: string;
  about: string;
  features: ContentItem[];
  projects: ContentItem[];
  menu: ContentItem[];
  posts: ContentItem[];
  plans: ContentItem[];
  testimonials: ContentItem[];
  /** Picture shown beside the About text. */
  aboutImage?: string;
  /** Pictures for the Gallery section, as data URLs. */
  gallery: string[];
  /** Industry-specific section titles, such as "Race results" instead of "Selected work". */
  labels?: Partial<Record<BodySectionKind, SectionLabel>>;
}

export type FeedbackAction = "select" | "rate" | "export" | "regenerate" | "edit";

export interface FeedbackEvent {
  id: string;
  createdAt: string;
  action: FeedbackAction;
  siteType: SiteType;
  tone: Tone;
  features: VariantFeatures;
  rating?: number;
  sessionId?: string;
  promptKey?: string;
  field?: string;
}
