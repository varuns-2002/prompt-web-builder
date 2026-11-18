import { describe, expect, it } from "vitest";
import { buildContent } from "../content";
import { generateVariants } from "../generator";
import { interpretPrompt } from "../interpreter";
import type { SectionKind, SiteContent, Variant } from "../types";
import {
  TEXT_LIMITS,
  addItem,
  applyTextEdit,
  hideSection,
  moveItem,
  moveSection,
  parseAction,
  parseEditPath,
  placeSection,
  removeItem,
  showSection,
  type EditTarget,
} from "./edits";
import { MAX_ITEMS } from "./limits";
import { generateEditorFile, generateSingleFile, generateSite } from "./render";
import { ValidationError, parseSitePayload } from "./validate";

function sample(prompt = "create a website for f1 car driver") {
  const spec = interpretPrompt(prompt);
  const variant = generateVariants(spec)[0];
  return { spec, variant, content: buildContent(spec) };
}

const target = (path: string): EditTarget => parseEditPath(path)!;
const ok = (content: SiteContent, path: string, value: string) => {
  const result = applyTextEdit(content, target(path), value);
  if (!result.ok) throw new Error(result.error);
  return result;
};

describe("parseEditPath", () => {
  it("accepts every editable place", () => {
    expect(parseEditPath("headline")).toEqual({ kind: "field", field: "headline" });
    expect(parseEditPath("cta")).toEqual({ kind: "field", field: "cta" });
    expect(parseEditPath("label:projects:title")).toEqual({ kind: "label", section: "projects", part: "title" });
    expect(parseEditPath("item:plans:2:meta")).toEqual({ kind: "item", list: "plans", index: 2, part: "meta" });
  });

  it("rejects anything else", () => {
    for (const bad of ["", "ctaLabel", "hero", "label:hero:title", "label:projects:colour", "item:gallery:0:title",
      "item:projects:x:title", "item:projects:123:title", "item:projects:1", "item:projects:1:image", "__proto__",
      "constructor", "item:projects:1:title:extra", "x".repeat(41), 5, null, undefined]) {
      expect(parseEditPath(bad), String(bad)).toBeNull();
    }
  });
});

