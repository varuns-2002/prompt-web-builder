/**
 * Chooses which part of a picture to keep when it has to fit a box of a different
 * shape. Instead of always cutting from the middle, it keeps the window with the most
 * going on (detail and colour), so a subject at the side of a photo is not cut off.
 *
 * This is pure arithmetic on a small "interest map" (one number per cell), so it can
 * be tested without a browser. The browser code that builds the map is in image.ts.
 */

export interface InterestMap {
  width: number;
  height: number;
  /** width x height numbers, row by row. Higher means more worth keeping. */
  data: ArrayLike<number>;
}

/** A crop as fractions of the picture, each between 0 and 1. */
export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** How much a window is penalised for sitting far from the middle (0 to 1 of its score). */
const CENTER_BIAS = 0.12;

export function chooseCrop(map: InterestMap, ratio: number): CropRect {
  const { width: w, height: h, data } = map;
  const everything: CropRect = { x: 0, y: 0, width: 1, height: 1 };
  if (w < 1 || h < 1 || !(ratio > 0) || Math.abs(w / h - ratio) < 0.01) return everything;

  // The picture is wider than the box: keep full height and slide a window across.
  // Otherwise keep full width and slide a window down.
  const sideways = w / h > ratio;
  const length = sideways ? w : h;
  const cross = sideways ? h : w;
  const windowCells = sideways ? h * ratio : w / ratio; // may be fractional
  const size = Math.min(length, Math.max(1, Math.round(windowCells)));

  // Total interest in each column (or row), then in every window of `size` of them.
  const sums = new Array<number>(length).fill(0);
  for (let i = 0; i < length; i++) {
    for (let j = 0; j < cross; j++) sums[i] += sideways ? data[j * w + i] : data[i * w + j];
  }
  let running = 0;
  for (let i = 0; i < size; i++) running += sums[i];

  let best = 0;
  let bestScore = -Infinity;
  let total = 0;
  for (let start = 0; start + size <= length; start++) {
    if (start > 0) running += sums[start + size - 1] - sums[start - 1];
    total += running;
    const centre = start + size / 2;
    const offCentre = Math.abs(centre - length / 2) / (length / 2);
    const score = running * (1 - CENTER_BIAS * offCentre);
    if (score > bestScore) {
      bestScore = score;
      best = start;
    }
  }

  // A flat picture gives no reason to prefer a side, so use the middle.
  if (total <= 0) best = (length - size) / 2;

  const fraction = Math.min(1, windowCells / length);
  // Centre the exact-size window on the cells that were chosen.
  const centre = (best + size / 2) / length;
  const offset = Math.max(0, Math.min(1 - fraction, centre - fraction / 2));
  return sideways
    ? { x: offset, y: 0, width: fraction, height: 1 }
    : { x: 0, y: offset, width: 1, height: fraction };
}
