import { describe, expect, it } from "vitest";
import { buildContent } from "./content";
import { generateVariants } from "./generator";
import { INDUSTRY_PACKS, defaultBrand, packFor, retargetIndustry } from "./industry-content";
import { interpretPrompt } from "./interpreter";
import { generateSite } from "./site/render";
import { ValidationError, parseSitePayload } from "./site/validate";
import { INDUSTRIES, SITE_TYPES, type SiteContent, type SiteType } from "./types";

const GENERIC_PHRASES = ["Northwind", "Reliable services", "plan, launch and grow", "growing teams", "Thoughtful work from"];

function textOf(content: SiteContent): string {
  const items = [content.features, content.projects, content.testimonials].flat();
  return [content.brand, content.headline, content.tagline, content.about, content.ctaLabel, ...items.flatMap((i) => [i.title, i.body])].join(" | ");
}

describe("a prompt for an F1 car driver", () => {
  const prompt = "create a website for f1 car driver";
  const spec = interpretPrompt(prompt);
  const content = buildContent(spec);

  it("is understood as a racing driver, not a generic business", () => {
    expect(spec.type).toBe("portfolio");
    expect(spec.industry).toBe("motorsport");
    expect(spec.mode).toBe("dark");
    expect(spec.paletteId).toBe("rose");
    expect(spec.brand).toBe("Leo Marchetti");
    expect(spec.sections).toEqual(["hero", "about", "features", "projects", "gallery", "testimonials", "contact"]);
  });

  it("is written about racing, with none of the generic business wording", () => {
    expect(content.headline).toBe("Racing at the limit, every lap");
    expect(content.about).toMatch(/driver|racing/i);
    expect(content.projects.map((p) => p.meta)).toEqual(["P3", "P1", "P2"]);
    const all = textOf(content);
    for (const phrase of GENERIC_PHRASES) expect(all).not.toContain(phrase);
  });

  it("names the sections for racing on the finished page", () => {
    const [variant] = generateVariants(spec);
    const html = generateSite(variant, content)["index.html"];
    for (const text of ["Meet the driver", "Career highlights", "Race results", "Sponsors and media"]) {
      expect(html, text).toContain(text);
    }
    expect(html).toContain('href="#projects">Results</a>');
    expect(html).not.toContain("Selected work");
    expect(html).not.toContain("What we offer");
  });

  it("uses the racing illustration", () => {
    const [variant] = generateVariants(spec);
    expect(variant.industry).toBe("motorsport");
  });
});

describe("understanding what the website is about", () => {
  const cases: Array<[string, string]> = [
    ["create a website for f1 car driver", "motorsport"],
    ["a formula 1 fan page", "motorsport"],
    ["a racing team website", "motorsport"],
    ["a karting club", "motorsport"],
    ["a car dealership website", "automotive"],
    ["a garage that repairs cars", "automotive"],
    ["a website for a footballer", "sports"],
    ["a cricket player portfolio", "sports"],
    ["a dog grooming business", "pets"],
    ["a vet clinic for cats and dogs", "pets"],
    ["a twitch streamer page", "gaming"],
    ["an esports team", "gaming"],
    ["a gym website with class schedules", "fitness"],
    ["a dental clinic website", "dental"],
    ["a wedding photographer portfolio", "photography"],
  ];

  it.each(cases)("%s -> %s", (prompt, industry) => {
    expect(interpretPrompt(prompt).industry).toBe(industry);
  });

  it("treats people with a personal brand as portfolios", () => {
    for (const prompt of ["a website for a race car driver", "a boxer", "a website for an actor", "a singer"]) {
      expect(interpretPrompt(prompt).type, prompt).toBe("portfolio");
    }
  });

  it("keeps digits so words like f1 are recognised", () => {
    expect(interpretPrompt("f1").industry).toBe("motorsport");
    expect(interpretPrompt("A 3d artist").industry).toBe("creative");
  });

  it("racing words outweigh a single car word, but a real garage stays a garage", () => {
    expect(interpretPrompt("car driver f1").industry).toBe("motorsport");
    expect(interpretPrompt("an f1 car driver").industry).toBe("motorsport");
    expect(interpretPrompt("a car garage that repairs cars and tyres").industry).toBe("automotive");
  });

  it("still lets the user's own colour and theme words win", () => {
    expect(interpretPrompt("a light website for an f1 driver").mode).toBe("light");
    expect(interpretPrompt("a blue website for an f1 driver").paletteId).toBe("sky");
    expect(interpretPrompt("a dark gym website").mode).toBe("dark");
  });

  it("tells the user when it could not tell the industry", () => {
    const vague = interpretPrompt("a simple website");
    expect(vague.industry).toBe("business");
    expect(vague.signals.join(" ")).toContain("Could not tell the industry");
    expect(interpretPrompt("create a website for f1 car driver").signals.join(" ")).not.toContain("Could not tell");
  });
});

