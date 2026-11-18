import { defaultBrand, packFor, usesIndustryDefaults } from "./industry-content";
import { readPrompt } from "./fuzzy";
import { INDUSTRY_KEYWORDS, INDUSTRY_PHRASES, SECTION_WORDS, STRONG_KEYWORDS } from "./lexicon";
import {
  INDUSTRIES,
  SECTION_KINDS,
  SITE_TYPES,
  type IndustryId,
  type PaletteId,
  type SectionKind,
  type SiteSpec,
  type SiteType,
  type ThemeMode,
  type Tone,
} from "./types";

export { DEFAULT_BRAND } from "./industry-content";

const WEAK_INDUSTRIES = new Set<IndustryId>(["writing"]);

const DEFAULT_INDUSTRY: Record<SiteType, IndustryId> = {
  portfolio: "creative",
  business: "business",
  product: "software",
  blog: "writing",
  restaurant: "food",
};

const TYPE_KEYWORDS: Record<SiteType, string[]> = {
  portfolio: [
    "portfolio",
    "resume",
    "cv",
    "personal",
    // People with a personal brand rather than a company.
    "driver",
    "racer",
    "athlete",
    "footballer",
    "cricketer",
    "boxer",
    "swimmer",
    "actor",
    "actress",
    "singer",
    "musician",
    "freelance",
    "freelancer",
    "photographer",
    "designer",
    "developer",
    "artist",
    "illustrator",
  ],
  business: [
    "business",
    "company",
    "agency",
    "consulting",
    "consultancy",
    "firm",
    "startup",
    "services",
    "corporate",
  ],
  product: ["product", "app", "saas", "landing", "launch", "software", "tool"],
  blog: ["blog", "article", "articles", "news", "magazine", "writer", "journal"],
  restaurant: [
    "restaurant",
    "cafe",
    "café",
    "coffee",
    "bakery",
    "food",
    "bistro",
    "pizzeria",
    "diner",
  ],
};

const TONE_KEYWORDS: Record<Tone, string[]> = {
  minimal: ["minimal", "minimalist", "clean", "simple", "plain"],
  modern: ["modern", "sleek", "contemporary", "professional"],
  bold: ["bold", "vibrant", "energetic", "striking"],
  elegant: ["elegant", "luxury", "luxurious", "classy", "refined", "sophisticated"],
  playful: ["playful", "fun", "colorful", "colourful", "friendly", "quirky"],
};

const DEFAULT_TONE: Record<SiteType, Tone> = {
  portfolio: "modern",
  business: "modern",
  product: "modern",
  blog: "minimal",
  restaurant: "elegant",
};

const COLOR_KEYWORDS: Record<string, PaletteId> = {
  indigo: "indigo",
  green: "emerald",
  emerald: "emerald",
  mint: "emerald",
  red: "rose",
  rose: "rose",
  pink: "rose",
  crimson: "rose",
  orange: "amber",
  yellow: "amber",
  amber: "amber",
  gold: "amber",
  blue: "sky",
  sky: "sky",
  cyan: "sky",
  teal: "sky",
  purple: "violet",
  violet: "violet",
  lavender: "violet",
};

const DEFAULT_PALETTE: Record<SiteType, PaletteId> = {
  portfolio: "indigo",
  business: "sky",
  product: "violet",
  blog: "rose",
  restaurant: "amber",
};

const DEFAULT_SECTIONS: Record<SiteType, SectionKind[]> = {
  portfolio: ["hero", "about", "projects", "contact"],
  business: ["hero", "about", "features", "testimonials", "contact"],
  product: ["hero", "features", "pricing", "testimonials", "contact"],
  blog: ["hero", "posts", "about", "contact"],
  restaurant: ["hero", "about", "menu", "testimonials", "contact"],
};

