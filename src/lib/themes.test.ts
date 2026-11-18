import { describe, expect, it } from "vitest";
import { buildContent } from "./content";
import { checkAccessibility, generateVariants } from "./generator";
import { interpretPrompt } from "./interpreter";
import { generateSite } from "./site/render";
import { ValidationError, parseSitePayload } from "./site/validate";
import { PALETTES, contrastRatio, normalizeHex, resolveTheme, variantTheme } from "./themes";
import { PALETTE_IDS } from "./types";

function sample() {
  const spec = interpretPrompt("modern portfolio for a designer");
  const [variant] = generateVariants(spec);
  return { variant, content: buildContent(spec) };
}

describe("normalizeHex", () => {
  it("accepts 3 and 6 digit values with or without #", () => {
    expect(normalizeHex("#ABC")).toBe("#aabbcc");
    expect(normalizeHex("ff8800")).toBe("#ff8800");
    expect(normalizeHex(" #FF8800 ")).toBe("#ff8800");
  });

  it("rejects invalid input, including CSS injection attempts", () => {
    for (const bad of ["", "#12", "#12345", "#gggggg", "red", "#fff; } body{", "url(x)"]) {
      expect(normalizeHex(bad)).toBeNull();
    }
  });
});

describe("resolveTheme with custom colors", () => {
  it("keeps preset palettes unchanged when there are no overrides", () => {
    expect(resolveTheme("indigo", "light").accent).toBe("#4f46e5");
    expect(resolveTheme("indigo", "dark").bg).toBe("#0b1020");
  });

  it("picks readable button text for any accent color", () => {
    for (const accent of ["#000000", "#ffffff", "#ffff00", "#ff0000", "#00ff00", "#123456", "#fedcba", "#777777"]) {
      const t = resolveTheme("indigo", "light", { accent });
      expect(contrastRatio(t.accentText, t.accent), accent).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("derives readable muted text, cards and errors from any background and text", () => {
    const combos = [
      { bg: "#ffffff", text: "#000000" },
      { bg: "#000000", text: "#ffffff" },
      { bg: "#fff7ed", text: "#431407" },
      { bg: "#0f172a", text: "#e2e8f0" },
      { bg: "#14532d", text: "#dcfce7" },
      { bg: "#fde68a", text: "#451a03" },
    ];
    for (const colors of combos) {
      const t = resolveTheme("sky", "light", colors);
      expect(t.bg).toBe(colors.bg);
      expect(t.text).toBe(colors.text);
      expect(contrastRatio(t.muted, t.bg), JSON.stringify(colors)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(t.muted, t.surface), JSON.stringify(colors)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(t.danger, t.bg), JSON.stringify(colors)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("chooses readable text automatically when only the background is customised", () => {
    const dark = resolveTheme("sky", "light", { bg: "#0a0a23" });
    expect(contrastRatio(dark.text, dark.bg)).toBeGreaterThanOrEqual(4.5);
    const light = resolveTheme("sky", "dark", { bg: "#fffbeb" });
    expect(contrastRatio(light.text, light.bg)).toBeGreaterThanOrEqual(4.5);
  });

  it("ignores invalid overrides", () => {
    const t = resolveTheme("indigo", "light", { accent: "nope", bg: "#12", text: "x" });
    expect(t).toEqual(resolveTheme("indigo", "light"));
  });

  it("works for every palette with a custom accent", () => {
    for (const id of PALETTE_IDS) {
      const t = resolveTheme(id, "dark", { accent: "#22c55e" });
      expect(t.accent).toBe("#22c55e");
    }
  });
});

describe("variantTheme", () => {
  it("applies custom bg and text only to the variant's own mode", () => {
    const { variant } = sample();
    const custom = { ...variant, mode: "dark" as const, colors: { accent: "#22c55e", bg: "#001122" } };
    expect(variantTheme(custom, "dark").bg).toBe("#001122");
    expect(variantTheme(custom, "light").bg).toBe("#ffffff");
    expect(variantTheme(custom, "light").accent).toBe("#22c55e");
  });
});

describe("custom colors in generated sites", () => {
  it("writes them into the stylesheet and keeps the accessibility check passing for valid combos", () => {
    const { variant, content } = sample();
    const colored = { ...variant, mode: "light" as const, colors: { accent: "#e11d48", bg: "#fff7ed", text: "#431407" } };
    const css = generateSite(colored, content)["styles.css"];
    expect(css).toContain("--accent:#e11d48");
    expect(css).toContain("--bg:#fff7ed");
    expect(css).toContain("--text:#431407");
    expect(css).toMatch(/data-theme="light"\][^}]*color-scheme:light/);
    expect(checkAccessibility(colored)).toEqual([]);
  });

  it("flags unreadable text and background choices", () => {
    const { variant } = sample();
    const bad = { ...variant, mode: "light" as const, colors: { bg: "#777777", text: "#808080" } };
    expect(checkAccessibility(bad).some((issue) => issue.startsWith("Body text"))).toBe(true);
  });
});

describe("visitor color picker", () => {
  it("is included by default with every approved palette and can be turned off", () => {
    const { variant, content } = sample();
    const on = generateSite(variant, content);
    expect(on["index.html"]).toContain("data-color-toggle");
    expect(on["index.html"]).toContain('id="swatch-list"');
    expect(on["script.js"]).toContain("site-accent:");
    for (const id of PALETTE_IDS) expect(on["script.js"]).toContain(PALETTES[id].accent);

    const off = generateSite({ ...variant, visitorColors: false }, content);
    expect(off["index.html"]).not.toContain("data-color-toggle");
    expect(off["script.js"]).not.toContain("site-accent:");
  });

  it("restores the site's own accent on reset and never writes inline style attributes", () => {
    const { variant, content } = sample();
    const custom = { ...variant, colors: { accent: "#e11d48" } };
    const files = generateSite(custom, content);
    expect(files["script.js"]).toContain('"#e11d48"');
    // The strict CSP blocks inline styles, so the HTML must not rely on them.
    expect(files["index.html"]).not.toMatch(/\sstyle=/);
  });

  it("validates the visitorColors flag", () => {
    const { variant, content } = sample();
    expect(parseSitePayload({ variant: { ...variant, visitorColors: false }, content }).variant.visitorColors).toBe(false);
    expect(parseSitePayload({ variant, content }).variant.visitorColors).toBeUndefined();
    expect(() => parseSitePayload({ variant: { ...variant, visitorColors: "yes" }, content })).toThrow(ValidationError);
  });
});

describe("parseSitePayload colors", () => {
  it("accepts, lowercases and keeps valid colors", () => {
    const { variant, content } = sample();
    const parsed = parseSitePayload({ variant: { ...variant, colors: { accent: "#E11D48", bg: "#FFF7ED" } }, content });
    expect(parsed.variant.colors).toEqual({ accent: "#e11d48", bg: "#fff7ed" });
  });

  it("omits empty colors and rejects anything that is not #rrggbb", () => {
    const { variant, content } = sample();
    expect(parseSitePayload({ variant: { ...variant, colors: {} }, content }).variant.colors).toBeUndefined();
    for (const accent of ["red", "#fff", "#12345g", "#ff0000; } body{display:none", 5]) {
      expect(() => parseSitePayload({ variant: { ...variant, colors: { accent } }, content })).toThrow(ValidationError);
    }
    expect(() => parseSitePayload({ variant: { ...variant, colors: "x" }, content })).toThrow(ValidationError);
  });
});
