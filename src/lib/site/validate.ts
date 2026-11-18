import {
  ANIMATION_STYLES,
  CARD_STYLES,
  HEADING_FONTS,
  HERO_LAYOUTS,
  IMAGE_MODES,
  INDUSTRIES,
  PALETTE_IDS,
  RADII,
  SECTION_KINDS,
  THEME_MODES,
  VARIANT_KINDS,
  type ContentItem,
  type CustomColors,
  type SiteContent,
  type Variant,
} from "../types";
import { isHexColor } from "../themes";
import { isValidEmail } from "../email";
import {
  MAX_GALLERY_IMAGES,
  MAX_ITEMS,
  MAX_PHOTO_CHARS,
  MAX_SLOT_IMAGE_CHARS,
  MAX_TOTAL_IMAGE_CHARS,
} from "./limits";
import { imageChars } from "./slots";

export class ValidationError extends Error {}

type Obj = Record<string, unknown>;

function obj(value: unknown, name: string): Obj {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ValidationError(`${name} must be an object`);
  }
  return value as Obj;
}

function text(value: unknown, name: string, max: number, allowEmpty = false): string {
  if (typeof value !== "string") throw new ValidationError(`${name} must be a string`);
  const trimmed = value.trim();
  if (!allowEmpty && trimmed.length === 0) throw new ValidationError(`${name} is required`);
  if (trimmed.length > max) throw new ValidationError(`${name} is longer than ${max} characters`);
  return trimmed;
}

function oneOf<T extends string>(value: unknown, options: readonly T[], name: string): T {
  if (typeof value !== "string" || !options.includes(value as T)) {
    throw new ValidationError(`${name} is not a supported value`);
  }
  return value as T;
}

const PHOTO_PATTERN = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/;

/** True when the leading bytes match the declared image type (not just the label). */
function hasImageSignature(dataUrl: string): boolean {
  const kind = dataUrl.slice(11, dataUrl.indexOf(";"));
  const head = dataUrl.slice(dataUrl.indexOf(",") + 1, dataUrl.indexOf(",") + 33);
  let bytes: string;
  try {
    bytes = atob(head.slice(0, head.length - (head.length % 4)));
  } catch {
    return false;
  }
  const at = (i: number) => bytes.charCodeAt(i);
  if (kind === "jpeg") return at(0) === 0xff && at(1) === 0xd8 && at(2) === 0xff;
  if (kind === "png") return at(0) === 0x89 && bytes.slice(1, 4) === "PNG";
  return bytes.slice(0, 4) === "RIFF" && bytes.slice(8, 12) === "WEBP";
}

/** Accepts only JPEG/PNG/WebP data URLs within the size limit. Returns undefined for "no image". */
function image(raw: unknown, name: string, maxChars: number): string | undefined {
  if (raw === undefined || raw === null || raw === "") return undefined;
  if (typeof raw !== "string") throw new ValidationError(`${name} must be an image`);
  if (raw.length > maxChars) throw new ValidationError("A picture is too large. Try a smaller image.");
  if (!PHOTO_PATTERN.test(raw) || !hasImageSignature(raw)) {
    throw new ValidationError(`${name} must be a JPEG, PNG or WebP image`);
  }
  return raw;
}

function items(value: unknown, name: string, withImages = false): ContentItem[] {
  if (!Array.isArray(value) || value.length > MAX_ITEMS) {
    throw new ValidationError(`${name} must be a list of at most ${MAX_ITEMS} items`);
  }
  return value.map((raw, i) => {
    const item = obj(raw, `${name}[${i}]`);
    const result: ContentItem = {
      title: text(item.title, `${name}[${i}].title`, 80),
      body: text(item.body, `${name}[${i}].body`, 300, true),
    };
    if (item.meta !== undefined) {
      result.meta = text(item.meta, `${name}[${i}].meta`, 40, true);
    }
    if (withImages) {
      const picture = image(item.image, `${name}[${i}].image`, MAX_SLOT_IMAGE_CHARS);
      if (picture) result.image = picture;
    }
    return result;
  });
}

function parsePhoto(raw: unknown): string | undefined {
  return image(raw, "variant.photo", MAX_PHOTO_CHARS);
}

export { MAX_PHOTO_CHARS };

function parseColors(raw: unknown): CustomColors | undefined {
  if (raw === undefined || raw === null) return undefined;
  const c = obj(raw, "variant.colors");
  const colors: CustomColors = {};
  for (const key of ["accent", "bg", "text"] as const) {
    const value = c[key];
    if (value === undefined || value === null) continue;
    if (!isHexColor(value)) throw new ValidationError(`variant.colors.${key} must be a #rrggbb color`);
    colors[key] = value.toLowerCase();
  }
  return Object.keys(colors).length > 0 ? colors : undefined;
}

