import { ANIMATION_SCRIPT, animationStyle, progressBarHtml } from "./animation";
import { buildCss } from "./css";
import { labelOf, type ListKey } from "./edits";
import { EDITOR_CSS, EDITOR_SCRIPT, LIGHTBOX_SCRIPT } from "./editor";
import { MAX_GALLERY_IMAGES, MAX_ITEMS, MAX_UPLOAD_BYTES, ACCEPTED_FORMATS_LABEL, formatBytes, sizeLabel, type SlotKind } from "./limits";
import { SITE_SCRIPT, colorPickerScript } from "./script";
import { isValidEmail } from "../email";
import { sceneSvg } from "../scenes";
import { PALETTES, variantTheme } from "../themes";
import { PALETTE_IDS, type ContentItem, type SectionKind, type SectionLabel, type SiteContent, type Variant } from "../types";

export interface SiteFiles {
  "index.html": string;
  "styles.css": string;
  "script.js": string;
}

type BodyKind = Exclude<SectionKind, "hero">;

/** Escapes text for use in HTML content and quoted attributes. */
export function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Editing mode adds drop targets and Add/Replace/Remove buttons around every
 * picture position, makes text editable and adds card and section controls.
 * It is only used for the dashboard preview.
 */
interface Ctx {
  editor: boolean;
}

/** Attributes that make an element editable in the preview. Nothing on a published site. */
function ed(ctx: Ctx, path: string, placeholder: string): string {
  return ctx.editor ? ` data-edit="${path}" data-placeholder="${esc(placeholder)}"` : "";
}

/** Wraps text so it can be edited on its own. Plain text on a published site. */
function editable(ctx: Ctx, path: string, placeholder: string, text: string): string {
  return ctx.editor ? `<span${ed(ctx, path, placeholder)}>${esc(text)}</span>` : esc(text);
}

const ADD_LABELS: Record<ListKey, string> = {
  features: "Add a service",
  projects: "Add a project",
  menu: "Add a dish",
  posts: "Add a post",
  plans: "Add a plan",
  testimonials: "Add a review",
};

function cardBar(list: ListKey, index: number, count: number): string {
  return (
    `<div class="card-bar" role="group" aria-label="Card controls">` +
    `<button type="button" data-act="earlier:${list}:${index}" aria-label="Move card earlier"${index === 0 ? " disabled" : ""}>←</button>` +
    `<button type="button" data-act="later:${list}:${index}" aria-label="Move card later"${index === count - 1 ? " disabled" : ""}>→</button>` +
    `<button type="button" data-act="remove:${list}:${index}" aria-label="Delete card" class="danger">Delete</button></div>`
  );
}

function sectionBar(kind: BodyKind, first: boolean, last: boolean): string {
  return (
    `<div class="section-bar" role="group" aria-label="Section controls">` +
    `<button type="button" data-act="section-up:${kind}" aria-label="Move section up"${first ? " disabled" : ""}>↑ Up</button>` +
    `<button type="button" data-act="section-down:${kind}" aria-label="Move section down"${last ? " disabled" : ""}>↓ Down</button>` +
    `<button type="button" data-act="section-hide:${kind}" aria-label="Hide section">Hide</button></div>`
  );
}

function hint(kind: SlotKind): string {
  return `Best size ${sizeLabel(kind)}`;
}

function filledBar(kind: SlotKind): string {
  return (
    `<div class="slot-bar"><span class="slot-hint">${hint(kind)}</span>` +
    `<button type="button" data-slot-action="pick">Replace</button>` +
    `<button type="button" data-slot-action="remove">Remove</button></div>`
  );
}

/**
 * One picture position. With a picture it is an <img>. Without one it is the
 * fallback on a real site, or a drop target while editing.
 */
