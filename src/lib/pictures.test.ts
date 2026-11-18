import { describe, expect, it } from "vitest";
import { buildContent } from "./content";
import { generateVariants } from "./generator";
import { interpretPrompt } from "./interpreter";
import { generateEditorFile, generateSingleFile, generateSite } from "./site/render";
import {
  HERO_IMAGE,
  MAX_GALLERY_IMAGES,
  MAX_SLOT_IMAGE_CHARS,
  MAX_TOTAL_IMAGE_CHARS,
  SLOT_GUIDE,
  SLOT_IMAGE,
  dataUrlBytes,
  formatBytes,
  parseSlot,
  pictureBudget,
  sizeLabel,
} from "./site/limits";
import { imageChars, removeSlotImage, setSlotImages, withoutPictures } from "./site/slots";
import { ValidationError, parseSitePayload } from "./site/validate";
import type { SiteContent, Variant } from "./types";

function dataUrl(mime: string, bytes: number[], extra = 40): string {
  return `data:${mime};base64,${Buffer.from([...bytes, ...new Array(extra).fill(7)]).toString("base64")}`;
}
const JPEG = dataUrl("image/jpeg", [0xff, 0xd8, 0xff, 0xe0]);
const JPEG_B = dataUrl("image/jpeg", [0xff, 0xd8, 0xff, 0xe1], 80);
const PNG = dataUrl("image/png", [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function sample(prompt = "wedding photographer portfolio with a gallery") {
  const spec = interpretPrompt(prompt);
  const variant: Variant = { ...generateVariants(spec)[0], sections: ["hero", "about", "projects", "gallery", "contact"] };
  const content = buildContent(spec);
  return { spec, variant, content };
}

function html(variant: Variant, content: SiteContent) {
  return generateSite(variant, content)["index.html"];
}

describe("interpreting pictures and galleries", () => {
  it("gives photographers a gallery, and honours explicit requests and exclusions", () => {
    expect(interpretPrompt("a wedding photographer portfolio").sections).toContain("gallery");
    expect(interpretPrompt("a photographer portfolio without a gallery").sections).not.toContain("gallery");
    expect(interpretPrompt("a bakery website with a photos section").sections).toContain("gallery");
    expect(interpretPrompt("a React developer portfolio").sections).not.toContain("gallery");
  });

  it("no longer treats the word gallery as a projects section", () => {
    const sections = interpretPrompt("a plumber website with a gallery").sections;
    expect(sections).toContain("gallery");
    expect(sections).not.toContain("projects");
  });

  it("keeps sections in canonical order", () => {
    const { sections } = interpretPrompt("a photographer portfolio with projects and contact");
    expect(sections.indexOf("projects")).toBeLessThan(sections.indexOf("gallery"));
    expect(sections.indexOf("gallery")).toBeLessThan(sections.indexOf("contact"));
  });
});

describe("slot parsing", () => {
  it("accepts only known slots", () => {
    expect(parseSlot("hero")).toEqual({ kind: "hero", index: null });
    expect(parseSlot("about")).toEqual({ kind: "about", index: null });
    expect(parseSlot("gallery")).toEqual({ kind: "gallery", index: null });
    expect(parseSlot("gallery:3")).toEqual({ kind: "gallery", index: 3 });
    expect(parseSlot("projects:0")).toEqual({ kind: "projects", index: 0 });
    for (const bad of ["", "hero:1", "plans:0", "projects", "projects:x", "projects:123", "__proto__", "gallery:-1", 5, null, undefined]) {
      expect(parseSlot(bad), String(bad)).toBeNull();
    }
  });
});

describe("picture size guidance", () => {
  it("formats sizes for people", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(900)).toBe("900 B");
    expect(formatBytes(1536)).toBe("2 KB");
    expect(formatBytes(150 * 1024)).toBe("150 KB");
    expect(formatBytes(2.5 * 1024 * 1024)).toBe("2.5 MB");
    expect(formatBytes(20 * 1024 * 1024)).toBe("20 MB");
  });

  it("estimates stored bytes from a data URL length", () => {
    expect(dataUrlBytes(0)).toBe(0);
    expect(dataUrlBytes(400_000)).toBe(300_000);
  });

  it("reports how much of the website's picture space is used", () => {
    expect(pictureBudget(0)).toMatchObject({ used: "0 B", fraction: 0 });
    const half = pictureBudget(MAX_TOTAL_IMAGE_CHARS / 2);
    expect(half.fraction).toBeCloseTo(0.5);
    expect(half.total).toBe(pictureBudget(MAX_TOTAL_IMAGE_CHARS).total);
    expect(pictureBudget(MAX_TOTAL_IMAGE_CHARS * 3).fraction).toBe(1);
  });

  it("keeps the advertised sizes in step with what is actually stored and how areas are drawn", () => {
    // Width is the stored width; the shape is 16:9 for the hero and cards and 4:3 for About and the gallery.
    expect(SLOT_GUIDE.hero.width).toBe(HERO_IMAGE.maxWidth);
    for (const kind of ["about", "gallery", "features", "projects", "menu", "posts"] as const) {
      expect(SLOT_GUIDE[kind].width, kind).toBe(SLOT_IMAGE.maxWidth);
    }
    const ratio = (k: keyof typeof SLOT_GUIDE) => SLOT_GUIDE[k].width / SLOT_GUIDE[k].height;
    expect(ratio("hero")).toBeCloseTo(16 / 9, 1);
    for (const k of ["features", "projects", "menu", "posts"] as const) expect(ratio(k), k).toBeCloseTo(16 / 9, 1);
    expect(ratio("about")).toBeCloseTo(4 / 3, 1);
    expect(ratio("gallery")).toBeCloseTo(4 / 3, 1);
    expect(sizeLabel("projects")).toBe("1000 × 563 px");
  });

  it("shows the recommended size on every drop area in the editing preview only", () => {
    const { variant, content } = sample();
    const editing = generateEditorFile(variant, { ...content, aboutImage: JPEG });
    expect(editing).toContain("Best size 1600 × 900 px"); // hero bar
    expect(editing).toContain("Best size 1000 × 563 px"); // empty card
    expect(editing).toContain("Best size 1000 × 750 px each"); // gallery add tile
    expect(editing).toContain("Best size 1000 × 750 px</span>"); // filled About picture
    expect(editing).toContain("JPEG, PNG or WebP, up to 20 MB");

    const published = generateSite(variant, { ...content, aboutImage: JPEG, gallery: [JPEG] });
    expect(published["index.html"]).not.toContain("Best size");
    expect(published["styles.css"]).not.toContain("slot-hint");
  });
});

