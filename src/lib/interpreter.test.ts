import { describe, expect, it } from "vitest";
import { interpretPrompt } from "./interpreter";

describe("interpretPrompt", () => {
  it("extracts type, tone, mode, audience and sections", () => {
    const spec = interpretPrompt(
      "Create a modern dark portfolio for a React developer with projects and contact sections",
    );
    expect(spec.type).toBe("portfolio");
    expect(spec.tone).toBe("modern");
    expect(spec.mode).toBe("dark");
    expect(spec.audience).toBe("React developer");
    expect(spec.sections).toEqual(["hero", "about", "projects", "contact"]);
  });

  it("detects restaurants and adds explicitly requested sections in canonical order", () => {
    const spec = interpretPrompt("An elegant cafe website with pricing and a blog");
    expect(spec.type).toBe("restaurant");
    expect(spec.tone).toBe("elegant");
    expect(spec.sections).toContain("pricing");
    expect(spec.sections).toContain("posts");
    expect(spec.sections.indexOf("posts")).toBeLessThan(
      spec.sections.indexOf("pricing"),
    );
  });

  it("removes sections the user excludes but always keeps the hero", () => {
    const spec = interpretPrompt("SaaS landing page for teams without pricing");
    expect(spec.type).toBe("product");
    expect(spec.sections).not.toContain("pricing");
    expect(spec.sections[0]).toBe("hero");
  });

  it("maps color words to palettes and reads a brand name", () => {
    const spec = interpretPrompt("A green blog called Field Notes");
    expect(spec.type).toBe("blog");
    expect(spec.paletteId).toBe("emerald");
    expect(spec.brand).toBe("Field Notes");
    expect(interpretPrompt("A cafe called Olive & Thyme with a menu").brand).toBe(
      "Olive & Thyme",
    );
  });

  it("falls back to sensible defaults for vague or empty prompts", () => {
    const spec = interpretPrompt("   ");
    expect(spec.type).toBe("business");
    expect(spec.mode).toBe("light");
    expect(spec.sections[0]).toBe("hero");
    expect(spec.signals.length).toBeGreaterThan(0);
  });

  it("is deterministic and bounds prompt length", () => {
    const long = "portfolio ".repeat(200);
    const a = interpretPrompt(long);
    expect(a.prompt.length).toBeLessThanOrEqual(500);
    expect(interpretPrompt(long)).toEqual(a);
  });
});
