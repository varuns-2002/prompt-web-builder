import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buildContent } from "../content";
import { generateVariants } from "../generator";
import { interpretPrompt } from "../interpreter";
import { createSiteZip, slugify } from "./download";
import { esc, generateSingleFile, generateSite } from "./render";
import { isSiteFile, isSiteId, readSiteFile, saveSite } from "./store";
import { ValidationError, parseSitePayload } from "./validate";
import { unzipSync, strFromU8 } from "fflate";
import { Script, runInNewContext } from "node:vm";
import { PALETTE_IDS, SITE_TYPES } from "../types";

function sample(prompt = "dark portfolio for a React developer with projects, pricing and contact") {
  const spec = interpretPrompt(prompt);
  const [variant] = generateVariants(spec);
  return { variant, content: buildContent(spec) };
}

describe("esc", () => {
  it("escapes HTML-significant characters", () => {
    expect(esc(`<img src=x onerror="a()">&'`)).toBe(
      "&lt;img src=x onerror=&quot;a()&quot;&gt;&amp;&#39;",
    );
  });
});

describe("generateSite", () => {
  it("renders every requested section with working anchors", () => {
    const { variant, content } = sample();
    const { "index.html": html } = generateSite(variant, content);
    for (const kind of variant.sections.filter((k) => k !== "hero")) {
      expect(html).toContain(`id="${kind}"`);
      expect(html).toContain(`href="#${kind}"`);
    }
    expect(html).toContain('id="contact-form"');
    expect(html).toContain('<a class="skip" href="#main">');
    expect(html).toContain('data-theme="dark"');
  });

  it("includes the configured contact recipient in the generated form", () => {
    const { variant, content } = sample();
    const html = generateSite(variant, { ...content, contactEmail: "owner@example.com" })["index.html"];
    expect(html).toContain('id="contact-form" class="form" data-recipient="owner@example.com"');
  });

  it("does not render an invalid contact recipient into the generated form", () => {
    const { variant, content } = sample();
    const html = generateSite(variant, { ...content, contactEmail: `owner"@example.com` })["index.html"];
    expect(html).toContain('id="contact-form" class="form" data-recipient=""');
    expect(html).not.toContain('data-recipient="owner');
  });

  it("handles in-page links itself so they also work inside an embedded preview", () => {
    const { variant, content } = sample();
    const { "script.js": js } = generateSite(variant, content);
    expect(js).toContain('closest(\'a[href^="#"]\')');
    expect(js).toContain("preventDefault");
    expect(js).toContain("scrollIntoView");
  });

  it("offers email draft choices after the contact form passes validation", () => {
    const { variant, content } = sample();
    const { "script.js": js } = generateSite(variant, content);
    expect(js).toContain('form.getAttribute("data-recipient")');
    expect(js).toContain("mailto:");
    expect(js).toContain('encodeURIComponent(recipient).replace(/%40/gi, "@")');
    expect(js).toContain("encodeURIComponent(subject)");
    expect(js).toContain("encodeURIComponent(body)");
    expect(js).toContain("Open your email app");
    expect(js).toContain("The site owner has not configured a contact email yet.");
  });

  it("creates encoded Gmail and mailto drafts without launching either automatically", () => {
    const { variant, content } = sample();
    const { "script.js": js } = generateSite(variant, content);
    const status = { textContent: "", children: [] as Array<Record<string, string>>, appendChild(child: Record<string, string>) { this.children.push(child); } };
    const fields = {
      name: { name: "name", value: "Jamie & Co" },
      email: { name: "email", value: "visitor+test@example.com" },
      message: { name: "message", value: "Hello & thanks!\nIs this available? #1" },
    };
    let submit: ((event: { preventDefault(): void }) => void) | undefined;
    let recipient = "owner+shop@example.com";
    const form = {
      elements: Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, {
        ...field, addEventListener() {}, removeAttribute() {}, setAttribute() {}, focus() {},
      }])),
      getAttribute: () => recipient,
      addEventListener: (type: string, handler: typeof submit) => { if (type === "submit") submit = handler; },
    };
    const location = { pathname: "/", href: "unchanged" };
    runInNewContext(js, {
      location,
      window: {},
      document: {
        documentElement: { classList: { add() {} }, setAttribute() {}, getAttribute: () => "light" },
        querySelector: () => null,
        addEventListener() {},
        getElementById: (id: string) => id === "contact-form" ? form : id === "form-status" ? status : { textContent: "" },
        createElement: () => ({}),
        createTextNode: (text: string) => ({ textContent: text }),
      },
    });
    submit!({ preventDefault() {} });
    const [gmail, , mailto] = status.children;
    const url = new URL(gmail.href);
    expect(url.origin + url.pathname).toBe("https://mail.google.com/mail/");
    expect(url.searchParams.get("to")).toBe(recipient);
    expect(url.searchParams.get("su")).toBe("Website enquiry from Jamie & Co");
    const body = "Name: Jamie & Co\nEmail: visitor+test@example.com\n\nMessage:\n" + fields.message.value;
    expect(url.searchParams.get("body")).toBe(body);
    expect(gmail.target).toBe("_blank");
    expect(gmail.rel).toBe("noopener noreferrer");
    expect(new URL(mailto.href).searchParams.get("body")).toBe(body);
    expect(mailto.href).toMatch(/^mailto:owner%2Bshop@example.com/);
    expect(status.textContent).toContain("has not been sent");
    expect(location.href).toBe("unchanged");

    recipient = "";
    submit!({ preventDefault() {} });
    expect(status.textContent).toBe("The site owner has not configured a contact email yet.");
  });

  it("generates syntactically valid JavaScript for the published site", () => {
    const { variant, content } = sample();
    const { "script.js": js } = generateSite(variant, { ...content, contactEmail: "owner@example.com" });
    expect(() => new Script(js)).not.toThrow();
  });

  it("never lets user text become markup", () => {
    const { variant, content } = sample();
    const evil = `<script>alert(1)</script><img src=x onerror=alert(2)>`;
    const html = generateSingleFile(variant, {
      ...content,
      brand: evil,
      headline: evil,
      about: evil,
      projects: [{ title: evil, body: evil, meta: evil }],
    });
    expect(html).not.toContain("<script>alert");
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    // Only the site's own script tag is allowed.
    expect(html.match(/<script/g)).toHaveLength(1);
  });

  it("uses the asset base for hosted sites and inlines for single files", () => {
    const { variant, content } = sample();
    const hosted = generateSite(variant, content, { assetBase: "/sites/abc/" })["index.html"];
    expect(hosted).toContain('href="/sites/abc/styles.css"');
    expect(hosted).toContain('src="/sites/abc/script.js"');
    const single = generateSingleFile(variant, content);
    expect(single).toContain("<style>");
    expect(single).not.toContain("styles.css");
  });

  it("produces valid output for every site type and palette", () => {
    for (const type of SITE_TYPES) {
      for (const paletteId of PALETTE_IDS) {
        const spec = { ...interpretPrompt(`${type} site`), type, paletteId };
        for (const variant of generateVariants(spec)) {
          const files = generateSite(variant, buildContent(spec));
          expect(files["index.html"]).toContain("<h1>");
          expect(files["styles.css"]).toContain(`--accent:`);
        }
      }
    }
  });
});