describe("industry content", () => {
  it("has a complete, valid pack for every industry", () => {
    for (const id of INDUSTRIES) {
      if (id === "business") {
        expect(packFor(id)).toBeNull();
        continue;
      }
      const pack = packFor(id)!;
      expect(pack, id).toBe(INDUSTRY_PACKS[id]);
      for (const list of [pack.features, pack.projects, pack.testimonials, pack.posts]) {
        expect(list.length, id).toBe(3);
        for (const item of list) {
          expect(item.title.length, id).toBeGreaterThan(0);
          expect(item.body.length, id).toBeGreaterThan(0);
        }
      }
      for (const key of ["brand", "topic", "cta", "headline", "tagline", "about"] as const) {
        expect(pack[key].trim().length, `${id}.${key}`).toBeGreaterThan(0);
      }
      // Every pack renames at least the sections it fills with its own sample items.
      for (const key of ["features", "projects", "contact"] as const) expect(pack.labels[key], `${id}.${key}`).toBeTruthy();
    }
  });

  it("passes the server's validation for every industry and site type", () => {
    for (const industry of INDUSTRIES) {
      for (const type of SITE_TYPES) {
        const spec = { ...interpretPrompt("site"), type, industry, brand: defaultBrand(type, industry) };
        const content = buildContent(spec);
        const [variant] = generateVariants(spec);
        expect(() => parseSitePayload({ variant, content }), `${industry}/${type}`).not.toThrow();
        // Every section the user can turn on still has content.
        for (const key of ["features", "projects", "menu", "posts", "plans", "testimonials"] as const) {
          expect(content[key].length, `${industry}/${type}/${key}`).toBeGreaterThan(0);
        }
      }
    }
  });

  it("makes each industry's text different from the others", () => {
    const headlines = new Set(Object.values(INDUSTRY_PACKS).map((p) => p.headline));
    expect(headlines.size).toBe(Object.keys(INDUSTRY_PACKS).length);
  });

  it("keeps generic wording out of industry sites", () => {
    for (const id of INDUSTRIES) {
      if (id === "business") continue;
      for (const type of ["portfolio", "business", "restaurant"] as SiteType[]) {
        const spec = { ...interpretPrompt("site"), type, industry: id, brand: defaultBrand(type, id) };
        const all = textOf(buildContent(spec));
        for (const phrase of GENERIC_PHRASES) expect(all, `${id}/${type}`).not.toContain(phrase);
      }
    }
  });

  it("keeps the generic copy for a business with no recognised industry", () => {
    const content = buildContent(interpretPrompt("a simple website"));
    expect(content.headline).toContain("Reliable services");
    expect(content.labels).toBeUndefined();
  });

  it("writes blogs about the topic and keeps product pages as product pages", () => {
    const blog = buildContent(interpretPrompt("a minimal green blog for writers about travel"));
    expect(blog.headline).toBe("Stories and ideas about travel");
    expect(blog.posts[0].title).toBe("Packing light for any trip");
    expect(blog.labels).toBeUndefined();

    const saas = buildContent(interpretPrompt("a bold SaaS landing page for remote teams with pricing"));
    expect(saas.headline).toContain("built for remote teams");
    expect(saas.plans.map((p) => p.title)).toEqual(["Starter", "Team", "Scale"]);
  });

  it("uses industry pricing where a pack has it", () => {
    const gym = buildContent({ ...interpretPrompt("gym site"), type: "business" });
    expect(gym.plans.map((p) => p.title)).toEqual(["Starter", "Core", "Elite"]);
    expect(gym.labels?.pricing?.title).toBe("Memberships");
  });
});

describe("switching a site to another industry", () => {
  it("replaces a placeholder brand but keeps a name from the prompt", () => {
    const generic = interpretPrompt("a simple website");
    expect(generic.brand).toBe("Northwind Co.");
    const moved = retargetIndustry(generic, "motorsport");
    expect(moved).toMatchObject({ industry: "motorsport", brand: "Leo Marchetti" });
    expect(buildContent(moved).headline).toBe("Racing at the limit, every lap");

    const named = interpretPrompt("a simple website called Zed Racing");
    expect(named.brand).toBe("Zed Racing");
    expect(retargetIndustry(named, "pets").brand).toBe("Zed Racing");
  });
});

describe("section titles on the finished page", () => {
  const spec = interpretPrompt("create a website for f1 car driver");
  const [variant] = generateVariants(spec);
  const content = buildContent(spec);

  it("are escaped like all other text", () => {
    const html = generateSite(variant, {
      ...content,
      labels: { projects: { title: "<img src=x onerror=alert(1)>", nav: "<b>Hi</b>" } },
    })["index.html"];
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(html).toContain("&lt;b&gt;Hi&lt;/b&gt;");
  });

  it("are validated by the server", () => {
    const ok = parseSitePayload({ variant, content });
    expect(ok.content.labels?.projects).toEqual({ title: "Race results", nav: "Results" });

    const parse = (labels: unknown) => parseSitePayload({ variant, content: { ...content, labels } });
    expect(() => parse({ projects: { title: "x".repeat(41), nav: "ok" } })).toThrow(ValidationError);
    expect(() => parse({ projects: { title: "ok", nav: "x".repeat(21) } })).toThrow(ValidationError);
    expect(() => parse({ projects: { title: "", nav: "ok" } })).toThrow(ValidationError);
    expect(() => parse({ projects: "Race results" })).toThrow(ValidationError);
    expect(() => parse("nope")).toThrow(ValidationError);
    // Unknown names, including hero, are dropped. An empty set becomes none.
    expect(parse({ hero: { title: "a", nav: "b" }, evil: { title: "a", nav: "b" } }).content.labels).toBeUndefined();
    expect(parse(undefined).content.labels).toBeUndefined();
  });
});
