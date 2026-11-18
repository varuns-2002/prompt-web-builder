import type { FittedPicture } from "./image";
import { dataUrlBytes, formatBytes } from "./site/limits";

/** What to tell the user after pictures were fitted to their boxes. Warns about ones too small to look sharp. */
export function describeFit(
  files: Array<{ name: string; size: number }>,
  fitted: FittedPicture[],
  targetWidth: number,
): { tone: "info" | "warn"; text: string } {
  const before = formatBytes(files.reduce((sum, file) => sum + file.size, 0));
  const after = formatBytes(fitted.reduce((sum, picture) => sum + dataUrlBytes(picture.url.length), 0));

  let text: string;
  if (fitted.length === 1) {
    const [p] = fitted;
    const how = p.cropped ? "cropped to fit" : "resized to fit";
    text = `Added “${files[0].name}”: ${p.sourceWidth} × ${p.sourceHeight} px → ${p.width} × ${p.height} px, ${how} (${before} → ${after}).`;
  } else {
    const cropped = fitted.filter((p) => p.cropped).length;
    text = `Added ${fitted.length} pictures, each fitted to its box${cropped ? ` (${cropped} cropped to keep the best part)` : ""} (${before} → ${after}).`;
  }

  const small = fitted.flatMap((p, i) => (p.small ? [`“${files[i].name}” (${p.sourceWidth} × ${p.sourceHeight} px)`] : []));
  if (small.length === 0) return { tone: "info", text };
  const subject = small.length === 1 ? `${small[0]} is` : `${small.join(", ")} are`;
  return {
    tone: "warn",
    text: `${text} ${subject} small, so ${small.length === 1 ? "it" : "they"} may look soft. For the sharpest result use pictures at least ${targetWidth} px wide.`,
  };
}