describe("parseSitePayload", () => {
  it("accepts a generated payload", () => {
    const { variant, content } = sample();
    const parsed = parseSitePayload({ variant, content: { ...content, contactEmail: "owner@example.com" } });
    expect(parsed.variant.sections[0]).toBe("hero");
    expect(parsed.content.brand).toBe(content.brand);
    expect(parsed.content.contactEmail).toBe("owner@example.com");
  });

  it("rejects unsupported values, oversized text and non-objects", () => {
    const { variant, content } = sample();
    expect(() => parseSitePayload(null)).toThrow(ValidationError);
    expect(() => parseSitePayload({ variant: { ...variant, paletteId: "red; } body{" }, content })).toThrow(ValidationError);
    expect(() => parseSitePayload({ variant: { ...variant, sections: ["hero", "admin"] }, content })).toThrow(ValidationError);
    expect(() => parseSitePayload({ variant, content: { ...content, brand: "x".repeat(61) } })).toThrow(ValidationError);
    expect(() => parseSitePayload({ variant, content: { ...content, brand: "   " } })).toThrow(ValidationError);
    expect(() =>
      parseSitePayload({
        variant,
        content: { ...content, features: Array.from({ length: 13 }, () => ({ title: "a", body: "b" })) },
      }),
    ).toThrow(ValidationError);
    expect(() =>
      parseSitePayload({
        variant,
        content: { ...content, contactEmail: "not-an-email" },
      }),
    ).toThrow(ValidationError);
  });

  it("drops unknown extra fields", () => {
    const { variant, content } = sample();
    const parsed = parseSitePayload({ variant: { ...variant, evil: "x" }, content });
    expect(parsed.variant).not.toHaveProperty("evil");
  });
});

describe("site store", () => {
  let dir: string | undefined;
  afterEach(async () => {
    if (dir) await rm(dir, { recursive: true, force: true });
    dir = undefined;
  });

  it("saves and reads back files, and rejects unsafe names", async () => {
    dir = await mkdtemp(path.join(tmpdir(), "sites-"));
    const { variant, content } = sample();
    const id = await saveSite(variant, content, dir);
    expect(isSiteId(id)).toBe(true);
    const html = await readSiteFile(id, "index.html", dir);
    expect(html).toContain(`/sites/${id}/styles.css`);
    expect(await readSiteFile(id, "script.js", dir)).toContain("contact-form");
    expect(await readSiteFile("0123456789abcdef", "index.html", dir)).toBeNull();
    expect(await readSiteFile("../../etc", "index.html", dir)).toBeNull();
    expect(isSiteFile("../package.json")).toBe(false);
    expect(isSiteFile("index.html")).toBe(true);
  });
});

describe("downloads", () => {
  it("builds a zip with a relative-path static site", () => {
    const { variant, content } = sample("cafe called Olive & Thyme");
    const zip = unzipSync(createSiteZip(variant, content));
    const names = Object.keys(zip);
    expect(names).toEqual(
      expect.arrayContaining([
        "olive-thyme/index.html",
        "olive-thyme/styles.css",
        "olive-thyme/script.js",
        "olive-thyme/README.txt",
      ]),
    );
    expect(strFromU8(zip["olive-thyme/index.html"])).toContain('href="styles.css"');
  });

  it("slugifies safely", () => {
    expect(slugify("  Olive & Thyme!! ")).toBe("olive-thyme");
    expect(slugify("../../")).toBe("website");
  });
});