const SECTION_PATTERNS: Record<Exclude<SectionKind, "hero">, string> = {
  about: "about|bio|story",
  features: "features?|services?|benefits?|offerings?",
  projects: "projects?|work|case stud(?:y|ies)",
  gallery: "gallery|galleries|photos|pictures|images",
  menu: "menu",
  posts: "blog|posts?|articles?",
  pricing: "pricing|plans?|prices?",
  testimonials: "testimonials?|reviews?",
  contact: "contact|form|get in touch",
};

function pickType(words: string[], signals: string[]): SiteType {
  let best: SiteType = "business";
  let bestHits: string[] = [];
  let bestFirst = Infinity;
  for (const type of SITE_TYPES) {
    const hits = words.filter((w) => TYPE_KEYWORDS[type].includes(w));
    if (hits.length === 0) continue;
    // More matches win; ties go to the keyword mentioned earliest in the prompt.
    const first = words.findIndex((w) => TYPE_KEYWORDS[type].includes(w));
    if (hits.length > bestHits.length || (hits.length === bestHits.length && first < bestFirst)) {
      best = type;
      bestHits = hits;
      bestFirst = first;
    }
  }
  if (bestHits.length === 0) {
    signals.push("No site type found, defaulted to business");
  } else {
    signals.push(...[...new Set(bestHits)].map((h) => `"${h}" suggests ${best}`));
  }
  return best;
}

function pickTone(words: string[], type: SiteType, signals: string[]): Tone {
  for (const tone of Object.keys(TONE_KEYWORDS) as Tone[]) {
    const hit = words.find((w) => TONE_KEYWORDS[tone].includes(w));
    if (hit) {
      signals.push(`"${hit}" suggests ${tone} tone`);
      return tone;
    }
  }
  return DEFAULT_TONE[type];
}

function pickMode(words: string[], signals: string[], industry: IndustryId): ThemeMode {
  const dark = words.find((w) => ["dark", "night", "black"].includes(w));
  const light = words.find((w) => ["light", "bright", "white"].includes(w));
  if (dark && !light) {
    signals.push(`"${dark}" suggests dark mode`);
    return "dark";
  }
  if (light && !dark) return "light";
  const preferred = packFor(industry)?.mode;
  if (preferred) signals.push(`${industry} sites suit ${preferred} mode`);
  return preferred ?? "light";
}

function pickPalette(words: string[], type: SiteType, industry: IndustryId, signals: string[]): PaletteId {
  const hit = words.find((w) => w in COLOR_KEYWORDS);
  if (hit) {
    signals.push(`"${hit}" suggests the ${COLOR_KEYWORDS[hit]} palette`);
    return COLOR_KEYWORDS[hit];
  }
  return (usesIndustryDefaults(type, industry) ? packFor(industry)?.palette : undefined) ?? DEFAULT_PALETTE[type];
}

/** Picks the industry whose keywords appear most; ties go to the earliest mention. */
function pickIndustry(
  prompt: string,
  words: string[],
  type: SiteType,
  signals: string[],
): IndustryId {
  const lower = prompt.toLowerCase();
  const phraseText = lower.replace(/-/g, " ");
  let best: IndustryId | null = null;
  let bestScore = 0;
  let bestFirst = Infinity;
  let bestHit = "";

  for (const industry of INDUSTRIES) {
    if (industry === "business") continue;
    const keywords = INDUSTRY_KEYWORDS[industry];
    const hits = words.filter((w) => keywords.includes(w));
    const phrases = (INDUSTRY_PHRASES[industry] ?? []).filter((phrase) =>
      new RegExp(`\\b${phrase}\\b`).test(phraseText),
    );
    hits.push(...phrases);
    if (hits.length === 0) continue;

    const strong = hits.filter((h) => STRONG_KEYWORDS.has(h)).length;
    const score = (hits.length + strong + phrases.length * 2) * (WEAK_INDUSTRIES.has(industry) ? 0.25 : 1);
    const first = Math.min(...hits.map((h) => (phraseText.indexOf(h) === -1 ? Infinity : phraseText.indexOf(h))));
    if (score > bestScore || (score === bestScore && first < bestFirst)) {
      best = industry;
      bestScore = score;
      bestFirst = first;
      bestHit = hits[0];
    }
  }

  if (best) {
    signals.push(`"${bestHit}" suggests ${best} imagery`);
    return best;
  }
  signals.push("Could not tell the industry, so the text is generic. Choose one under Hero image.");
  return DEFAULT_INDUSTRY[type];
}

