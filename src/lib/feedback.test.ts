import { describe, expect, it } from "vitest";
import { feedbackPromptKey, findPromptRating, LocalFeedbackStore } from "./feedback";
import { generateVariants, variantFeatures } from "./generator";
import { interpretPrompt } from "./interpreter";
import { rankVariants } from "./ranker";

const variants = generateVariants(interpretPrompt("a bakery website"));
const base = {
  action: "rate" as const,
  siteType: "restaurant" as const,
  tone: "elegant" as const,
  features: variantFeatures(variants[0]),
  sessionId: "tab-one",
  promptKey: "a bakery website",
  rating: 5,
};

describe("session prompt ratings", () => {
  it("replaces a rating and its design features without growing the feedback count", () => {
    const store = new LocalFeedbackStore(null);
    const first = store.record(base);
    const next = store.record({ ...base, rating: 2, features: variantFeatures(variants[2]) });
    expect(store.count()).toBe(1);
    expect(next.id).toBe(first.id);
    expect(next.rating).toBe(2);
    expect(next.features).toEqual(variantFeatures(variants[2]));
    expect(findPromptRating(store.list(), "tab-one", " A  BAKERY website ")?.rating).toBe(2);
  });

  it("normalizes whitespace and case and ignores repeated clicks", () => {
    const store = new LocalFeedbackStore(null);
    store.record(base);
    store.record({ ...base, promptKey: " A  BAKERY WEBSITE " });
    store.record(base);
    expect(store.count()).toBe(1);
    expect(feedbackPromptKey(" A  BAKERY WEBSITE ")).toBe(base.promptKey);
  });

  it("keeps different prompts and independent sessions separate", () => {
    const store = new LocalFeedbackStore(null);
    store.record(base);
    store.record({ ...base, promptKey: "a gym website" });
    store.record({ ...base, sessionId: "tab-two", rating: 1 });
    expect(store.count()).toBe(3);
    expect(findPromptRating(store.list(), "tab-one", base.promptKey)?.rating).toBe(5);
    expect(findPromptRating(store.list(), "tab-two", base.promptKey)?.rating).toBe(1);
  });

  it("restores and replaces persisted ratings after the store is recreated", () => {
    const data = new Map<string, string>();
    const storage = {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => { data.set(key, value); },
      removeItem: (key: string) => { data.delete(key); },
    };
    const first = new LocalFeedbackStore(storage);
    first.record(base);
    const restored = new LocalFeedbackStore(storage);
    expect(findPromptRating(restored.list(), "tab-one", base.promptKey)?.rating).toBe(5);
    restored.record({ ...base, rating: 3 });
    expect(new LocalFeedbackStore(storage).count()).toBe(1);
    expect(new LocalFeedbackStore(storage).list()[0].rating).toBe(3);
  });

  it("preserves legacy feedback and other interaction events", () => {
    const store = new LocalFeedbackStore(null);
    store.record({ ...base, sessionId: undefined, promptKey: undefined });
    store.record({ ...base, action: "select" });
    store.record(base);
    store.record({ ...base, rating: 4 });
    expect(store.count()).toBe(3);
    expect(store.list().filter((event) => event.action === "rate")).toHaveLength(2);
  });

  it("uses only the replacement rating and design features when ranking", () => {
    const spec = interpretPrompt("a bakery website");
    const store = new LocalFeedbackStore(null);
    const fresh = new LocalFeedbackStore(null);
    const original = { ...base, siteType: spec.type };
    const replacement = { ...original, rating: 1, features: variantFeatures(variants[2]) };
    store.record(original);
    store.record(replacement);
    fresh.record(replacement);

    expect(store.count()).toBe(1);
    expect(rankVariants(variants, spec, store.list())).toEqual(rankVariants(variants, spec, fresh.list()));

    const baseline = rankVariants(variants, spec, []);
    const learned = rankVariants(variants, spec, store.list());
    const creativeScore = (ranked: ReturnType<typeof rankVariants>) =>
      ranked.find(({ variant }) => variant.id === "creative")!.score;
    expect(creativeScore(learned)).toBeLessThan(creativeScore(baseline));
  });

  it("promotes a preferred design across unique prompts and retains learning after reload", () => {
    const spec = interpretPrompt("portfolio for a designer");
    const designs = generateVariants(spec);
    const creative = designs.find((variant) => variant.id === "creative")!;
    const data = new Map<string, string>();
    const storage = {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => { data.set(key, value); },
      removeItem: (key: string) => { data.delete(key); },
    };
    const store = new LocalFeedbackStore(storage);
    expect(rankVariants(designs, spec, [])[0].variant.id).toBe("recommended");

    for (let index = 0; index < 8; index++) {
      const rating = {
        ...base,
        siteType: spec.type,
        tone: spec.tone,
        promptKey: `portfolio for designer ${index}`,
        features: variantFeatures(creative),
      };
      store.record(rating);
      store.record(rating);
    }

    expect(store.count()).toBe(8);
    const ranked = rankVariants(generateVariants(spec), spec, store.list());
    expect(ranked[0].variant.id).toBe("creative");
    const restored = new LocalFeedbackStore(storage);
    expect(rankVariants(generateVariants(spec), spec, restored.list())).toEqual(ranked);
  });
});
