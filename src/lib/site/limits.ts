/** Size limits for pictures, shared by the browser (resizing) and the server (validation). */

/** Hero photo: resized to 1600 px wide. */
export const MAX_PHOTO_CHARS = 450_000;
/** Pictures in cards, About and Gallery: resized to 1000 px wide. */
export const MAX_SLOT_IMAGE_CHARS = 200_000;
/** All pictures in one website together, which keeps the published page a sensible size. */
export const MAX_TOTAL_IMAGE_CHARS = 2_400_000;
export const MAX_GALLERY_IMAGES = 8;
/** Most cards allowed in one list (features, projects, menu, posts, plans, reviews). */
export const MAX_ITEMS = 12;
/** Largest file the builder will read. It is shrunk before it is stored. */
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
/** Request body limit: all pictures plus room for the text. */
export const MAX_BODY_BYTES = 2_600_000;

export const HERO_IMAGE = { maxWidth: 1600, maxChars: MAX_PHOTO_CHARS - 30_000 } as const;
export const SLOT_IMAGE = { maxWidth: 1000, maxChars: MAX_SLOT_IMAGE_CHARS - 10_000 } as const;

/** Pictures can be dropped on these places. Parsed from the preview, so strictly validated. */
export const SLOT_PATTERN = /^(hero|about|gallery|(gallery|features|projects|menu|posts):\d{1,2})$/;

export type SlotKind = "hero" | "about" | "gallery" | "features" | "projects" | "menu" | "posts";

export interface SlotGuide {
  /** Where the picture appears, for display. */
  label: string;
  /** Best size in pixels: the shape the area is displayed in, at the width pictures are stored at. */
  width: number;
  height: number;
}

/** Recommended sizes. The shape matches how each area is drawn; width matches the stored size. */
export const SLOT_GUIDE: Record<SlotKind, SlotGuide> = {
  hero: { label: "Hero", width: HERO_IMAGE.maxWidth, height: 900 },
  about: { label: "About", width: SLOT_IMAGE.maxWidth, height: 750 },
  gallery: { label: "Gallery", width: SLOT_IMAGE.maxWidth, height: 750 },
  features: { label: "Cards", width: SLOT_IMAGE.maxWidth, height: 563 },
  projects: { label: "Cards", width: SLOT_IMAGE.maxWidth, height: 563 },
  menu: { label: "Cards", width: SLOT_IMAGE.maxWidth, height: 563 },
  posts: { label: "Cards", width: SLOT_IMAGE.maxWidth, height: 563 },
};

export const ACCEPTED_FORMATS_LABEL = "JPEG, PNG or WebP";

/** What a picture is resized and cropped to. The shape and size come from the area it appears in. */
export interface PictureTarget {
  width: number;
  height: number;
  /** Longest allowed data URL, in characters. */
  maxChars: number;
}

export function pictureTarget(kind: SlotKind): PictureTarget {
  const { width, height } = SLOT_GUIDE[kind];
  return { width, height, maxChars: kind === "hero" ? HERO_IMAGE.maxChars : SLOT_IMAGE.maxChars };
}

/** "1000 × 563 px" */
export function sizeLabel(kind: SlotKind): string {
  const { width, height } = SLOT_GUIDE[kind];
  return `${width} × ${height} px`;
}

/** Human-readable file size. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  const mb = bytes / (1024 * 1024);
  return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
}

/** Approximate stored bytes of a base64 data URL with this many characters. */
export function dataUrlBytes(chars: number): number {
  return Math.round(chars * 0.75);
}

/** Pictures are stored as data URLs, so the budget is measured in characters. */
export function pictureBudget(usedChars: number): { used: string; total: string; fraction: number } {
  return {
    used: formatBytes(dataUrlBytes(usedChars)),
    total: formatBytes(dataUrlBytes(MAX_TOTAL_IMAGE_CHARS)),
    fraction: Math.min(1, usedChars / MAX_TOTAL_IMAGE_CHARS),
  };
}

export interface SlotRef {
  kind: SlotKind;
  /** Present for a specific card or gallery picture. Absent for hero, about and "add to gallery". */
  index: number | null;
}

export function parseSlot(slot: unknown): SlotRef | null {
  if (typeof slot !== "string" || !SLOT_PATTERN.test(slot)) return null;
  const [kind, index] = slot.split(":");
  return { kind: kind as SlotKind, index: index === undefined ? null : Number(index) };
}
