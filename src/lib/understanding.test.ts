import { describe, expect, it } from "vitest";
import { editDistance, readPrompt, resolveWord } from "./fuzzy";
import { buildContent } from "./content";
import { interpretPrompt } from "./interpreter";
import { INDUSTRY_KEYWORDS } from "./lexicon";
import { packFor } from "./industry-content";

const known = new Set(Object.values(INDUSTRY_KEYWORDS).flat());
const industryOf = (prompt: string) => interpretPrompt(prompt).industry;

describe("editDistance", () => {
  it("counts a swap of neighbouring letters as one edit", () => {
    expect(editDistance("photograhper", "photographer", 2)).toBe(1);
    expect(editDistance("cafe", "cafe", 2)).toBe(0);
    expect(editDistance("restaurant", "resturant", 2)).toBe(1);
    expect(editDistance("abc", "xyz", 1)).toBeGreaterThan(1);
  });
});

describe("typo correction", () => {
  const typos: Array<[string, string]> = [
    ["a website for a photograher", "photography"],
    ["a photographer portfolio", "photography"],
    ["resturant website with a menu", "food"],
    ["a restarant", "food"],
    ["a bakary in town", "bakery"],
    ["an elegent coffe shop", "food"],
    ["a dentits office", "dental"],
    ["a plummer website", "construction"],
    ["a electrican", "construction"],
    ["a lawer website", "legal"],
    ["an acountant", "finance"],
    ["a real estete agent selling aparments", "realestate"],
    ["a florst", "floral"],
    ["a cleening company", "cleaning"],
    ["a begginer yoga studio", "fitness"],
    ["a wedding photograhper", "photography"],
    ["a developper portfolio", "software"],
    ["a musican website", "music"],
    ["a hotle booking site", "travelbooking"],
    ["a boutque for clothing", "fashion"],
    ["a salone for hair", "beauty"],
    ["a vetrinary clinic for dogs", "pets"],
    ["a mechancs garage", "automotive"],
    ["f1 racng driver", "motorsport"],
    ["a footbal club", "sports"],
  ];

  it.each(typos)("%s -> %s", (prompt, industry) => {
    expect(industryOf(prompt)).toBe(industry);
  });

  it("reports what it fixed, so the user can see it", () => {
    const spec = interpretPrompt("a website for a photograher");
    expect(spec.corrections).toEqual([{ from: "photograher", to: "photographer" }]);
    expect(spec.signals).toContain('Read "photograher" as "photographer"');
    expect(interpretPrompt("a photographer website").corrections).toEqual([]);
  });

  it("fixes typos in other words too: site type, tone, colour and sections", () => {
    expect(interpretPrompt("a portfolo for a designer").type).toBe("portfolio");
    expect(interpretPrompt("an elegent cafe").tone).toBe("elegant");
    expect(interpretPrompt("a purpel gym site").paletteId).toBe("violet");
    expect(interpretPrompt("a bakery with a gallary and testamonials").sections).toEqual(
      expect.arrayContaining(["gallery", "testimonials"]),
    );
  });

  it("does not touch brand names or the audience text", () => {
    const spec = interpretPrompt("a cafe called Resturant Row for coffe lovers");
    expect(spec.brand).toBe("Resturant Row");
    expect(spec.audience).toContain("coffe lovers");
  });

  it("understands plural forms of known words", () => {
    expect(industryOf("a shop selling flowers")).toBe("floral");
    expect(industryOf("we are florists")).toBe("floral");
    expect(industryOf("a website for hairdressers")).toBe("beauty");
    expect(industryOf("a team of plumbers")).toBe("construction");
    expect(industryOf("cleaners for hire")).toBe("cleaning");
    expect(interpretPrompt("a team of plumbers").corrections).toEqual([]);
  });
});

