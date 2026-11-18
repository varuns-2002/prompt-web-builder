import {
  SECTION_KINDS,
  type BodySectionKind,
  type ContentItem,
  type SectionKind,
  type SectionLabel,
  type SiteContent,
} from "../types";
import { MAX_ITEMS } from "./limits";

/**
 * Pure editing operations for a website's text, cards and sections. The preview
 * and the sidebar both use these, so every change is validated in one place
 * with the same limits the server enforces.
 */

export const LIST_KEYS = ["features", "projects", "menu", "posts", "plans", "testimonials"] as const;
export type ListKey = (typeof LIST_KEYS)[number];

/** Which section shows each list. */
export const SECTION_OF_LIST: Record<ListKey, BodySectionKind> = {
  features: "features",
  projects: "projects",
  menu: "menu",
  posts: "posts",
  plans: "pricing",
  testimonials: "testimonials",
};

export const DEFAULT_LABELS: Record<BodySectionKind, SectionLabel> = {
  about: { title: "About", nav: "About" },
  features: { title: "What we offer", nav: "Services" },
  projects: { title: "Selected work", nav: "Work" },
  gallery: { title: "Gallery", nav: "Gallery" },
  menu: { title: "Menu", nav: "Menu" },
  posts: { title: "Latest posts", nav: "Blog" },
  pricing: { title: "Pricing", nav: "Pricing" },
  testimonials: { title: "What people say", nav: "Reviews" },
  contact: { title: "Get in touch", nav: "Contact" },
};

/** Same limits as the server (`validate.ts`). */
export const TEXT_LIMITS = {
  brand: 60,
  headline: 120,
  tagline: 240,
  cta: 40,
  about: 600,
  labelTitle: 40,
  labelNav: 20,
  itemTitle: 80,
  itemBody: 300,
  itemMeta: 40,
} as const;

export function isListKey(value: unknown): value is ListKey {
  return typeof value === "string" && (LIST_KEYS as readonly string[]).includes(value);
}

export function isBodySection(value: unknown): value is BodySectionKind {
  return typeof value === "string" && value !== "hero" && (SECTION_KINDS as readonly string[]).includes(value);
}

/** The text a section shows, using the website's own wording when it has one. */
export function labelOf(content: SiteContent, section: BodySectionKind): SectionLabel {
  return content.labels?.[section] ?? DEFAULT_LABELS[section];
}

export type EditOutcome = "applied" | "reload" | "unchanged" | "rejected";

// ---------------------------------------------------------------- text edits

const FIELDS = ["brand", "headline", "tagline", "cta", "about"] as const;
type Field = (typeof FIELDS)[number];

export type EditTarget =
  | { kind: "field"; field: Field }
  | { kind: "label"; section: BodySectionKind; part: "title" | "nav" }
  | { kind: "item"; list: ListKey; index: number; part: "title" | "body" | "meta" };

/** Reads an edit path such as "headline", "label:projects:title" or "item:projects:1:body". */
export function parseEditPath(path: unknown): EditTarget | null {
  if (typeof path !== "string" || path.length > 40) return null;
  const parts = path.split(":");
  if (parts.length === 1 && (FIELDS as readonly string[]).includes(parts[0])) {
    return { kind: "field", field: parts[0] as Field };
  }
  if (parts[0] === "label" && parts.length === 3 && isBodySection(parts[1]) && (parts[2] === "title" || parts[2] === "nav")) {
    return { kind: "label", section: parts[1], part: parts[2] };
  }
  if (
    parts[0] === "item" &&
    parts.length === 4 &&
    isListKey(parts[1]) &&
    /^\d{1,2}$/.test(parts[2]) &&
    (parts[3] === "title" || parts[3] === "body" || parts[3] === "meta")
  ) {
    return { kind: "item", list: parts[1], index: Number(parts[2]), part: parts[3] };
  }
  return null;
}

function describe(target: EditTarget): { name: string; max: number; required: boolean } {
  switch (target.kind) {
    case "field":
      return {
        brand: { name: "The name", max: TEXT_LIMITS.brand, required: true },
        headline: { name: "The headline", max: TEXT_LIMITS.headline, required: true },
        tagline: { name: "The tagline", max: TEXT_LIMITS.tagline, required: false },
        cta: { name: "The button text", max: TEXT_LIMITS.cta, required: true },
        about: { name: "The About text", max: TEXT_LIMITS.about, required: false },
      }[target.field];
    case "label":
      return target.part === "title"
        ? { name: "The section title", max: TEXT_LIMITS.labelTitle, required: true }
        : { name: "The menu label", max: TEXT_LIMITS.labelNav, required: true };
    case "item":
      return {
        title: { name: "The card title", max: TEXT_LIMITS.itemTitle, required: true },
        body: { name: "The card text", max: TEXT_LIMITS.itemBody, required: false },
        meta: { name: "The card detail", max: TEXT_LIMITS.itemMeta, required: false },
      }[target.part];
  }
}

function currentValue(content: SiteContent, target: EditTarget): string | undefined {
  switch (target.kind) {
    case "field":
      return target.field === "cta" ? content.ctaLabel : content[target.field];
    case "label":
      return labelOf(content, target.section)[target.part];
    case "item": {
      const item = content[target.list][target.index];
      return item ? (item[target.part] ?? "") : undefined;
    }
  }
}

export type TextEditResult =
  | { ok: true; content: SiteContent; outcome: "applied" | "reload" | "unchanged" }
  | { ok: false; error: string };

/**
 * Applies one text edit. "applied" means only that text changed, so a preview
 * that already shows it does not need to reload. "reload" means other parts of
 * the page change too (the menu, the footer).
 */
