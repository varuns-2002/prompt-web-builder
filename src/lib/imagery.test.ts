import { describe, expect, it } from "vitest";
import { buildContent } from "./content";
import { generateVariants } from "./generator";
import { interpretPrompt } from "./interpreter";
import { ART_CSS, INDUSTRY_LABELS, sceneSvg } from "./scenes";
import { generateSingleFile, generateSite } from "./site/render";
import { MAX_PHOTO_CHARS, ValidationError, parseSitePayload } from "./site/validate";
import { INDUSTRIES, type HeroLayout } from "./types";

function bytesToDataUrl(mime: string, bytes: number[], padding = 40): string {
  const data = Buffer.from([...bytes, ...new Array(padding).fill(1)]).toString("base64");
  return `data:${mime};base64,${data}`;
}

const JPEG = bytesToDataUrl("image/jpeg", [0xff, 0xd8, 0xff, 0xe0]);
const PNG = bytesToDataUrl("image/png", [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const WEBP = bytesToDataUrl("image/webp", [0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50]);

function sample(prompt = "photographer portfolio") {
  const spec = interpretPrompt(prompt);
  const variants = generateVariants(spec);
  return { spec, variant: variants[0], content: buildContent(spec) };
}

describe("industry detection", () => {
  const cases: Array<[string, string]> = [
    ["a portfolio for a wedding photographer", "photography"],
    ["a modern dark portfolio for a React developer", "software"],
    ["a bold SaaS landing page for remote teams", "software"],
    ["an elegant cafe website called Olive & Thyme", "food"],
    ["a gym website with class schedules", "fitness"],
    ["a dental clinic website", "dental"],
    ["a law firm website for a family lawyer", "legal"],
    ["a real estate agency", "realestate"],
    ["an online school with courses", "onlinecourses"],
    ["a hotel and tours website", "travel"],
    ["a boutique selling clothing", "fashion"],
    ["a band website for a musician", "music"],
    ["a hair salon", "beauty"],
    ["an accounting firm", "finance"],
    ["a plumbing and renovation contractor", "construction"],
    ["a graphic designer portfolio", "creative"],
  ];

  it.each(cases)("%s -> %s", (prompt, industry) => {
    expect(interpretPrompt(prompt).industry).toBe(industry);
  });

  it("treats blog as a weak format word, so the topic wins", () => {
    expect(interpretPrompt("a minimal green blog for writers about travel").industry).toBe("travel");
    expect(interpretPrompt("a blog for writers").industry).toBe("writing");
  });

  it("falls back to a sensible industry per site type", () => {
    expect(interpretPrompt("a simple website").industry).toBe("business");
    expect(interpretPrompt("a personal portfolio").industry).toBe("creative");
    expect(interpretPrompt("a landing page for our product").industry).toBe("software");
  });
});

describe("scenes", () => {
  it("has a label and a static, script-free illustration for every industry", () => {
    for (const id of INDUSTRIES) {
      const svg = sceneSvg(id);
      expect(INDUSTRY_LABELS[id]).toBeTruthy();
      expect(svg.startsWith("<svg")).toBe(true);
      expect(svg.endsWith("</svg>")).toBe(true);
      expect(svg).toContain('aria-hidden="true"');
      expect(svg).not.toMatch(/<script|onload|onerror|href=|style=|<image|url\(/i);
      // Elements animated by CSS must not carry their own transform attribute.
      expect(svg).not.toMatch(/class="float[^"]*"[^>]*transform=/);
    }
    expect(ART_CSS).toContain("prefers-reduced-motion");
  });
});

describe("hero imagery in generated sites", () => {
  const layouts: HeroLayout[] = ["centered", "split", "banner"];

  it("shows the industry illustration in every hero layout", () => {
    for (const heroLayout of layouts) {
      const { variant, content } = sample("wedding photographer portfolio");
      const html = generateSite({ ...variant, heroLayout }, content)["index.html"];
      expect(html, heroLayout).toContain('<svg class="art"');
      expect(html, heroLayout).toContain('class="hero-art');
    }
  });

  it("uses the chosen industry and can hide the image", () => {
    const { variant, content } = sample();
    const food = generateSite({ ...variant, heroLayout: "split", industry: "food" }, content)["index.html"];
    expect(food).toContain(sceneSvg("food"));
    const none = generateSite({ ...variant, heroLayout: "banner", imageMode: "none" }, content)["index.html"];
    expect(none).not.toContain('<svg class="art"');
    expect(none).not.toContain("banner-art");
  });

  it("embeds an uploaded photo: boxed in split, full-bleed in banner and centered", () => {
    const { variant, content } = sample();
    const photo = { ...variant, imageMode: "photo" as const, photo: JPEG };
    const split = generateSite({ ...photo, heroLayout: "split" }, content)["index.html"];
    expect(split).toContain(`<img class="photo" src="${JPEG}"`);
    for (const heroLayout of ["banner", "centered"] as const) {
      const html = generateSite({ ...photo, heroLayout }, content)["index.html"];
      expect(html, heroLayout).toContain(`<img class="hero-photo" src="${JPEG}"`);
      expect(html, heroLayout).toContain("has-photo");
      expect(html, heroLayout).not.toContain('<svg class="art"');
    }
    expect(generateSingleFile({ ...photo, heroLayout: "banner" }, content)).toContain(JPEG);
  });

  it("falls back to the illustration when photo mode has no photo", () => {
    const { variant, content } = sample();
    const html = generateSite({ ...variant, heroLayout: "split", imageMode: "photo" }, content)["index.html"];
    expect(html).toContain('<svg class="art"');
  });

  it("never needs inline styles or external images, so the strict CSP still holds", () => {
    const { variant, content } = sample();
    const html = generateSite({ ...variant, imageMode: "photo", photo: PNG }, content)["index.html"];
    expect(html).not.toMatch(/\sstyle=/);
    expect(html).not.toMatch(/src="https?:/);
  });
});

describe("photo validation", () => {
  const { variant, content } = sample();
  const parse = (photo: unknown) => parseSitePayload({ variant: { ...variant, imageMode: "photo", photo }, content });

  it("accepts JPEG, PNG and WebP with matching signatures", () => {
    for (const url of [JPEG, PNG, WEBP]) expect(parse(url).variant.photo).toBe(url);
  });

  it("rejects SVG, other types, mislabelled bytes, bad encoding and non-strings", () => {
    const svg = `data:image/svg+xml;base64,${Buffer.from("<svg onload=alert(1)/>").toString("base64")}`;
    const mislabelled = bytesToDataUrl("image/jpeg", [0x00, 0x01, 0x02, 0x03]);
    const html = bytesToDataUrl("image/png", [...Buffer.from("<script>alert(1)</script>")]);
    for (const bad of [svg, mislabelled, html, "data:image/gif;base64,R0lGODlh", "https://example.com/a.jpg", "javascript:alert(1)", `${JPEG}"onerror="x`, 5]) {
      expect(() => parse(bad), String(bad).slice(0, 40)).toThrow(ValidationError);
    }
  });

  it("rejects photos over the size limit", () => {
    expect(() => parse(`data:image/jpeg;base64,/9j/${"A".repeat(MAX_PHOTO_CHARS)}`)).toThrow(/too large/);
  });

  it("validates industry and imageMode and omits an empty photo", () => {
    expect(parseSitePayload({ variant: { ...variant, industry: "food", imageMode: "none" }, content }).variant).toMatchObject({
      industry: "food",
      imageMode: "none",
    });
    expect(() => parseSitePayload({ variant: { ...variant, industry: "../etc" }, content })).toThrow(ValidationError);
    expect(() => parseSitePayload({ variant: { ...variant, imageMode: "video" }, content })).toThrow(ValidationError);
    expect(parse("").variant.photo).toBeUndefined();
  });
});