function media(
  slot: string,
  image: string | undefined,
  cls: string,
  ctx: Ctx,
  fallback = "",
  emptyLabel = "Drop an image here",
): string {
  const attr = ctx.editor ? ` data-slot="${slot}"` : "";
  const kind = slot.split(":")[0] as SlotKind;
  if (image) {
    return `<div class="media ${cls}"${attr}><img src="${esc(image)}" alt="">${ctx.editor ? filledBar(kind) : ""}</div>`;
  }
  if (ctx.editor) {
    return (
      `<div class="media empty ${cls}"${attr}><div class="media-empty"><p>${emptyLabel}</p>` +
      `<p class="media-hint">${hint(kind)}<br>${ACCEPTED_FORMATS_LABEL}, up to ${formatBytes(MAX_UPLOAD_BYTES)}</p>` +
      `<button type="button" data-slot-action="pick">Add image</button></div></div>`
    );
  }
  return fallback;
}

function cards(
  list: ListKey,
  content: SiteContent,
  ctx: Ctx,
  render: (item: ContentItem, index: number, count: number) => string,
): string {
  const items = content[list];
  const tiles = items.map((item, i) => render(item, i, items.length));
  if (ctx.editor && items.length < MAX_ITEMS) {
    tiles.push(`<div class="add-card"><button type="button" data-act="add:${list}">+ ${ADD_LABELS[list]}</button></div>`);
  }
  return `<div class="grid">${tiles.join("")}</div>`;
}

function section(kind: BodyKind, alt: boolean, body: string, title: string, ctx: Ctx, first: boolean, last: boolean): string {
  return (
    `<section id="${kind}" class="section${alt ? " alt" : ""}" aria-labelledby="${kind}-title">` +
    `${ctx.editor ? sectionBar(kind, first, last) : ""}` +
    `<div class="container"><h2 id="${kind}-title"${ed(ctx, `label:${kind}:title`, "Section title")}>${esc(title)}</h2>${body}</div></section>`
  );
}

/** Section title and navigation text, using the industry's own wording when it has one. */
function labelFor(kind: BodyKind, content: SiteContent): SectionLabel {
  return labelOf(content, kind);
}

/** A content card. Gets a picture area when it has a picture (or is being edited). */
function itemCard(
  kind: "features" | "projects" | "menu" | "posts",
  item: ContentItem,
  index: number,
  count: number,
  ctx: Ctx,
): string {
  // Projects always show a visual, so they fall back to a colored tile.
  const fallback = kind === "projects" ? `<div class="thumb" aria-hidden="true"></div>` : "";
  const picture = media(`${kind}:${index}`, item.image, "card-media", ctx, fallback);
  const path = (part: string) => `item:${kind}:${index}:${part}`;
  // While editing, a card without a detail still shows an empty line so one can be added.
  const meta =
    item.meta || ctx.editor ? `<p class="meta"${ed(ctx, path("meta"), "Add a detail")}>${esc(item.meta ?? "")}</p>` : "";
  const text =
    `<h3${ed(ctx, path("title"), "Title")}>${esc(item.title)}</h3>` +
    `<p${ed(ctx, path("body"), "Description")}>${esc(item.body)}</p>${meta}`;
  const bar = ctx.editor ? cardBar(kind, index, count) : "";
  if (picture) return `<article class="card has-thumb">${bar}${picture}<div class="card-body">${text}</div></article>`;
  return `<article class="card">${text}</article>`;
}

function galleryTiles(content: SiteContent, ctx: Ctx): string {
  const tiles = content.gallery.map((src, i) =>
    ctx.editor
      ? media(`gallery:${i}`, src, "gallery-item", ctx)
      : `<div class="media gallery-item"><button type="button" class="gallery-open" aria-label="View picture ${i + 1} larger">` +
        `<img src="${esc(src)}" alt=""></button></div>`,
  );
  if (ctx.editor && content.gallery.length < MAX_GALLERY_IMAGES) {
    tiles.push(
      `<div class="media empty gallery-item" data-slot="gallery"><div class="media-empty"><p>Drop pictures here</p>` +
        `<p class="media-hint">${hint("gallery")} each<br>${ACCEPTED_FORMATS_LABEL}, up to ${formatBytes(MAX_UPLOAD_BYTES)}</p>` +
        `<button type="button" data-slot-action="pick-many">Add pictures</button></div></div>`,
    );
  }
  return `<div class="gallery-grid">${tiles.join("")}</div>`;
}