export function applyTextEdit(content: SiteContent, target: EditTarget, raw: string): TextEditResult {
  const value = raw.replace(/\s+/g, " ").trim();
  const { name, max, required } = describe(target);
  if (required && value.length === 0) return { ok: false, error: `${name} cannot be empty.` };
  if (value.length > max) return { ok: false, error: `${name} is too long. The limit is ${max} characters.` };

  const before = currentValue(content, target);
  if (before === undefined) return { ok: false, error: "That card no longer exists." };
  if (value === before) return { ok: true, content, outcome: "unchanged" };

  switch (target.kind) {
    case "field": {
      const key = target.field === "cta" ? "ctaLabel" : target.field;
      const reload = target.field === "brand";
      return { ok: true, content: { ...content, [key]: value }, outcome: reload ? "reload" : "applied" };
    }
    case "label": {
      const current = labelOf(content, target.section);
      // The menu follows a new title when it is short enough to fit there.
      const next: SectionLabel =
        target.part === "title"
          ? { title: value, nav: value.length <= TEXT_LIMITS.labelNav ? value : current.nav }
          : { ...current, nav: value };
      return { ok: true, content: { ...content, labels: { ...content.labels, [target.section]: next } }, outcome: "reload" };
    }
    case "item": {
      const list = content[target.list].map((item, i) => {
        if (i !== target.index) return item;
        if (target.part === "meta" && value === "") {
          const { meta: _meta, ...rest } = item;
          void _meta;
          return rest;
        }
        return { ...item, [target.part]: value };
      });
      return { ok: true, content: { ...content, [target.list]: list }, outcome: "applied" };
    }
  }
}

// ------------------------------------------------------------------- cards

const NEW_ITEM: Record<ListKey, ContentItem> = {
  features: { title: "New service", body: "Describe what you offer here." },
  projects: { title: "New project", body: "Tell people about this one.", meta: "2025" },
  menu: { title: "New dish", body: "Describe it here.", meta: "$10" },
  posts: { title: "New post", body: "A short summary of the post.", meta: "3 min read" },
  plans: { title: "New plan", body: "What is included.", meta: "$0" },
  testimonials: { title: "Customer name", body: "What they said about you." },
};

export function addItem(content: SiteContent, list: ListKey): SiteContent | null {
  if (content[list].length >= MAX_ITEMS) return null;
  return { ...content, [list]: [...content[list], { ...NEW_ITEM[list] }] };
}

export function removeItem(content: SiteContent, list: ListKey, index: number): SiteContent | null {
  if (index < 0 || index >= content[list].length) return null;
  return { ...content, [list]: content[list].filter((_, i) => i !== index) };
}

/** Moves a card one place earlier (-1) or later (+1). */
export function moveItem(content: SiteContent, list: ListKey, index: number, delta: -1 | 1): SiteContent | null {
  const to = index + delta;
  const items = content[list];
  if (index < 0 || index >= items.length || to < 0 || to >= items.length) return null;
  const next = [...items];
  [next[index], next[to]] = [next[to], next[index]];
  return { ...content, [list]: next };
}

// ---------------------------------------------------------------- sections

/** Move a section up (-1) or down (+1). The hero always stays first. */
export function moveSection(sections: SectionKind[], kind: BodySectionKind, delta: -1 | 1): SectionKind[] {
  const body = sections.filter((s): s is BodySectionKind => s !== "hero");
  const from = body.indexOf(kind);
  const to = from + delta;
  if (from === -1 || to < 0 || to >= body.length) return ["hero", ...body];
  const next = [...body];
  [next[from], next[to]] = [next[to], next[from]];
  return ["hero", ...next];
}

/** Moves a section to a new position among the sections below the hero. */
export function placeSection(sections: SectionKind[], kind: BodySectionKind, toIndex: number): SectionKind[] {
  const body = sections.filter((s): s is BodySectionKind => s !== "hero");
  const from = body.indexOf(kind);
  if (from === -1) return ["hero", ...body];
  const next = body.filter((s) => s !== kind);
  next.splice(Math.max(0, Math.min(toIndex, next.length)), 0, kind);
  return ["hero", ...next];
}

export function hideSection(sections: SectionKind[], kind: BodySectionKind): SectionKind[] {
  return ["hero", ...sections.filter((s) => s !== "hero" && s !== kind)];
}

/** Adds a section, placing it where it usually goes relative to the others. */
export function showSection(sections: SectionKind[], kind: BodySectionKind): SectionKind[] {
  const body = sections.filter((s): s is BodySectionKind => s !== "hero");
  if (body.includes(kind)) return ["hero", ...body];
  const rank = (s: SectionKind) => SECTION_KINDS.indexOf(s);
  const at = body.findIndex((s) => rank(s) > rank(kind));
  const next = [...body];
  next.splice(at === -1 ? next.length : at, 0, kind);
  return ["hero", ...next];
}

// ----------------------------------------------------------------- actions

export type EditAction =
  | { kind: "add"; list: ListKey }
  | { kind: "remove" | "earlier" | "later"; list: ListKey; index: number }
  | { kind: "section-up" | "section-down" | "section-hide"; section: BodySectionKind };

/** Reads an action string sent from the preview, such as "remove:projects:1". */
export function parseAction(action: unknown): EditAction | null {
  if (typeof action !== "string" || action.length > 40) return null;
  const parts = action.split(":");
  const [kind, a, b] = parts;
  if (kind === "add" && parts.length === 2 && isListKey(a)) return { kind, list: a };
  if ((kind === "remove" || kind === "earlier" || kind === "later") && parts.length === 3 && isListKey(a) && /^\d{1,2}$/.test(b)) {
    return { kind, list: a, index: Number(b) };
  }
  if ((kind === "section-up" || kind === "section-down" || kind === "section-hide") && parts.length === 2 && isBodySection(a)) {
    return { kind, section: a };
  }
  return null;
}