describe("applyTextEdit", () => {
  const { content } = sample();

  it("changes the headline, tagline, button, name and About text", () => {
    expect(ok(content, "headline", "Fast and fearless").content.headline).toBe("Fast and fearless");
    expect(ok(content, "tagline", "Season 2026").content.tagline).toBe("Season 2026");
    expect(ok(content, "cta", "Sponsor me").content.ctaLabel).toBe("Sponsor me");
    expect(ok(content, "brand", "Leo M.").content.brand).toBe("Leo M.");
    expect(ok(content, "about", "New bio.").content.about).toBe("New bio.");
  });

  it("changes card text, and the original is left untouched", () => {
    const edited = ok(content, "item:projects:1:title", "Monaco").content;
    expect(edited.projects[1].title).toBe("Monaco");
    expect(edited.projects[0]).toBe(content.projects[0]);
    expect(content.projects[1].title).not.toBe("Monaco");
    expect(ok(content, "item:projects:0:body", "Pole to flag.").content.projects[0].body).toBe("Pole to flag.");
    expect(ok(content, "item:projects:0:meta", "P1").content.projects[0].meta).toBe("P1");
    expect(ok(content, "item:testimonials:2:title", "Fan").content.testimonials[2].title).toBe("Fan");
  });

  it("tidies whitespace and line breaks", () => {
    expect(ok(content, "headline", "  Fast \n\n  and   fearless  ").content.headline).toBe("Fast and fearless");
  });

  it("reports unchanged text so nothing is saved", () => {
    const result = ok(content, "headline", `  ${content.headline} `);
    expect(result.outcome).toBe("unchanged");
    expect(result.content).toBe(content);
  });

  it("tells the preview when it needs to reload, because other parts of the page change too", () => {
    expect(ok(content, "headline", "x").outcome).toBe("applied");
    expect(ok(content, "item:projects:0:title", "x").outcome).toBe("applied");
    expect(ok(content, "brand", "x").outcome).toBe("reload");
    expect(ok(content, "label:projects:title", "x").outcome).toBe("reload");
  });

  it("refuses to empty things a website cannot do without", () => {
    for (const path of ["brand", "headline", "cta", "label:about:title", "item:features:0:title"]) {
      const result = applyTextEdit(content, target(path), "   ");
      expect(result.ok, path).toBe(false);
    }
  });

  it("lets optional text be cleared, and removes an emptied detail", () => {
    expect(ok(content, "tagline", "").content.tagline).toBe("");
    expect(ok(content, "about", "").content.about).toBe("");
    expect(ok(content, "item:projects:0:body", "").content.projects[0].body).toBe("");
    const cleared = ok(content, "item:projects:0:meta", "").content.projects[0];
    expect(cleared).not.toHaveProperty("meta");
  });

  it("enforces the same length limits as the server", () => {
    const limits: Array<[string, number]> = [
      ["brand", TEXT_LIMITS.brand],
      ["headline", TEXT_LIMITS.headline],
      ["tagline", TEXT_LIMITS.tagline],
      ["cta", TEXT_LIMITS.cta],
      ["about", TEXT_LIMITS.about],
      ["label:projects:title", TEXT_LIMITS.labelTitle],
      ["label:projects:nav", TEXT_LIMITS.labelNav],
      ["item:projects:0:title", TEXT_LIMITS.itemTitle],
      ["item:projects:0:body", TEXT_LIMITS.itemBody],
      ["item:projects:0:meta", TEXT_LIMITS.itemMeta],
    ];
    for (const [path, max] of limits) {
      expect(applyTextEdit(content, target(path), "x".repeat(max)).ok, `${path} at limit`).toBe(true);
      const over = applyTextEdit(content, target(path), "x".repeat(max + 1));
      expect(over.ok, `${path} over limit`).toBe(false);
      if (!over.ok) expect(over.error).toContain(String(max));
    }
  });

  it("everything it accepts is also accepted by the server", () => {
    const { variant } = sample();
    let edited = content;
    for (const [path, value] of [
      ["brand", "x".repeat(TEXT_LIMITS.brand)],
      ["headline", "x".repeat(TEXT_LIMITS.headline)],
      ["about", "x".repeat(TEXT_LIMITS.about)],
      ["item:projects:0:body", "x".repeat(TEXT_LIMITS.itemBody)],
      ["item:projects:0:meta", "x".repeat(TEXT_LIMITS.itemMeta)],
      ["label:projects:title", "x".repeat(TEXT_LIMITS.labelTitle)],
    ] as const) edited = ok(edited, path, value).content;
    expect(() => parseSitePayload({ variant, content: edited })).not.toThrow();
  });

  it("refuses a card that no longer exists", () => {
    const result = applyTextEdit(content, target("item:projects:9:title"), "x");
    expect(result.ok).toBe(false);
  });

  it("renaming a section updates its title, and the menu follows when short enough", () => {
    const short = ok(content, "label:projects:title", "Results").content.labels?.projects;
    expect(short).toEqual({ title: "Results", nav: "Results" });
    const long = ok(content, "label:projects:title", "Everything I have ever raced in").content.labels?.projects;
    expect(long?.title).toBe("Everything I have ever raced in");
    expect(long?.nav).toBe(content.labels?.projects?.nav);
    expect(ok(content, "label:projects:nav", "Races").content.labels?.projects).toMatchObject({ nav: "Races", title: "Race results" });
  });

  it("can rename a section that has no custom wording yet", () => {
    const { content: generic } = sample("a simple website");
    expect(generic.labels).toBeUndefined();
    expect(ok(generic, "label:features:title", "Our services").content.labels?.features).toEqual({
      title: "Our services",
      nav: "Our services",
    });
  });
});

