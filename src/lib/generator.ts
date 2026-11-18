import { PALETTES, contrastRatio, variantTheme } from "./themes";
import {
  PALETTE_IDS,
  type CardStyle,
  type HeadingFont,
  type HeroLayout,
  type Radius,
  type SiteSpec,
  type Variant,
  type VariantFeatures,
  type VariantKind,
} from "./types";

function radiusFor(spec: SiteSpec): Radius {
  if (spec.tone === "playful") return "xl";
  if (spec.tone === "minimal") return "sm";
  return "lg";
}

function alternatePalette(spec: SiteSpec) {
  const index = PALETTE_IDS.indexOf(spec.paletteId);
  return PALETTE_IDS[(index + 1) % PALETTE_IDS.length];
}

/** Always produces three approved variants. Order is decided by the ranker. */
export function generateVariants(spec: SiteSpec): Variant[] {
  const headingFont: HeadingFont = spec.tone === "elegant" ? "serif" : "sans";
  const radius = radiusFor(spec);
  const base = {
    radius,
    mode: spec.mode,
    industry: spec.industry,
    sections: [...spec.sections],
  };

  const safeHero: HeroLayout = spec.tone === "bold" ? "banner" : "centered";
  const recommendedCards: CardStyle = spec.tone === "minimal" ? "outlined" : "elevated";

  return [
    {
      ...base,
      id: "safe",
      animation: "subtle",
      label: "Safe",
      description: "Established layout with clear structure and quiet styling.",
      heroLayout: safeHero,
      cardStyle: "outlined",
      headingFont,
      paletteId: spec.paletteId,
    },
    {
      ...base,
      id: "recommended",
      animation: "subtle",
      label: "Recommended",
      description: "Balanced split hero with depth that suits your description.",
      heroLayout: "split",
      cardStyle: recommendedCards,
      headingFont,
      paletteId: spec.paletteId,
    },
    {
      ...base,
      id: "creative",
      animation: "lively",
      label: "Creative",
      description: "A more distinctive banner hero with an alternate color accent.",
      heroLayout: "banner",
      cardStyle: "soft",
      headingFont: "serif",
      paletteId: alternatePalette(spec),
    },
  ] satisfies Variant[];
}

export function variantFeatures(variant: Variant): VariantFeatures {
  const { heroLayout, cardStyle, headingFont, paletteId, mode } = variant;
  return { heroLayout, cardStyle, headingFont, paletteId, mode };
}

export const VARIANT_PRIOR: Record<VariantKind, number> = {
  recommended: 0.6,
  safe: 0.5,
  creative: 0.4,
};

const AA_TEXT = 4.5;

/** Rule-based quality gate. Independent of user popularity. */
export function checkAccessibility(variant: Variant): string[] {
  const t = variantTheme(variant, variant.mode);
  const checks: Array<[string, string, string]> = [
    ["Body text on background", t.text, t.bg],
    ["Body text on cards", t.text, t.surface],
    ["Muted text on background", t.muted, t.bg],
    ["Muted text on cards", t.muted, t.surface],
    ["Button text on accent", t.accentText, t.accent],
  ];
  const issues: string[] = [];
  for (const [name, fg, bg] of checks) {
    const ratio = contrastRatio(fg, bg);
    if (ratio < AA_TEXT) {
      issues.push(`${name} contrast ${ratio.toFixed(2)}:1 is below ${AA_TEXT}:1`);
    }
  }
  return issues;
}

export function paletteName(variant: Variant): string {
  return variant.colors?.accent ? "Custom" : PALETTES[variant.paletteId].name;
}
