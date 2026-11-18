import type { PaletteId, ThemeMode, Variant } from "./types";

export interface ThemeColors {
  bg: string;
  surface: string;
  text: string;
  muted: string;
  border: string;
  accent: string;
  accentText: string;
  danger: string;
}

interface Neutral {
  bg: string;
  surface: string;
  text: string;
  muted: string;
  border: string;
  danger: string;
}

const LIGHT: Neutral = {
  bg: "#ffffff",
  surface: "#f4f6fb",
  text: "#0f172a",
  muted: "#475569",
  border: "#dbe1ec",
  danger: "#b91c1c",
};

const DARK: Neutral = {
  bg: "#0b1020",
  surface: "#141b30",
  text: "#f1f5f9",
  muted: "#a8b4cc",
  border: "#2a3550",
  danger: "#fca5a5",
};

export const PALETTES: Record<
  PaletteId,
  { name: string; accent: string; accentText: string }
> = {
  indigo: { name: "Indigo", accent: "#4f46e5", accentText: "#ffffff" },
  emerald: { name: "Emerald", accent: "#047857", accentText: "#ffffff" },
  rose: { name: "Rose", accent: "#be123c", accentText: "#ffffff" },
  amber: { name: "Amber", accent: "#f59e0b", accentText: "#1c1917" },
  sky: { name: "Sky", accent: "#0369a1", accentText: "#ffffff" },
  violet: { name: "Violet", accent: "#7c3aed", accentText: "#ffffff" },
};

const HEX = /^#[0-9a-f]{6}$/i;

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && HEX.test(value);
}

/** Accepts "#abc", "abc", "aabbcc" or "#aabbcc" and returns "#aabbcc", or null. */
export function normalizeHex(input: string): string | null {
  const raw = input.trim().replace(/^#/, "").toLowerCase();
  if (/^[0-9a-f]{3}$/.test(raw)) {
    return `#${raw[0]}${raw[0]}${raw[1]}${raw[1]}${raw[2]}${raw[2]}`;
  }
  return /^[0-9a-f]{6}$/.test(raw) ? `#${raw}` : null;
}

function rgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function hex(r: number, g: number, b: number): string {
  const part = (v: number) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0");
  return `#${part(r)}${part(g)}${part(b)}`;
}

/** Linear blend: t=0 gives a, t=1 gives b. */
function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = rgb(a);
  const [br, bg, bb] = rgb(b);
  return hex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t);
}

/** Black or white, whichever reads better. Always at least 4.5:1 on any color. */
export function readableOn(background: string): string {
  return contrastRatio("#ffffff", background) >= contrastRatio("#000000", background)
    ? "#ffffff"
    : "#000000";
}

/** Moves fg toward the most readable color until it reaches the contrast target. */
function ensureContrast(fg: string, backgrounds: string[], min: number): string {
  const ok = (c: string) => backgrounds.every((bg) => contrastRatio(c, bg) >= min);
  if (ok(fg)) return fg;
  const target = readableOn(backgrounds[0]);
  for (let t = 0.1; t <= 1; t += 0.1) {
    const candidate = mix(fg, target, t);
    if (ok(candidate)) return candidate;
  }
  return target;
}

export interface ColorOverrides {
  accent?: string;
  bg?: string;
  text?: string;
}

/**
 * Resolves the colors for one theme. Overrides replace the palette's accent,
 * page background and body text. Everything else (cards, borders, muted text,
 * button text, error color) is derived so it stays readable.
 */
export function resolveTheme(
  paletteId: PaletteId,
  mode: ThemeMode,
  overrides: ColorOverrides = {},
): ThemeColors {
  const base = mode === "dark" ? DARK : LIGHT;
  const palette = PALETTES[paletteId];

  const accent = isHexColor(overrides.accent) ? overrides.accent.toLowerCase() : palette.accent;
  const accentText = isHexColor(overrides.accent) ? readableOn(accent) : palette.accentText;
  const result: ThemeColors = { ...base, accent, accentText };

  const customBg = isHexColor(overrides.bg) ? overrides.bg.toLowerCase() : null;
  const customText = isHexColor(overrides.text) ? overrides.text.toLowerCase() : null;
  if (!customBg && !customText) return result;

  const bg = customBg ?? base.bg;
  // A custom background alone should not make the default text unreadable.
  const autoText =
    contrastRatio(base.text, bg) >= 4.5
      ? base.text
      : readableOn(bg) === "#ffffff"
        ? DARK.text
        : LIGHT.text;
  const text = customText ?? autoText;
  const surface = customBg ? mix(bg, text, 0.06) : base.surface;
  result.bg = bg;
  result.text = text;
  result.surface = surface;
  result.border = mix(bg, text, 0.2);
  result.muted = ensureContrast(mix(text, bg, 0.3), [bg, surface], 4.5);
  result.danger = ensureContrast(base.danger, [bg, surface], 4.5);
  return result;
}

/**
 * Theme for a variant in a given mode. The accent applies in both modes; custom
 * background and text colors apply only to the variant's own mode, so the
 * light/dark toggle on the published site still switches to a sensible theme.
 */
export function variantTheme(variant: Variant, mode: ThemeMode): ThemeColors {
  const colors = variant.colors ?? {};
  return resolveTheme(
    variant.paletteId,
    mode,
    mode === variant.mode ? colors : { accent: colors.accent },
  );
}

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(color: string): number {
  const [r, g, b] = rgb(color);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG 2.x contrast ratio between two #rrggbb colors. */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