describe("cards", () => {
  const { content } = sample();

  it("adds a card with sensible placeholder text, only up to the limit", () => {
    const more = addItem(content, "projects")!;
    expect(more.projects).toHaveLength(content.projects.length + 1);
    expect(more.projects.at(-1)).toMatchObject({ title: "New project" });
    expect(addItem(content, "plans")!.plans.at(-1)).toMatchObject({ meta: "$0" });

    let full = content;
    while (full.projects.length < MAX_ITEMS) full = addItem(full, "projects")!;
    expect(addItem(full, "projects")).toBeNull();
  });

  it("adds cards that pass server validation", () => {
    const { variant } = sample();
    let next = content;
    for (const list of ["features", "projects", "menu", "posts", "plans", "testimonials"] as const) next = addItem(next, list)!;
    expect(() => parseSitePayload({ variant, content: next })).not.toThrow();
  });

  it("removes a card, down to none, and ignores a bad index", () => {
    expect(removeItem(content, "projects", 1)!.projects.map((p) => p.title)).toEqual([
      content.projects[0].title,
      content.projects[2].title,
    ]);
    let empty = content;
    while (empty.projects.length) empty = removeItem(empty, "projects", 0)!;
    expect(empty.projects).toEqual([]);
    expect(removeItem(content, "projects", 9)).toBeNull();
    expect(removeItem(content, "projects", -1)).toBeNull();
  });

  it("moves a card earlier or later and stops at the ends", () => {
    const titles = (c: SiteContent) => c.projects.map((p) => p.title);
    const [a, b, c] = titles(content);
    expect(titles(moveItem(content, "projects", 1, -1)!)).toEqual([b, a, c]);
    expect(titles(moveItem(content, "projects", 1, 1)!)).toEqual([a, c, b]);
    expect(moveItem(content, "projects", 0, -1)).toBeNull();
    expect(moveItem(content, "projects", 2, 1)).toBeNull();
  });
});

describe("sections", () => {
  const sections: SectionKind[] = ["hero", "about", "features", "projects", "contact"];

  it("moves a section up or down and never above the hero", () => {
    expect(moveSection(sections, "projects", -1)).toEqual(["hero", "about", "projects", "features", "contact"]);
    expect(moveSection(sections, "about", 1)).toEqual(["hero", "features", "about", "projects", "contact"]);
    expect(moveSection(sections, "about", -1)).toEqual(sections);
    expect(moveSection(sections, "contact", 1)).toEqual(sections);
  });

  it("places a section at an exact position", () => {
    expect(placeSection(sections, "contact", 0)).toEqual(["hero", "contact", "about", "features", "projects"]);
    expect(placeSection(sections, "about", 99)).toEqual(["hero", "features", "projects", "contact", "about"]);
    expect(placeSection(sections, "about", -5)).toEqual(sections);
  });

  it("hides a section and shows it again in its usual place", () => {
    const hidden = hideSection(sections, "features");
    expect(hidden).toEqual(["hero", "about", "projects", "contact"]);
    expect(showSection(hidden, "features")).toEqual(sections);
    expect(showSection(["hero", "contact"], "about")).toEqual(["hero", "about", "contact"]);
    expect(showSection(["hero", "about"], "contact")).toEqual(["hero", "about", "contact"]);
    expect(showSection(sections, "about")).toEqual(sections);
  });

  it("keeps a custom order when something else is added", () => {
    const custom: SectionKind[] = ["hero", "contact", "about"];
    expect(showSection(custom, "projects")).toEqual(["hero", "projects", "contact", "about"]);
  });
});