function parseVariant(raw: unknown): Variant {
  const v = obj(raw, "variant");
  if (!Array.isArray(v.sections)) throw new ValidationError("variant.sections must be a list");
  // The user's order is kept. Duplicates are dropped and the hero always comes first.
  const listed = v.sections.map((s) => oneOf(s, SECTION_KINDS, "variant.sections item"));
  const ordered = ["hero" as const, ...new Set(listed.filter((kind) => kind !== "hero"))];
  const variant: Variant = {
    id: oneOf(v.id, VARIANT_KINDS, "variant.id"),
    label: text(v.label, "variant.label", 40),
    description: text(v.description, "variant.description", 200, true),
    heroLayout: oneOf(v.heroLayout, HERO_LAYOUTS, "variant.heroLayout"),
    cardStyle: oneOf(v.cardStyle, CARD_STYLES, "variant.cardStyle"),
    headingFont: oneOf(v.headingFont, HEADING_FONTS, "variant.headingFont"),
    radius: oneOf(v.radius, RADII, "variant.radius"),
    paletteId: oneOf(v.paletteId, PALETTE_IDS, "variant.paletteId"),
    mode: oneOf(v.mode, THEME_MODES, "variant.mode"),
    sections: ordered,
  };
  const colors = parseColors(v.colors);
  if (colors) variant.colors = colors;
  if (v.visitorColors !== undefined) {
    if (typeof v.visitorColors !== "boolean") {
      throw new ValidationError("variant.visitorColors must be true or false");
    }
    variant.visitorColors = v.visitorColors;
  }
  if (v.industry !== undefined) variant.industry = oneOf(v.industry, INDUSTRIES, "variant.industry");
  if (v.imageMode !== undefined) variant.imageMode = oneOf(v.imageMode, IMAGE_MODES, "variant.imageMode");
  if (v.animation !== undefined) variant.animation = oneOf(v.animation, ANIMATION_STYLES, "variant.animation");
  const photo = parsePhoto(v.photo);
  if (photo) variant.photo = photo;
  return variant;
}

function parseContent(raw: unknown): SiteContent {
  const c = obj(raw, "content");
  const content: SiteContent = {
    brand: text(c.brand, "content.brand", 60),
    headline: text(c.headline, "content.headline", 120),
    tagline: text(c.tagline, "content.tagline", 240, true),
    ctaLabel: text(c.ctaLabel, "content.ctaLabel", 40),
    about: text(c.about, "content.about", 600, true),
    features: items(c.features, "content.features", true),
    projects: items(c.projects, "content.projects", true),
    menu: items(c.menu, "content.menu", true),
    posts: items(c.posts, "content.posts", true),
    plans: items(c.plans, "content.plans"),
    testimonials: items(c.testimonials, "content.testimonials"),
    gallery: gallery(c.gallery),
  };
  if (c.contactEmail !== undefined && c.contactEmail !== null) {
    const contactEmail = text(c.contactEmail, "content.contactEmail", 254, true);
    if (contactEmail && !isValidEmail(contactEmail)) {
      throw new ValidationError("content.contactEmail must be a valid email address");
    }
    if (contactEmail) content.contactEmail = contactEmail;
  }
  const aboutImage = image(c.aboutImage, "content.aboutImage", MAX_SLOT_IMAGE_CHARS);
  if (aboutImage) content.aboutImage = aboutImage;
  const labels = parseLabels(c.labels);
  if (labels) content.labels = labels;
  return content;
}

/** Section titles. Only known section names are kept, and each title is length-limited. */
function parseLabels(raw: unknown): SiteContent["labels"] {
  if (raw === undefined || raw === null) return undefined;
  const o = obj(raw, "content.labels");
  const labels: NonNullable<SiteContent["labels"]> = {};
  for (const kind of SECTION_KINDS) {
    if (kind === "hero" || o[kind] === undefined) continue;
    const entry = obj(o[kind], `content.labels.${kind}`);
    labels[kind] = {
      title: text(entry.title, `content.labels.${kind}.title`, 40),
      nav: text(entry.nav, `content.labels.${kind}.nav`, 20),
    };
  }
  return Object.keys(labels).length > 0 ? labels : undefined;
}

function gallery(raw: unknown): string[] {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw) || raw.length > MAX_GALLERY_IMAGES) {
    throw new ValidationError(`content.gallery must be a list of at most ${MAX_GALLERY_IMAGES} pictures`);
  }
  return raw.map((entry, i) => {
    const picture = image(entry, `content.gallery[${i}]`, MAX_SLOT_IMAGE_CHARS);
    if (!picture) throw new ValidationError(`content.gallery[${i}] must be a picture`);
    return picture;
  });
}

/** Validates an untrusted request body and returns a clean, bounded copy. */
export function parseSitePayload(input: unknown): { variant: Variant; content: SiteContent } {
  const payload = obj(input, "payload");
  const variant = parseVariant(payload.variant);
  const content = parseContent(payload.content);
  if (imageChars(variant, content) > MAX_TOTAL_IMAGE_CHARS) {
    throw new ValidationError("There are too many pictures. Remove some or use smaller ones.");
  }
  return { variant, content };
}
