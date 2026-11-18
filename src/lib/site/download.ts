import { strToU8, zipSync } from "fflate";
import { generateSingleFile, generateSite } from "./render";
import type { SiteContent, Variant } from "../types";

export function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return slug || "website";
}

function readme(brand: string): string {
  return `${brand}
${"=".repeat(brand.length)}

A static website with no build step or dependencies.

Open index.html in a browser, or upload the whole folder to any static host
(GitHub Pages, Netlify, Cloudflare Pages, an S3 bucket, ...).

Files
  index.html  page content
  styles.css  design
  script.js   navigation, theme toggle and contact-form validation

Set the contact-form recipient in the builder before downloading. Submitting
the form opens the visitor's configured email app with the message addressed
to that recipient; the visitor must review and send it. This static form does
not deliver messages in the background. The recipient address is public in
the website source.
`;
}

/** Builds a zip containing a ready-to-host static website. */
export function createSiteZip(variant: Variant, content: SiteContent): Uint8Array {
  const folder = slugify(content.brand);
  const files = generateSite(variant, content, { assetBase: "" });
  return zipSync({
    [`${folder}/index.html`]: strToU8(files["index.html"]),
    [`${folder}/styles.css`]: strToU8(files["styles.css"]),
    [`${folder}/script.js`]: strToU8(files["script.js"]),
    [`${folder}/README.txt`]: strToU8(readme(content.brand)),
  });
}

export function createSingleHtml(variant: Variant, content: SiteContent): string {
  return generateSingleFile(variant, content);
}

/** Browser-only: saves data as a file download. */
export function downloadFile(name: string, data: BlobPart, type: string): void {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}