describe("parseAction", () => {
  it("reads valid actions and rejects the rest", () => {
    expect(parseAction("add:projects")).toEqual({ kind: "add", list: "projects" });
    expect(parseAction("remove:plans:2")).toEqual({ kind: "remove", list: "plans", index: 2 });
    expect(parseAction("earlier:menu:1")).toEqual({ kind: "earlier", list: "menu", index: 1 });
    expect(parseAction("section-hide:about")).toEqual({ kind: "section-hide", section: "about" });
    for (const bad of ["", "add", "add:gallery", "remove:projects", "remove:projects:x", "section-up:hero", "section-down:evil",
      "drop:projects", "add:projects:1", "x".repeat(41), 7, null]) {
      expect(parseAction(bad), String(bad)).toBeNull();
    }
  });
});

describe("the editing preview", () => {
  const { variant, content } = sample();
  const html = generateEditorFile(variant, content);

  it("makes every piece of text editable", () => {
    for (const path of [
      "brand", "headline", "tagline", "cta", "about",
      "label:about:title", "label:features:title", "label:projects:title", "label:testimonials:title",
      "item:features:0:title", "item:features:0:body", "item:features:0:meta",
      "item:projects:2:title", "item:projects:2:meta",
      "item:testimonials:0:body", "item:testimonials:0:title",
    ]) {
      expect(html, path).toContain(`data-edit="${path}"`);
    }
    expect(html).toContain('data-placeholder="Headline"');
  });

  it("offers an empty detail line on cards that have none", () => {
    const plain = generateEditorFile(variant, { ...content, projects: [{ title: "A", body: "b" }] });
    expect(plain).toContain('data-edit="item:projects:0:meta"');
    expect(plain).toContain('data-placeholder="Add a detail"');
  });

  it("puts move and delete buttons on cards, disabled at the ends, and an add tile after the last card", () => {
    expect(html).toContain('data-act="remove:projects:0"');
    expect(html).toContain('data-act="earlier:projects:0" aria-label="Move card earlier" disabled');
    expect(html).toContain('data-act="later:projects:2" aria-label="Move card later" disabled');
    expect(html).toContain('data-act="later:projects:0" aria-label="Move card later">');
    expect(html).toContain('data-act="add:projects"');
    expect(html).toContain('data-act="add:testimonials"');
  });

  it("puts up, down and hide buttons on every section, with the first and last disabled", () => {
    expect(html).toContain('data-act="section-up:about" aria-label="Move section up" disabled');
    expect(html).toContain('data-act="section-down:contact" aria-label="Move section down" disabled');
    expect(html).toContain('data-act="section-hide:projects"');
    expect(html).not.toContain("section-up:hero");
  });

  it("shows an empty section as a place to add the first card", () => {
    const empty = generateEditorFile(variant, { ...content, projects: [] });
    expect(empty).toContain('id="projects"');
    expect(empty).toContain('data-act="add:projects"');
    expect(empty).toContain("+ Add a project");
  });

  it("stops offering to add once a list is full", () => {
    let full = content;
    while (full.projects.length < MAX_ITEMS) full = addItem(full, "projects")!;
    expect(generateEditorFile(variant, full)).not.toContain('data-act="add:projects"');
  });

  it("makes the name and button plain text, so clicking them edits instead of following a link", () => {
    expect(html).toContain('<span class="brand" data-edit="brand"');
    expect(html).toContain('<span class="btn" data-edit="cta"');
    expect(html).not.toContain('<a class="brand"');
  });

  it("includes the typing, buttons and styles it needs", () => {
    expect(html).toContain('type: "edit"');
    expect(html).toContain('type: "action"');
    expect(html).toContain("plaintext-only");
    expect(html).toContain("[data-edit]:empty::before");
  });

  it("escapes edited text like everything else", () => {
    const nasty = '<img src=x onerror="alert(1)"> & more';
    const out = generateEditorFile(variant, {
      ...content,
      headline: nasty,
      projects: [{ title: nasty, body: nasty, meta: nasty }],
      labels: { projects: { title: nasty, nav: nasty } },
    });
    expect(out).not.toContain("<img src=x");
    expect(out).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; more");
  });

  it("follows the order of the sections", () => {
    const reordered: Variant = { ...variant, sections: ["hero", "contact", "projects", "about"] };
    const out = generateEditorFile(reordered, content);
    const at = (id: string) => out.indexOf(`<section id="${id}"`);
    expect(at("contact")).toBeLessThan(at("projects"));
    expect(at("projects")).toBeLessThan(at("about"));
  });
});

