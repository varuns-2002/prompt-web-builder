import { randomBytes } from "node:crypto";
import { mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { generateSite, type SiteFiles } from "./render";
import type { SiteContent, Variant } from "../types";

const ID_PATTERN = /^[a-f0-9]{16}$/;
const MAX_SITES = 200;

export const SITE_FILE_TYPES: Record<keyof SiteFiles, string> = {
  "index.html": "text/html; charset=utf-8",
  "styles.css": "text/css; charset=utf-8",
  "script.js": "text/javascript; charset=utf-8",
};

export function isSiteId(value: string): boolean {
  return ID_PATTERN.test(value);
}

export function isSiteFile(value: string): value is keyof SiteFiles {
  return Object.hasOwn(SITE_FILE_TYPES, value);
}

export function defaultSitesDir(): string {
  return path.join(process.cwd(), ".generated-sites");
}

/** Writes a validated site to disk and returns its public id. */
export async function saveSite(
  variant: Variant,
  content: SiteContent,
  dir: string = defaultSitesDir(),
): Promise<string> {
  const id = randomBytes(8).toString("hex");
  const files = generateSite(variant, content, { assetBase: `/sites/${id}/` });
  const target = path.join(dir, id);
  await mkdir(target, { recursive: true });
  await Promise.all(
    (Object.keys(files) as Array<keyof SiteFiles>).map((name) =>
      writeFile(path.join(target, name), files[name], "utf8"),
    ),
  );
  await prune(dir);
  return id;
}

export async function readSiteFile(
  id: string,
  file: keyof SiteFiles,
  dir: string = defaultSitesDir(),
): Promise<string | null> {
  if (!isSiteId(id)) return null;
  try {
    return await readFile(path.join(dir, id, file), "utf8");
  } catch {
    return null;
  }
}

/** Keeps disk usage bounded by deleting the oldest sites beyond MAX_SITES. */
async function prune(dir: string): Promise<void> {
  const ids = (await readdir(dir)).filter(isSiteId);
  if (ids.length <= MAX_SITES) return;
  const dated = await Promise.all(
    ids.map(async (id) => ({ id, time: (await stat(path.join(dir, id))).mtimeMs })),
  );
  dated.sort((a, b) => a.time - b.time);
  for (const { id } of dated.slice(0, ids.length - MAX_SITES)) {
    await rm(path.join(dir, id), { recursive: true, force: true });
  }
}