describe("ordinary words are never 'corrected'", () => {
  // Words that are close to a keyword but are real, different words.
  const realWords = [
    "designed", "teaches", "trained", "builds", "builder's", "tourist", "horsey", "houseful", "heading", "created",
    "beautiful", "simple", "friendly", "modern", "professional", "family", "people", "company", "service", "quality",
    "garden", "stable", "players", "layers", "painted", "painting", "doctors", "banked", "mothers", "clinical",
    "carpets", "shoeing", "dresser", "tutored", "taxing", "studios", "trading", "clubbed", "chessy", "natural",
    "something", "website", "online", "business", "customers", "welcome", "contact", "please", "create", "about",
  ];

  it.each(realWords)("leaves %s alone", (word) => {
    const fix = resolveWord(word, known);
    expect(fix.kind === "typo", `${word} -> ${fix.word}`).toBe(false);
  });

  it("does not change ordinary sentences", () => {
    for (const sentence of [
      "A website designed for busy families who love to cook at home",
      "She teaches maths and trained for years before opening her studio",
      "Please create something beautiful, simple and friendly for my company",
      "Our customers welcome quality service and honest advice",
    ]) {
      expect(interpretPrompt(sentence).corrections, sentence).toEqual([]);
    }
  });

  it("refuses to guess when two known words fit equally well", () => {
    const small = new Set(["capital", "capitol"]);
    expect(resolveWord("capitil", small).kind).toBe("unknown");
    expect(resolveWord("capitul", new Set(["capital"])).kind).toBe("typo");
  });

  it("only changes a letter at the end of a short word when it is clearly a typo", () => {
    // "trainee" would need a changed final letter to become "trainer".
    expect(resolveWord("trainee", known).kind).not.toBe("typo");
    expect(resolveWord("teacher", known).kind).toBe("known");
    expect(resolveWord("tutorr", known).kind).toBe("typo");
  });
});

describe("a much larger vocabulary", () => {
  const prompts: Array<[string, string]> = [
    ["a website for a florist", "floral"],
    ["a wedding bouquet shop", "floral"],
    ["a chess club", "community"],
    ["a local charity", "nonprofit"],
    ["a church community page", "community"],
    ["a book club", "community"],
    ["a golf club website", "sports"],
    ["a cleaning company", "cleaning"],
    ["a removals and handyman business", "homeservices"],
    ["a locksmith", "homeservices"],
    ["a barista training cafe", "food"],
    ["a sushi restaurant", "food"],
    ["a physiotherapy clinic", "health"],
    ["a solicitor", "legal"],
    ["a tax advisor and bookkeeper", "finance"],
    ["a karate dojo", "fitness"],
    ["a piano teacher", "music"],
    ["a videographer", "photography"],
    ["a poet", "writing"],
    ["a sneakers and streetwear brand", "fashion"],
    ["a horse riding stables", "pets"],
    ["a roblox streamer", "gaming"],
    ["a python developer", "software"],
    ["a welder", "construction"],
    ["a pottery studio", "creative"],
    ["a kindergarten", "schools"],
    ["a safari tour company", "travel"],
    ["a landlord with rentals", "realestate"],
  ];

  it.each(prompts)("%s -> %s", (prompt, industry) => {
    expect(industryOf(prompt)).toBe(industry);
  });

  it("writes real content for the new industries", () => {
    const florist = buildContent(interpretPrompt("a website for a florist"));
    expect(florist.headline).toBe("Fresh flowers, beautifully arranged");
    expect(florist.labels?.projects?.title).toBe("Recent arrangements");

    const chess = interpretPrompt("a chess club");
    expect(chess.brand).toBe("Riverside Community Club");
    expect(buildContent(chess).ctaLabel).toBe("Join us");

    expect(buildContent(interpretPrompt("a cleaning company")).headline).toBe(packFor("cleaning")!.headline);
    expect(buildContent(interpretPrompt("a handyman website")).headline).toBe("Reliable help for your home");
  });

  it("still ranks clear racing words above a single generic one", () => {
    expect(industryOf("an f1 car driver")).toBe("motorsport");
    expect(industryOf("a football club")).toBe("sports");
  });

  it("falls back to general text, and says so, for something it has no words for", () => {
    const spec = interpretPrompt("a website for my tiny submarine museum");
    expect(spec.industry).toBe("business");
    expect(spec.signals.join(" ")).toContain("Could not tell the industry");
  });
});

describe("readPrompt", () => {
  it("returns resolved words, the corrected text and each fix once", () => {
    const result = readPrompt("A photograher and another photograher, with florists", known);
    expect(result.corrections).toEqual([{ from: "photograher", to: "photographer" }]);
    expect(result.text).toBe("A photographer and another photographer, with florists");
    expect(result.words).toContain("florist");
  });
});