describe("a published website", () => {
  const { variant, content } = sample();

  it("contains none of the editing markup, scripts or styles", () => {
    const files = generateSite(variant, content);
    for (const text of [files["index.html"], files["script.js"], files["styles.css"], generateSingleFile(variant, content)]) {
      for (const leak of ["data-edit", "data-act", "data-placeholder", "card-bar", "section-bar", "add-card", "plaintext-only", "contenteditable"]) {
        expect(text, leak).not.toContain(leak);
      }
    }
  });

  it("keeps the name and button as links", () => {
    const html = generateSite(variant, content)["index.html"];
    expect(html).toContain('<a class="brand" href="#top">');
    expect(html).toMatch(/<a class="btn" href="#contact">/);
  });

  it("leaves out sections with nothing in them, and their menu entries", () => {
    const html = generateSite(variant, { ...content, projects: [], testimonials: [], about: "" })["index.html"];
    for (const id of ["projects", "testimonials", "about"]) {
      expect(html, id).not.toContain(`<section id="${id}"`);
      expect(html, id).not.toContain(`href="#${id}"`);
    }
    expect(html).toContain('<section id="features"');
    expect(html).toContain('<section id="contact"');
  });

  it("keeps About when it only has a picture", () => {
    const picture = "data:image/jpeg;base64,/9j/AAAA";
    const html = generateSite(variant, { ...content, about: "", aboutImage: picture })["index.html"];
    expect(html).toContain('<section id="about"');
  });

  it("points the button at the first section left when there is no contact form", () => {
    const noContact: Variant = { ...variant, sections: ["hero", "projects"] };
    expect(generateSite(noContact, content)["index.html"]).toContain('<a class="btn" href="#projects">');
    const none = generateSite({ ...variant, sections: ["hero"] }, content)["index.html"];
    expect(none).toContain('<a class="btn" href="#top">');
  });

  it("shows the sections in the chosen order, with the menu in the same order", () => {
    const reordered: Variant = { ...variant, sections: ["hero", "contact", "projects", "about"] };
    const html = generateSite(reordered, content)["index.html"];
    const at = (id: string) => html.indexOf(`<section id="${id}"`);
    expect(at("contact")).toBeLessThan(at("projects"));
    expect(at("projects")).toBeLessThan(at("about"));
    const menu = [...html.matchAll(/<a href="#(\w+)">/g)].map((m) => m[1]);
    expect(menu).toEqual(["contact", "projects", "about"]);
  });
});

describe("server validation of edited websites", () => {
  const { variant, content } = sample();

  it("keeps the order of the sections, drops duplicates and keeps the hero first", () => {
    const parse = (sections: unknown) => parseSitePayload({ variant: { ...variant, sections }, content }).variant.sections;
    expect(parse(["hero", "contact", "about", "projects"])).toEqual(["hero", "contact", "about", "projects"]);
    expect(parse(["about", "hero", "about", "contact"])).toEqual(["hero", "about", "contact"]);
    expect(parse(["contact", "about"])).toEqual(["hero", "contact", "about"]);
    expect(() => parse(["hero", "admin"])).toThrow(ValidationError);
  });

  it("accepts cards removed down to none", () => {
    const emptied = { ...content, features: [], projects: [], menu: [], posts: [], plans: [], testimonials: [] };
    expect(() => parseSitePayload({ variant, content: emptied })).not.toThrow();
  });
});
