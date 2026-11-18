import { NextResponse } from "next/server";
import { MAX_BODY_BYTES } from "@/lib/site/limits";
import { saveSite } from "@/lib/site/store";
import { ValidationError, parseSitePayload } from "@/lib/site/validate";

export async function POST(request: Request) {
  // Only the builder page itself may publish sites.
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) {
    return NextResponse.json({ error: "Cross-origin requests are not allowed." }, { status: 403 });
  }

  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Website is too large." }, { status: 413 });
  }
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Website is too large." }, { status: 413 });
  }

  try {
    const { variant, content } = parseSitePayload(JSON.parse(raw));
    const id = await saveSite(variant, content);
    return NextResponse.json({ id, url: `/sites/${id}` }, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof SyntaxError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Failed to publish site", error);
    return NextResponse.json({ error: "Could not publish the website." }, { status: 500 });
  }
}