function pickBrand(prompt: string, type: SiteType, industry: IndustryId): string {
  const match = prompt.match(
    /(?:called|named)\s+["“']?([A-Z][\w'’.-]*(?:\s+(?:&\s+)?[A-Z][\w'’.-]*){0,3})/,
  );
  return match ? match[1].trim() : defaultBrand(type, industry);
}

function pickAudience(prompt: string): string | null {
  const match = prompt.match(
    /\bfor\s+(?:an?\s+|the\s+|my\s+)?([a-z][\w\s.+#-]{2,40}?)(?=\s+(?:with|that|which|and|who|using|in|featuring|including|without)\b|[,.;!?]|$)/i,
  );
  if (!match) return null;
  const audience = match[1].trim();
  return audience.split(/\s+/).length <= 5 ? audience : null;
}

function pickSections(
  prompt: string,
  type: SiteType,
  industry: IndustryId,
  signals: string[],
): SectionKind[] {
  const pack = packFor(industry);
  const wanted = new Set<SectionKind>(pack?.sections && usesIndustryDefaults(type, industry) ? pack.sections : DEFAULT_SECTIONS[type]);
  // Photographers show their pictures, so they get a gallery unless they exclude it.
  if (industry === "photography") wanted.add("gallery");
  for (const kind of Object.keys(SECTION_PATTERNS) as Array<
    keyof typeof SECTION_PATTERNS
  >) {
    const pattern = SECTION_PATTERNS[kind];
    const negated = new RegExp(
      `\\b(?:without|no|skip|exclude)\\s+(?:an?\\s+|the\\s+)?(?:${pattern})\\b`,
      "i",
    );
    const mentioned = new RegExp(`\\b(?:${pattern})\\b`, "i");
    if (negated.test(prompt)) {
      if (wanted.delete(kind)) signals.push(`Removed ${kind} section`);
    } else if (mentioned.test(prompt) && !wanted.has(kind)) {
      wanted.add(kind);
      signals.push(`Added ${kind} section`);
    }
  }
  wanted.add("hero");
  return SECTION_KINDS.filter((kind) => wanted.has(kind));
}

/** Every word the interpreter understands. Unknown words are compared against these to catch typos. */
const KNOWN_WORDS: ReadonlySet<string> = new Set([
  ...Object.values(INDUSTRY_KEYWORDS).flat(),
  ...Object.values(TYPE_KEYWORDS).flat(),
  ...Object.values(TONE_KEYWORDS).flat(),
  ...Object.keys(COLOR_KEYWORDS),
  ...SECTION_WORDS,
  "dark", "night", "black", "light", "bright", "white",
]);

/** Deterministic, local prompt interpreter. No network or LLM involved. */
export function interpretPrompt(prompt: string): SiteSpec {
  const clean = prompt.trim().replace(/\s+/g, " ").slice(0, 500);
  // Typos and plurals are resolved first, so "photograher" and "florists" are understood.
  // Digits are kept so words like "f1" and "3d" survive.
  const { words, text, corrections } = readPrompt(clean, KNOWN_WORDS);
  const signals: string[] = corrections.map((c) => `Read "${c.from}" as "${c.to}"`);

  const type = pickType(words, signals);
  const industry = pickIndustry(text, words, type, signals);
  const tone = pickTone(words, type, signals);
  const mode = pickMode(words, signals, industry);
  const paletteId = pickPalette(words, type, industry, signals);

  return {
    prompt: clean,
    type,
    brand: pickBrand(clean, type, industry),
    audience: pickAudience(clean),
    industry,
    mode,
    tone,
    paletteId,
    sections: pickSections(text, type, industry, signals),
    signals,
    corrections,
  };
}
