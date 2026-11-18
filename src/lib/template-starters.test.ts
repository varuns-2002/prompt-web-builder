import { describe, expect, it } from "vitest";
import { buildContent } from "./content";
import { generateVariants } from "./generator";
import { packFor } from "./industry-content";
import { interpretPrompt } from "./interpreter";
import { sceneSvg } from "./scenes";
import { esc, generateSite } from "./site/render";
import { parseSitePayload } from "./site/validate";
import { TEMPLATE_GROUPS } from "./template-starters";
import { INDUSTRIES, type IndustryId } from "./types";

describe("industry template starters", () => {
  const starters = TEMPLATE_GROUPS.flatMap((group) => group.starters);

  it("offers twenty-nine distinct categories across local, professional and digital businesses", () => {
    expect(starters).toHaveLength(29);
    expect(new Set(starters.map((starter) => starter.industry)).size).toBe(starters.length);
    for (const starter of starters) expect(INDUSTRIES).toContain(starter.industry);
  });

  it.each(starters)("$label generates relevant, publishable designs", ({ industry, prompt }) => {
    const spec = interpretPrompt(prompt);
    const pack = packFor(industry)!;
    const content = buildContent(spec);
    expect(spec.industry).toBe(industry);
    expect(content.brand).toBe(pack.brand);
    expect(content.headline).toBe(pack.headline);
    expect(content.labels).toEqual(pack.labels);
    expect(spec.paletteId).toBe(pack.palette);
    for (const variant of generateVariants(spec)) {
      expect(() => parseSitePayload({ variant, content })).not.toThrow();
      const html = generateSite(variant, content)["index.html"];
      expect(html).toContain(esc(content.headline));
      expect(html).toContain(sceneSvg(industry));
      expect(variant.industry).toBe(industry);
    }
    expect(sceneSvg(industry)).toContain("<svg");
  });

  const phrases: Array<[string, IndustryId]> = [
    ["a website for bakers", "bakery"],
    ["a bakary website", "bakery"],
    ["a website for consultants", "consulting"],
    ["a recruitment agency", "recruitment"],
    ["a marketing agency", "marketing"],
    ["a wedding planner", "events"],
    ["an event planning company", "events"],
    ["a wedding photographer", "photography"],
    ["an interior designer portfolio", "interiors"],
    ["a graphic designer portfolio", "creative"],
    ["a non-profit organisation", "nonprofit"],
    ["a not-for-profit website", "nonprofit"],
    ["an online store", "retail"],
    ["an e-commerce landing page", "retail"],
    ["an accounting firm", "finance"],
    ["a real estate agency", "realestate"],
    ["a dentist website", "dental"],
    ["an orthodontist dental clinic", "dental"],
    ["a house cleaning service", "cleaning"],
    ["an office cleaning company", "cleaning"],
    ["a courier company", "logistics"],
    ["a freight forwarding agency", "logistics"],
    ["an agriculture company", "agriculture"],
    ["a website for farmers", "agriculture"],
    ["an AI tool website", "aitools"],
    ["an artificial intelligence platform", "aitools"],
    ["a machine learning product", "aitools"],
    ["a cyber security agency", "cybersecurity"],
    ["a penetration testing company", "cybersecurity"],
    ["a fintech startup", "fintech"],
    ["a digital wallet app", "fintech"],
    ["a financial technology platform", "fintech"],
    ["an online course website", "onlinecourses"],
    ["an e-learning platform", "onlinecourses"],
    ["an LMS product", "onlinecourses"],
    ["a primary school website", "schools"],
    ["a preschool website", "schools"],
    ["a travel booking app", "travelbooking"],
    ["a hotel booking website", "travelbooking"],
    ["a website for doctors at a clinic", "health"],
    ["a university education website", "education"],
    ["a handyman appliance repair service", "homeservices"],
    ["an investment accounting firm", "finance"],
    ["a hotel and tour agency", "travel"],
    ["a cloud software company", "software"],
  ];

  it.each(phrases)("%s selects %s", (prompt, industry) => {
    expect(interpretPrompt(prompt).industry).toBe(industry);
  });

  it("respects explicit colours, mode and omitted sections", () => {
    const spec = interpretPrompt("a blue dark bakery website without gallery");
    expect(spec.paletteId).toBe("sky");
    expect(spec.mode).toBe("dark");
    expect(spec.sections).not.toContain("gallery");
    expect(spec.sections).toContain("menu");
  });

  it.each(["an ecommerce landing page", "an online shop with products"])(
    "%s uses a catalogue rather than SaaS copy or checkout",
    (prompt) => {
      const spec = interpretPrompt(prompt);
      const content = buildContent(spec);
      const pack = packFor("retail")!;
      expect(spec.type).toBe("product");
      expect(spec.industry).toBe("retail");
      expect(spec.brand).toBe(pack.brand);
      expect(new Set(spec.sections)).toEqual(new Set(pack.sections));
      expect(content.headline).toBe(pack.headline);
      expect(content.projects).toEqual(pack.projects);
      expect(content.ctaLabel).toBe(pack.cta);
      expect(content.ctaLabel).toMatch(/enquir/i);
      const html = generateSite(generateVariants(spec)[0], content)["index.html"];
      expect(html).not.toContain("Get started free");
      expect(html).not.toContain('id="pricing"');
      expect(html).not.toMatch(/add to cart|buy now|checkout/i);
    },
  );

  it("preserves software product landing pages", () => {
    const spec = interpretPrompt("a SaaS landing page with pricing");
    const content = buildContent(spec);
    expect(spec.type).toBe("product");
    expect(spec.industry).toBe("software");
    expect(content.ctaLabel).toBe("Get started free");
    expect(spec.sections).toContain("pricing");
  });

  it.each([
    ["an AI tool landing page", "aitools"],
    ["a cybersecurity product landing page", "cybersecurity"],
    ["a fintech app landing page", "fintech"],
    ["an online course platform landing page", "onlinecourses"],
    ["a travel booking app landing page", "travelbooking"],
  ] as const)("%s retains specialised product content", (prompt, industry) => {
    const spec = interpretPrompt(prompt);
    const pack = packFor(industry)!;
    const content = buildContent(spec);
    expect(spec.type).toBe("product");
    expect(spec.industry).toBe(industry);
    expect(content.headline).toBe(pack.headline);
    expect(content.features).toEqual(pack.features);
    expect(content.ctaLabel).toBe(pack.cta);
    expect(content.ctaLabel).not.toBe("Get started free");
    expect(new Set(spec.sections)).toEqual(new Set(pack.sections));
    for (const variant of generateVariants(spec)) {
      expect(() => parseSitePayload({ variant, content })).not.toThrow();
    }
  });

  it("gives every new industry distinct copy and an illustration", () => {
    const industries: IndustryId[] = [
      "dental", "cleaning", "logistics", "agriculture", "aitools",
      "cybersecurity", "fintech", "onlinecourses", "schools", "travelbooking",
    ];
    expect(new Set(industries.map((id) => packFor(id)!.headline)).size).toBe(industries.length);
    expect(new Set(industries.map((id) => sceneSvg(id))).size).toBe(industries.length);
  });

  it.each([
    ["dental clinic", "dental"],
    ["cleaning company", "cleaning"],
    ["logistics company", "logistics"],
    ["organic farm", "agriculture"],
    ["AI tool", "aitools"],
    ["cybersecurity company", "cybersecurity"],
    ["fintech app", "fintech"],
    ["online course platform", "onlinecourses"],
    ["primary school", "schools"],
    ["travel booking platform", "travelbooking"],
  ] as const)("keeps user preferences for a %s", (subject, industry) => {
    const spec = interpretPrompt(`A blue light ${subject} website called Cedar House without gallery`);
    expect(spec.industry).toBe(industry);
    expect(spec.brand).toBe("Cedar House");
    expect(spec.paletteId).toBe("sky");
    expect(spec.mode).toBe("light");
    expect(spec.sections).not.toContain("gallery");
  });
});