function renderBody(kind: BodyKind, content: SiteContent, hasContact: boolean, ctx: Ctx): string {
  switch (kind) {
    case "about": {
      const picture = media("about", content.aboutImage, "about-media", ctx);
      return (
        `<div class="about-grid${picture ? " has-media" : ""}">` +
        `<p class="about"${ed(ctx, "about", "Write something about you")}>${esc(content.about)}</p>${picture}</div>`
      );
    }
    case "features":
    case "projects":
    case "menu":
    case "posts":
      return cards(kind, content, ctx, (item, i, count) => itemCard(kind, item, i, count, ctx));
    case "gallery":
      return galleryTiles(content, ctx);
    case "pricing":
      return cards(
        "plans",
        content,
        ctx,
        (plan, i, count) =>
          `<article class="card">${ctx.editor ? cardBar("plans", i, count) : ""}` +
          `<p class="price"${ed(ctx, `item:plans:${i}:meta`, "Price")}>${esc(plan.meta ?? "")}</p>` +
          `<h3${ed(ctx, `item:plans:${i}:title`, "Plan name")}>${esc(plan.title)}</h3>` +
          `<p${ed(ctx, `item:plans:${i}:body`, "What is included")}>${esc(plan.body)}</p>` +
          `${hasContact ? `<a class="btn" href="#contact">Choose ${esc(plan.title)}</a>` : ""}</article>`,
      );
    case "testimonials":
      return cards(
        "testimonials",
        content,
        ctx,
        (t, i, count) =>
          `<figure class="card">${ctx.editor ? cardBar("testimonials", i, count) : ""}` +
          `<blockquote>“${editable(ctx, `item:testimonials:${i}:body`, "What they said", t.body)}”</blockquote>` +
          `<figcaption${ed(ctx, `item:testimonials:${i}:title`, "Name")}>${esc(t.title)}</figcaption></figure>`,
      );
    case "contact":
      return (
        `<form id="contact-form" class="form" data-recipient="${content.contactEmail && isValidEmail(content.contactEmail) ? esc(content.contactEmail) : ""}" novalidate>` +
        `<div><label for="f-name">Name</label><input id="f-name" name="name" type="text" autocomplete="name" aria-describedby="err-name" required><span class="error" id="err-name"></span></div>` +
        `<div><label for="f-email">Email</label><input id="f-email" name="email" type="email" autocomplete="email" aria-describedby="err-email" required><span class="error" id="err-email"></span></div>` +
        `<div><label for="f-message">Message</label><textarea id="f-message" name="message" rows="4" aria-describedby="err-message" required></textarea><span class="error" id="err-message"></span></div>` +
        `<div><button class="btn" type="submit">Send message</button></div>` +
        `<p class="status" id="form-status" role="status" aria-live="polite"></p></form>`
      );
  }
}

