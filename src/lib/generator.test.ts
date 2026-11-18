import { describe, expect, it } from "vitest";
import { buildContent } from "./content";
import { checkAccessibility, generateVariants, variantFeatures } from "./generator";
import { interpretPrompt } from "./interpreter";
import { LocalFeedbackStore } from "./feedback";
import { rankVariants } from "./ranker";
import { PALETTE_IDS, SITE_TYPES, type FeedbackEvent } from "./types";

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  };
}

describe("generateVariants", () => {
  it("creates three distinct variants that keep the requested sections", () => {
    const spec = interpretPrompt("minimal portfolio for a photographer");
    const variants = generateVariants(spec);
    expect(variants.map((v) => v.id)).toEqual(["safe", "recommended", "creative"]);
    const keys = new Set(variants.map((v) => JSON.stringify(variantFeatures(v))));
    expect(keys.size).toBe(3);
    for (const v of variants) expect(v.sections).toEqual(spec.sections);
  });

  it("passes the accessibility gate for every palette and mode", () => {
    for (const paletteId of PALETTE_IDS) {
      for (const mode of ["light", "dark"] as const) {
        const [variant] = generateVariants({
          ...interpretPrompt("business site"),
          paletteId,
          mode,
        });
        expect(checkAccessibility(variant), `${paletteId}/${mode}`).toEqual([]);
      }
    }
  });
});

describe("buildContent", () => {
  it("provides content for each section of every site type", () => {
    for (const type of SITE_TYPES) {
      const spec = { ...interpretPrompt(`${type} site`), type };
      const content = buildContent(spec);
      expect(content.brand).toBe(spec.brand);
      expect(content.headline.length).toBeGreaterThan(0);
      if (type === "restaurant") expect(content.menu.length).toBeGreaterThan(0);
      if (type === "portfolio") expect(content.projects.length).toBeGreaterThan(0);
      if (type === "product") expect(content.plans.length).toBeGreaterThan(0);
      if (type === "blog") expect(content.posts.length).toBeGreaterThan(0);
    }
  });
});

describe("rankVariants", () => {
  const spec = interpretPrompt("portfolio for a designer");
  const variants = generateVariants(spec);

  function event(action: FeedbackEvent["action"], id: string, rating?: number) {
    const variant = variants.find((v) => v.id === id)!;
    return {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      action,
      siteType: spec.type,
      tone: spec.tone,
      features: variantFeatures(variant),
      rating,
    } satisfies FeedbackEvent;
  }

  it("uses the prior ordering without feedback", () => {
    const ranked = rankVariants(variants, spec, []);
    expect(ranked.map((r) => r.variant.id)).toEqual([
      "recommended",
      "safe",
      "creative",
    ]);
  });

  it("promotes designs users repeatedly select and rate highly", () => {
    const events = [
      ...Array.from({ length: 6 }, () => event("select", "creative")),
      event("rate", "creative", 5),
    ];
    const ranked = rankVariants(variants, spec, events);
    expect(ranked[0].variant.id).toBe("creative");
  });

  it("ignores feedback for other site types and bounds the bonus", () => {
    const other = Array.from({ length: 50 }, () => ({
      ...event("select", "creative"),
      siteType: "blog" as const,
    }));
    expect(rankVariants(variants, spec, other)[0].variant.id).toBe("recommended");

    const many = Array.from({ length: 500 }, () => event("export", "creative"));
    const [top] = rankVariants(variants, spec, many);
    expect(top.score).toBeLessThanOrEqual(0.4 + 0.35);
  });

  it("lowers designs that are rated poorly", () => {
    const events = Array.from({ length: 6 }, () => event("rate", "recommended", 1));
    const ranked = rankVariants(variants, spec, events);
    expect(ranked[0].variant.id).not.toBe("recommended");
  });

  it("keeps neutral ratings, edits and regenerations out of learned scores", () => {
    const events = [
      event("rate", "creative", 3),
      event("edit", "creative"),
      event("regenerate", "recommended"),
    ];
    expect(rankVariants(variants, spec, events)).toEqual(rankVariants(variants, spec, []));
  });
});

describe("LocalFeedbackStore", () => {
  const features = variantFeatures(generateVariants(interpretPrompt("blog"))[0]);
  const base = { action: "select" as const, siteType: "blog" as const, tone: "minimal" as const, features };

  it("persists, notifies subscribers and clears", () => {
    const storage = memoryStorage();
    const store = new LocalFeedbackStore(storage);
    let notified = 0;
    const off = store.subscribe(() => notified++);
    store.record(base);
    expect(store.count()).toBe(1);
    expect(notified).toBe(1);
    expect(new LocalFeedbackStore(storage).count()).toBe(1);
    store.clear();
    expect(store.count()).toBe(0);
    off();
  });

  it("recovers from corrupt storage and works without storage", () => {
    const storage = memoryStorage();
    storage.setItem("prompt-web-builder:feedback:v1", "{not json");
    expect(new LocalFeedbackStore(storage).list()).toEqual([]);
    const noStorage = new LocalFeedbackStore(null);
    noStorage.record(base);
    expect(noStorage.count()).toBe(1);
  });
});
