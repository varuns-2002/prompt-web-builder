import { SITE_FILE_TYPES, isSiteFile, isSiteId, readSiteFile } from "@/lib/site/store";

// Generated sites can only load their own files, and cannot run injected inline script.
const CSP = [
  "default-src 'none'",
  "style-src 'self'",
  "script-src 'self'",
  "img-src data:",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'self'",
].join("; ");

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; file?: string[] }> },
) {
  const { id, file } = await params;
  const name = file?.length ? file.join("/") : "index.html";

  if (!isSiteId(id) || !isSiteFile(name)) {
    return new Response("Not found", { status: 404 });
  }
  const body = await readSiteFile(id, name);
  if (body === null) {
    return new Response("Website not found", { status: 404 });
  }

  return new Response(body, {
    headers: {
      "Content-Type": SITE_FILE_TYPES[name],
      "Content-Security-Policy": CSP,
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "Cache-Control": "no-cache",
    },
  });
}