function hero(variant: Variant, content: SiteContent, ctaTarget: string, ctx: Ctx): string {
  // The button is a link on a real site. While editing it is plain text, so clicking it edits it.
  const button = ctx.editor
    ? `<span class="btn"${ed(ctx, "cta", "Button text")}>${esc(content.ctaLabel)}</span>`
    : `<a class="btn" href="${ctaTarget}">${esc(content.ctaLabel)}</a>`;
  const copy =
    `<h1${ed(ctx, "headline", "Headline")}>${esc(content.headline)}</h1>` +
    `<p class="lead"${ed(ctx, "tagline", "A short line under the headline")}>${esc(content.tagline)}</p>` +
    `<p class="actions">${button}</p>`;
  const layout = variant.heroLayout;
  const photo = variant.imageMode === "photo" && variant.photo ? variant.photo : null;
  const mode = variant.imageMode === "none" ? "none" : photo ? "photo" : "scene";
  const art = sceneSvg(variant.industry ?? "business");

  const attr = ctx.editor ? ` data-slot="hero"` : "";
  const bar = ctx.editor
    ? `<div class="slot-bar hero-bar"><span class="slot-hint">${hint("hero")}</span>` +
      `<button type="button" data-slot-action="pick">${photo ? "Replace photo" : "Add photo"}</button>` +
      (photo ? `<button type="button" data-slot-action="remove">Remove photo</button>` : "") +
      `</div>`
    : "";

  // A photo fills banner and centered heroes edge to edge, dimmed for readable text.
  if (mode === "photo" && layout !== "split") {
    return (
      `<section id="top" class="hero hero-${layout} has-photo"${attr}>` +
      `<img class="hero-photo" src="${esc(photo!)}" alt=""><div class="container">${copy}</div>${bar}</section>`
    );
  }

  const artBox = (extra = "") => {
    const inner = mode === "photo" ? `<img class="photo" src="${esc(photo!)}" alt="">` : art;
    return `<div class="hero-art${extra}" aria-hidden="true">${inner}</div>`;
  };

  if (layout === "split") {
    const right = mode === "none" ? `<div class="hero-art" aria-hidden="true"></div>` : artBox();
    return `<section id="top" class="hero hero-split"${attr}><div class="container"><div>${copy}</div>${right}</div>${bar}</section>`;
  }
  if (layout === "banner") {
    const right = mode === "scene" ? artBox(" banner-art") : "";
    return `<section id="top" class="hero hero-banner"${attr}><div class="container"><div>${copy}</div>${right}</div>${bar}</section>`;
  }
  const below = mode === "scene" ? artBox(" wide-art") : "";
  return `<section id="top" class="hero hero-centered"${attr}><div class="container">${copy}${below}</div>${bar}</section>`;
}

export interface RenderOptions {
  /** Where styles.css and script.js are loaded from. Omit to inline both. */
  assetBase?: string;
  /** Adds drop targets and edit buttons. Dashboard preview only. */
  editor?: boolean;
}

/** Whether a section has anything to show on a real site. Empty ones are left out. */
function hasContent(kind: BodyKind, content: SiteContent): boolean {
  switch (kind) {
    case "about":
      return content.about.trim() !== "" || Boolean(content.aboutImage);
    case "features":
    case "projects":
    case "menu":
    case "posts":
      return content[kind].length > 0;
    case "pricing":
      return content.plans.length > 0;
    case "testimonials":
      return content.testimonials.length > 0;
    case "gallery":
      return content.gallery.length > 0;
    case "contact":
      return true;
  }
}

function buildHtml(
  variant: Variant,
  content: SiteContent,
  files: Pick<SiteFiles, "styles.css" | "script.js">,
  opts: RenderOptions,
): string {
  const ctx: Ctx = { editor: opts.editor === true };
  // A section with nothing in it is left out of a real site, but shown while editing so it can be filled.
  const body = variant.sections.filter((k): k is BodyKind => k !== "hero" && (ctx.editor || hasContent(k, content)));
  const hasContact = body.includes("contact");
  const ctaTarget = hasContact ? "#contact" : body.length > 0 ? `#${body[0]}` : "#top";

  const nav = body.map((k) => `<a href="#${k}">${esc(labelFor(k, content).nav)}</a>`).join("");
  const sections = body
    .map((k, i) =>
      section(k, i % 2 === 1, renderBody(k, content, hasContact, ctx), labelFor(k, content).title, ctx, i === 0, i === body.length - 1),
    )
    .join("\n");
  const brand = ctx.editor
    ? `<span class="brand"${ed(ctx, "brand", "Name")}>${esc(content.brand)}</span>`
    : `<a class="brand" href="#top">${esc(content.brand)}</a>`;
  const lightbox =
    !ctx.editor && body.includes("gallery")
      ? `<dialog id="lightbox" class="lightbox" aria-label="Picture viewer"><img id="lightbox-img" alt="">` +
        `<div class="lightbox-bar"><button type="button" data-lightbox-prev>Previous</button>` +
        `<button type="button" data-lightbox-next>Next</button><button type="button" data-lightbox-close>Close</button></div></dialog>`
      : "";

  const inline = opts.assetBase === undefined;
  const base = opts.assetBase ?? "";
  const style = inline
    ? `<style>\n${files["styles.css"]}</style>`
    : `<link rel="stylesheet" href="${esc(base)}styles.css">`;
  const script = inline
    ? `<script>\n${files["script.js"]}</script>`
    : `<script src="${esc(base)}script.js" defer></script>`;

  return `<!doctype html>
<html lang="en" data-theme="${variant.mode}"${animationStyle(variant) === "none" ? "" : ` data-anim="${animationStyle(variant)}"`}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(content.brand)}</title>
<meta name="description" content="${esc(content.tagline || content.headline)}">
${style}
</head>
<body>
${progressBarHtml(variant)}
<a class="skip" href="#main">Skip to content</a>
<header class="site-header"><div class="bar">
${brand}
<button class="menu-btn" type="button" data-menu-toggle aria-expanded="false" aria-controls="nav">Menu</button>
<nav id="nav" class="nav" aria-label="Main">${nav}${visitorColorsEnabled(variant) ? COLOR_PICKER_HTML : ""}<button class="theme-btn" type="button" data-theme-toggle>${variant.mode === "dark" ? "Light mode" : "Dark mode"}</button></nav>
</div></header>
<main id="main">
${hero(variant, content, ctaTarget, ctx)}
${sections}
</main>
<footer class="site-footer"><div class="container">© ${esc(content.brand)}. All rights reserved.</div></footer>
${lightbox}
${script}
</body>
</html>
`;
}

