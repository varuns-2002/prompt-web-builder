import { chooseCrop, type InterestMap } from "./crop";
import { MAX_UPLOAD_BYTES, formatBytes, type PictureTarget } from "./site/limits";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

export const PHOTO_ACCEPT = ACCEPTED.join(",");

export class PhotoError extends Error {}

export function isAcceptedImage(file: File): boolean {
  return ACCEPTED.includes(file.type);
}

export interface FittedPicture {
  /** The finished picture as a JPEG data URL. */
  url: string;
  /** Size of the finished picture. */
  width: number;
  height: number;
  /** Size of the original. */
  sourceWidth: number;
  sourceHeight: number;
  /** Part of the original was cut off to fit the box. */
  cropped: boolean;
  /** The part that was kept is much smaller than the box, so it may look soft. */
  small: boolean;
}

/** A coarse map of where the interesting parts of a picture are: edges and colour. */
function interestMap(bitmap: ImageBitmap): InterestMap {
  const scale = 64 / Math.max(bitmap.width, bitmap.height);
  const width = Math.max(2, Math.round(bitmap.width * scale));
  const height = Math.max(2, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return { width, height, data: new Array<number>(width * height).fill(0) };
  ctx.drawImage(bitmap, 0, 0, width, height);
  const pixels = ctx.getImageData(0, 0, width, height).data;

  const luma = new Float32Array(width * height);
  const colour = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const r = pixels[i * 4];
    const g = pixels[i * 4 + 1];
    const b = pixels[i * 4 + 2];
    luma[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    colour[i] = Math.max(r, g, b) - Math.min(r, g, b);
  }
  const data = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const dx = x + 1 < width ? Math.abs(luma[i + 1] - luma[i]) : 0;
      const dy = y + 1 < height ? Math.abs(luma[i + width] - luma[i]) : 0;
      data[i] = dx + dy + colour[i] * 0.25;
    }
  }
  return { width, height, data };
}

/**
 * Turns an uploaded picture of any size and shape into one that fits its box exactly:
 * the most interesting part is kept at the box's proportions, then shrunk to the box
 * size (never enlarged) and saved as a JPEG within the size budget. Drawing to a canvas
 * also strips EXIF data such as GPS location and camera info.
 */
export async function photoToDataUrl(file: File, target: PictureTarget): Promise<FittedPicture> {
  if (!isAcceptedImage(file)) {
    throw new PhotoError("Please choose a JPEG, PNG or WebP image.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new PhotoError(`That file is larger than ${formatBytes(MAX_UPLOAD_BYTES)}. Please choose a smaller image.`);
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new PhotoError("That image could not be read. Try a different file.");
  }

  try {
    const ratio = target.width / target.height;
    const crop = chooseCrop(interestMap(bitmap), ratio);
    const sx = crop.x * bitmap.width;
    const sy = crop.y * bitmap.height;
    const sw = crop.width * bitmap.width;
    const sh = crop.height * bitmap.height;

    // Fit the box's width, but never enlarge a small picture.
    let width = Math.max(1, Math.min(target.width, Math.round(sw)));
    for (let attempt = 0; attempt < 6; attempt++) {
      const height = Math.max(1, Math.round(width / ratio));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new PhotoError("Your browser could not process the image.");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, width, height);

      for (const quality of [0.82, 0.7, 0.58]) {
        const url = canvas.toDataURL("image/jpeg", quality);
        if (url.length <= target.maxChars) {
          return {
            url,
            width,
            height,
            sourceWidth: bitmap.width,
            sourceHeight: bitmap.height,
            cropped: crop.width < 0.99 || crop.height < 0.99,
            small: sw < target.width * 0.6,
          };
        }
      }
      width = Math.round(width * 0.8);
    }
    throw new PhotoError("That image is too detailed to shrink enough. Try a simpler one.");
  } finally {
    bitmap.close();
  }
}