describe("pictures on a published site", () => {
  it("shows card pictures, and keeps the colored tile for projects without one", () => {
    const { variant, content } = sample();
    const out = html(variant, {
      ...content,
      projects: content.projects.map((p, i) => (i === 0 ? { ...p, image: JPEG } : p)),
    });
    expect(out).toContain(`<img src="${JPEG}" alt="">`);
    expect(out).toContain('class="thumb"');
    expect(out).not.toContain("data-slot");
  });

  it("only gives other cards a picture area when they have a picture", () => {
    const { variant, content } = sample("saas product");
    const withFeatures: Variant = { ...variant, sections: ["hero", "features"] };
    const plain = html(withFeatures, content);
    expect(plain).not.toContain("card-media");
    const picture = html(withFeatures, {
      ...content,
      features: content.features.map((f, i) => (i === 1 ? { ...f, image: PNG } : f)),
    });
    expect(picture.match(/class="media card-media"/g)).toHaveLength(1);
  });

  it("lays out About with a picture beside the text", () => {
    const { variant, content } = sample();
    expect(html(variant, content)).not.toContain("has-media");
    expect(html(variant, { ...content, aboutImage: JPEG })).toContain('class="about-grid has-media"');
  });

  it("hides an empty gallery completely and shows a gallery with a picture viewer", () => {
    const { variant, content } = sample();
    const empty = generateSite(variant, content);
    expect(empty["index.html"]).not.toContain('id="gallery"');
    expect(empty["index.html"]).not.toContain('href="#gallery"');
    expect(empty["script.js"]).not.toContain("lightbox");

    const full = generateSite(variant, { ...content, gallery: [JPEG, PNG, JPEG_B] });
    expect(full["index.html"]).toContain('id="gallery"');
    expect(full["index.html"]).toContain('href="#gallery"');
    expect(full["index.html"].match(/class="gallery-open"/g)).toHaveLength(3);
    expect(full["index.html"]).toContain('id="lightbox"');
    expect(full["script.js"]).toContain("lightbox");
  });

  it("keeps the picture viewer controls pinned to the top and handles Escape itself", () => {
    const { variant, content } = sample();
    const files = generateSite(variant, { ...content, gallery: [JPEG, PNG] });
    expect(files["styles.css"]).toMatch(/\.lightbox-bar\{position:fixed;[^}]*top:\d+px/);
    expect(files["styles.css"]).not.toMatch(/\.lightbox-bar\{[^}]*bottom:/);
    expect(files["script.js"]).toContain('e.key === "Escape"');
    expect(files["script.js"]).toContain("data-lightbox-close");
  });

  it("never contains editing controls, in any output format", () => {
    const { variant, content } = sample();
    const filled = { ...content, aboutImage: JPEG, gallery: [JPEG] };
    for (const out of [generateSite(variant, filled)["index.html"], generateSingleFile(variant, filled)]) {
      expect(out).not.toContain("data-slot");
      expect(out).not.toContain("slot-bar");
      expect(out).not.toContain("drop-target");
    }
    expect(generateSite(variant, filled)["script.js"]).not.toContain("site-editor");
    expect(generateSite(variant, filled)["styles.css"]).not.toContain("drop-target");
  });

  it("keeps the strict policy intact: no inline styles, no external images", () => {
    const { variant, content } = sample();
    const out = html(variant, { ...content, aboutImage: JPEG, gallery: [JPEG, PNG] });
    expect(out).not.toMatch(/\sstyle=/);
    expect(out).not.toMatch(/src="https?:/);
  });
});

describe("the editing preview", () => {
  it("marks every picture position as a drop target with the right ids", () => {
    const { variant, content } = sample();
    const out = generateEditorFile(variant, content);
    for (const slot of ["hero", "about", "projects:0", "projects:1", "projects:2", "gallery"]) {
      expect(out, slot).toContain(`data-slot="${slot}"`);
    }
    expect(out).toContain("Drop pictures here");
    expect(out).toContain('data-slot-action="pick-many"');
    expect(out).toContain("site-editor");
  });

  it("shows Replace and Remove for filled slots and an add tile after the last gallery picture", () => {
    const { variant, content } = sample();
    const out = generateEditorFile(variant, { ...content, aboutImage: JPEG, gallery: [JPEG, PNG] });
    expect(out).toContain('data-slot="gallery:0"');
    expect(out).toContain('data-slot="gallery:1"');
    expect(out).not.toContain('data-slot="gallery:2"');
    expect(out).toContain('data-slot-action="remove"');
    expect(out).toContain("Replace");
  });

  it("stops offering to add pictures once the gallery is full", () => {
    const { variant, content } = sample();
    const full = Array.from({ length: MAX_GALLERY_IMAGES }, () => JPEG);
    expect(generateEditorFile(variant, { ...content, gallery: full })).not.toContain('data-slot-action="pick-many"');
  });

  it("offers a photo slot for the hero in every layout", () => {
    const { variant, content } = sample();
    for (const heroLayout of ["centered", "split", "banner"] as const) {
      const out = generateEditorFile({ ...variant, heroLayout }, content);
      expect(out, heroLayout).toContain('class="slot-bar hero-bar"');
      expect(out, heroLayout).toContain("Add photo");
    }
    const withPhoto = generateEditorFile({ ...variant, heroLayout: "banner", imageMode: "photo", photo: JPEG }, content);
    expect(withPhoto).toContain("Replace photo");
    expect(withPhoto).toContain("Remove photo");
  });
});

describe("setSlotImages / removeSlotImage", () => {
  const { variant, content } = sample();
  const other: Variant = { ...variant, id: "creative" };
  const state = { variants: [variant, other], content };
  const id = variant.id;

  it("sets the hero photo on the selected design only", () => {
    const next = setSlotImages(state, id, { kind: "hero", index: null }, [JPEG]);
    expect(next.variants[0]).toMatchObject({ photo: JPEG, imageMode: "photo" });
    expect(next.variants[1].photo).toBeUndefined();
    const removed = removeSlotImage(next, id, { kind: "hero", index: null });
    expect(removed.variants[0].photo).toBeUndefined();
    expect(removed.variants[0].imageMode).toBe("scene");
  });

  it("sets and removes About and card pictures", () => {
    let next = setSlotImages(state, id, { kind: "about", index: null }, [JPEG]);
    expect(next.content.aboutImage).toBe(JPEG);
    next = setSlotImages(next, id, { kind: "projects", index: 1 }, [PNG]);
    expect(next.content.projects[1].image).toBe(PNG);
    expect(next.content.projects[0].image).toBeUndefined();
    next = removeSlotImage(next, id, { kind: "projects", index: 1 });
    expect(next.content.projects[1]).not.toHaveProperty("image");
    next = removeSlotImage(next, id, { kind: "about", index: null });
    expect(next.content.aboutImage).toBeUndefined();
  });

  it("ignores a card index that does not exist", () => {
    const next = setSlotImages(state, id, { kind: "projects", index: 9 }, [JPEG]);
    expect(next.content.projects).toEqual(content.projects);
  });

  it("appends gallery pictures, replaces one by index and removes one", () => {
    let next = setSlotImages(state, id, { kind: "gallery", index: null }, [JPEG, PNG]);
    expect(next.content.gallery).toEqual([JPEG, PNG]);
    next = setSlotImages(next, id, { kind: "gallery", index: 0 }, [JPEG_B]);
    expect(next.content.gallery).toEqual([JPEG_B, PNG]);
    next = removeSlotImage(next, id, { kind: "gallery", index: 0 });
    expect(next.content.gallery).toEqual([PNG]);
  });

  it("caps the gallery and says so", () => {
    const next = setSlotImages(state, id, { kind: "gallery", index: null }, Array.from({ length: MAX_GALLERY_IMAGES + 3 }, () => JPEG));
    expect(next.content.gallery).toHaveLength(MAX_GALLERY_IMAGES);
    expect(next.notice).toMatch(/up to 8 pictures/);
  });

  it("refuses to grow past the website size limit and leaves the state untouched", () => {
    const big = `data:image/jpeg;base64,/9j/${"A".repeat(MAX_SLOT_IMAGE_CHARS - 100)}`;
    let next: ReturnType<typeof setSlotImages> = state;
    for (let i = 0; i < MAX_GALLERY_IMAGES; i++) next = setSlotImages(next, id, { kind: "gallery", index: null }, [big]);
    for (const slot of ["projects:0", "projects:1", "projects:2"]) {
      const [kind, index] = slot.split(":");
      next = setSlotImages(next, id, { kind: kind as "projects", index: Number(index) }, [big]);
    }
    next = setSlotImages(next, id, { kind: "about", index: null }, [big]);
    next = setSlotImages(next, id, { kind: "hero", index: null }, [big]);
    const total = imageChars(next.variants[0], next.content);
    expect(total).toBeLessThanOrEqual(MAX_TOTAL_IMAGE_CHARS);
    const rejected = setSlotImages(next, id, { kind: "hero", index: null }, [big.repeat(2).slice(0, MAX_SLOT_IMAGE_CHARS)]);
    expect(imageChars(rejected.variants[0], rejected.content)).toBeLessThanOrEqual(MAX_TOTAL_IMAGE_CHARS);
  });

  it("withoutPictures strips every picture but keeps the text", () => {
    const filled = setSlotImages(setSlotImages(state, id, { kind: "about", index: null }, [JPEG]), id, { kind: "gallery", index: null }, [JPEG]);
    const stripped = withoutPictures({ ...filled.content, projects: [{ ...content.projects[0], image: PNG }] });
    expect(stripped.aboutImage).toBeUndefined();
    expect(stripped.gallery).toEqual([]);
    expect(stripped.projects[0]).not.toHaveProperty("image");
    expect(stripped.projects[0].title).toBe(content.projects[0].title);
  });
});

describe("validating pictures from the client", () => {
  const { variant, content } = sample();
  const parse = (c: Partial<SiteContent>) => parseSitePayload({ variant, content: { ...content, ...c } });

  it("keeps valid card, About and gallery pictures", () => {
    const parsed = parse({
      aboutImage: JPEG,
      gallery: [JPEG, PNG],
      projects: content.projects.map((p) => ({ ...p, image: PNG })),
    });
    expect(parsed.content.aboutImage).toBe(JPEG);
    expect(parsed.content.gallery).toEqual([JPEG, PNG]);
    expect(parsed.content.projects[0].image).toBe(PNG);
  });

  it("treats a missing gallery as empty, so older requests still work", () => {
    const { gallery: _gallery, ...rest } = content;
    void _gallery;
    expect(parseSitePayload({ variant, content: rest }).content.gallery).toEqual([]);
  });

  it("ignores pictures on lists that do not show them", () => {
    const parsed = parse({ plans: [{ title: "A", body: "b", image: JPEG } as never], testimonials: [] });
    expect(parsed.content.plans[0]).not.toHaveProperty("image");
  });

  it("rejects dangerous or malformed pictures in every position", () => {
    const svg = `data:image/svg+xml;base64,${Buffer.from("<svg onload=alert(1)/>").toString("base64")}`;
    const fakeJpeg = dataUrl("image/jpeg", [1, 2, 3, 4]);
    const quote = `${JPEG}" onerror="alert(1)`;
    for (const bad of [svg, fakeJpeg, quote, "https://evil.example/x.jpg", "javascript:alert(1)", 42]) {
      expect(() => parse({ aboutImage: bad as string }), "about").toThrow(ValidationError);
      expect(() => parse({ gallery: [bad as string] }), "gallery").toThrow(ValidationError);
      expect(() => parse({ projects: [{ title: "a", body: "b", image: bad as string }] }), "card").toThrow(ValidationError);
    }
    expect(() => parse({ gallery: [""] })).toThrow(ValidationError);
  });

  it("enforces the per-picture, gallery and total limits", () => {
    const tooBig = `data:image/jpeg;base64,/9j/${"A".repeat(MAX_SLOT_IMAGE_CHARS)}`;
    expect(() => parse({ aboutImage: tooBig })).toThrow(/too large/);
    expect(() => parse({ gallery: Array.from({ length: MAX_GALLERY_IMAGES + 1 }, () => JPEG) })).toThrow(ValidationError);

    const nearLimit = `data:image/jpeg;base64,/9j/${"A".repeat(MAX_SLOT_IMAGE_CHARS - 100)}`;
    const heroPhoto = `data:image/jpeg;base64,/9j/${"A".repeat(440_000)}`;
    // 440K + 200K + 5 x 200K + 3 x 200K is about 2.24M, under the 2.4M website limit.
    const fits = parseSitePayload({
      variant: { ...variant, imageMode: "photo", photo: heroPhoto },
      content: {
        ...content,
        aboutImage: nearLimit,
        gallery: Array.from({ length: 5 }, () => nearLimit),
        projects: content.projects.map((p) => ({ ...p, image: nearLimit })),
      },
    });
    expect(fits.content.gallery).toHaveLength(5);

    expect(() =>
      parseSitePayload({
        variant: { ...variant, imageMode: "photo", photo: heroPhoto },
        content: {
          ...content,
          aboutImage: nearLimit,
          gallery: Array.from({ length: 5 }, () => nearLimit),
          projects: content.projects.map((p) => ({ ...p, image: nearLimit })),
          features: content.features.map((f) => ({ ...f, image: nearLimit })),
        },
      }),
    ).toThrow(/too many pictures/);
  });
});