function visitorColorsEnabled(variant: Variant): boolean {
  return variant.visitorColors !== false;
}

/** Behaviour script for a site: base script, optional color picker and gallery viewer. */
function siteScript(variant: Variant, content: SiteContent): string {
  const parts = [SITE_SCRIPT];
  if (animationStyle(variant) !== "none") parts.push(ANIMATION_SCRIPT);
  if (visitorColorsEnabled(variant)) {
    const swatches = PALETTE_IDS.map((id) => ({ name: PALETTES[id].name, color: PALETTES[id].accent }));
    const defaultAccent = variantTheme(variant, variant.mode).accent;
    parts.push(colorPickerScript({ swatches, defaultAccent }));
  }
  if (variant.sections.includes("gallery") && content.gallery.length > 0) parts.push(LIGHTBOX_SCRIPT);
  return parts.join("\n");
}

const COLOR_PICKER_HTML =
  `<div class="color-picker"><button class="theme-btn" type="button" data-color-toggle aria-expanded="false" aria-controls="color-panel">Colors</button>` +
  `<div id="color-panel" class="color-panel" role="group" aria-label="Choose the site's accent color" hidden>` +
  `<p class="color-title">Site color</p><div id="swatch-list" class="swatches"></div>` +
  `<label class="color-custom" for="custom-accent">Custom color<input id="custom-accent" type="color"></label>` +
  `<button class="color-reset" type="button" data-color-reset>Reset to default</button></div></div>`;

/** Multi-file site. Use assetBase "" for relative files or "/sites/<id>/" when hosted. */
export function generateSite(
  variant: Variant,
  content: SiteContent,
  opts: { assetBase: string } = { assetBase: "" },
): SiteFiles {
  const files = { "styles.css": buildCss(variant), "script.js": siteScript(variant, content) };
  return { "index.html": buildHtml(variant, content, files, opts), ...files };
}

/** One self-contained HTML file with CSS and JavaScript inlined. */
export function generateSingleFile(variant: Variant, content: SiteContent): string {
  return buildHtml(variant, content, { "styles.css": buildCss(variant), "script.js": siteScript(variant, content) }, {});
}

/**
 * Editing preview: the same site plus drop targets, Add/Replace/Remove buttons
 * and the messaging script. Never published or downloaded.
 */
export function generateEditorFile(variant: Variant, content: SiteContent): string {
  const files = {
    "styles.css": `${buildCss(variant)}${EDITOR_CSS}`,
    "script.js": `${siteScript(variant, content)}\n${EDITOR_SCRIPT}`,
  };
  return buildHtml(variant, content, files, { editor: true });
}
