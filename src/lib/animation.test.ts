import { describe, expect, it } from "vitest";
import { buildContent } from "./content";
import { generateVariants } from "./generator";
import { interpretPrompt } from "./interpreter";
import { ANIMATION_SCRIPT, animationCss, animationStyle, progressBarHtml } from "./site/animation";
import { generateEditorFile, generateSingleFile, generateSite } from "./site/render";
import { ValidationError, parseSitePayload } from "./site/validate";
import type { AnimationStyle, Variant } from "./types";

function sample(animation?: AnimationStyle) {
  const spec = interpretPrompt("a modern portfolio for a wedding photographer");
  const variant: Variant = { ...generateVariants(spec)[0], animation };
  return { variant, content: buildContent(spec) };
}

describe("animation styles", () => {
  it("defaults to subtle, and the three designs start with a sensible mix", () => {
    expect(animationStyle({ ...sample().variant, animation: undefined })).toBe("subtle");
    const spec = interpretPrompt("a bakery");
    expect(generateVariants(spec).map((v) => [v.id, v.animation])).toEqual([
      ["safe", "subtle"],
      ["recommended", "subtle"],
      ["creative", "lively"],
    ]);
  });

  it("adds entrance, scroll and hover animation to a subtle site", () => {
    const { variant, content } = sample("subtle");
    const files = generateSite(variant, content);
    expect(files["index.html"]).toContain('data-anim="subtle"');
    for (const rule of ["@keyframes rise", "[data-anim] .hero h1", ".js [data-reveal]", "[data-anim] .card:hover", "--rise:20px"]) {
      expect(files["styles.css"], rule).toContain(rule);
    }
    expect(files["script.js"]).toContain("IntersectionObserver");
    expect(files["index.html"]).not.toContain('class="progress"');
    expect(files["styles.css"]).not.toContain("@keyframes pulse");
  });

  it("makes a lively site bigger and adds a progress bar and a pulsing button", () => {
    const { variant, content } = sample("lively");
    const files = generateSite(variant, content);
    expect(files["index.html"]).toContain('data-anim="lively"');
    expect(files["index.html"]).toContain('<div class="progress" aria-hidden="true"></div>');
    for (const rule of ["--rise:46px", "@keyframes pulse", "rotate(-.4deg)"]) expect(files["styles.css"], rule).toContain(rule);
    expect(files["script.js"]).toContain('.progress');
  });

  it("leaves a site with animation off completely still", () => {
    const { variant, content } = sample("none");
    const files = generateSite(variant, content);
    expect(files["index.html"]).not.toContain("data-anim");
    expect(files["index.html"]).not.toContain("progress");
    expect(files["styles.css"]).not.toContain("@keyframes rise");
    expect(files["styles.css"]).not.toContain("data-reveal");
    expect(files["script.js"]).not.toContain("replay-animations");
    expect(animationCss(variant)).toBe("");
    expect(progressBarHtml(variant)).toBe("");
  });
});

describe("animation never gets in the way", () => {
  const { variant, content } = sample("lively");
  const files = generateSite(variant, content);

  it("respects 'reduce motion', in the stylesheet and in the script", () => {
    expect(files["styles.css"]).toMatch(/prefers-reduced-motion:reduce\)\{\[data-anim\] \*,\[data-anim\] \*::after\{animation:none!important\}/);
    expect(files["styles.css"]).toContain(".js [data-reveal]{opacity:1!important;transform:none!important");
    expect(ANIMATION_SCRIPT).toContain("prefers-reduced-motion: reduce");
  });

  it("keeps everything visible when JavaScript is off, when printing, and for browsers without IntersectionObserver", () => {
    // Content is only ever hidden by a rule that needs the "js" class and a data-reveal attribute the script adds.
    expect(files["styles.css"]).toContain(".js [data-reveal]{opacity:0");
    expect(files["index.html"]).not.toContain("data-reveal");
    expect(files["styles.css"]).toContain("@media print{.js [data-reveal]{opacity:1!important");
    expect(ANIMATION_SCRIPT.indexOf('"IntersectionObserver" in window')).toBeLessThan(ANIMATION_SCRIPT.indexOf('setAttribute("data-reveal"'));
  });

  it("only hides what starts below the fold, so nothing flashes at load", () => {
    expect(ANIMATION_SCRIPT).toContain("getBoundingClientRect().top < window.innerHeight * 0.92");
  });

  it("restores normal behaviour after an element has arrived, so hover effects work", () => {
    expect(ANIMATION_SCRIPT).toContain('el.removeAttribute("data-reveal")');
  });

  it("stays within the site's strict policy: no inline styles, no eval, no external requests", () => {
    for (const text of [files["index.html"], generateSingleFile(variant, content)]) expect(text).not.toMatch(/\sstyle=/);
    expect(ANIMATION_SCRIPT).not.toMatch(/eval\(|new Function|fetch\(|XMLHttpRequest|innerHTML|document\.write/);
    expect(files["styles.css"]).not.toMatch(/url\(|@import/);
  });

  it("does not hide anything in the small design thumbnails, which have no script", () => {
    const thumbnail = generateSingleFile(variant, content).replace(/<script>[\s\S]*?<\/script>/, "");
    // The hiding rules need the "js" class and a data-reveal attribute, and only the script adds them.
    expect(thumbnail).not.toMatch(/<[^>]+data-reveal/);
    expect(thumbnail).not.toContain("classList.add");
    expect(thumbnail).not.toMatch(/<html[^>]*class=/);
  });

  it("lets the dashboard replay the animations in the editing preview only", () => {
    expect(generateEditorFile(variant, content)).toContain('d.type === "replay"');
    expect(files["script.js"]).not.toContain('d.type === "replay"');
    expect(files["script.js"]).toContain('"replay-animations"');
  });
});

describe("validating the animation choice", () => {
  const { variant, content } = sample();

  it("accepts the three styles and an absent choice", () => {
    for (const animation of ["none", "subtle", "lively"] as const) {
      expect(parseSitePayload({ variant: { ...variant, animation }, content }).variant.animation).toBe(animation);
    }
    expect(parseSitePayload({ variant: { ...variant, animation: undefined }, content }).variant.animation).toBeUndefined();
  });

  it("rejects anything else, so nothing can be written into the stylesheet", () => {
    for (const bad of ["fast", "lively; } body{display:none", "", 3, null, {}]) {
      expect(() => parseSitePayload({ variant: { ...variant, animation: bad }, content }), String(bad)).toThrow(ValidationError);
    }
  });
});
