import { describe, expect, it } from "vitest";
import { chooseCrop, type InterestMap } from "./crop";
import { describeFit } from "./fit-message";
import type { FittedPicture } from "./image";
import { SLOT_GUIDE, pictureTarget } from "./site/limits";
import type { SlotKind } from "./site/limits";

/** A map where only the listed cells are interesting. */
function mapWith(width: number, height: number, hot: Array<[number, number]>): InterestMap {
  const data = new Array<number>(width * height).fill(0);
  for (const [x, y] of hot) data[y * width + x] = 10;
  return { width, height, data };
}

function block(width: number, height: number, x0: number, x1: number, y0 = 0, y1 = height - 1): InterestMap {
  const cells: Array<[number, number]> = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) cells.push([x, y]);
  return mapWith(width, height, cells);
}

describe("chooseCrop", () => {
  it("keeps the whole picture when it is already the right shape", () => {
    expect(chooseCrop(block(16, 9, 0, 15), 16 / 9)).toEqual({ x: 0, y: 0, width: 1, height: 1 });
  });

  it("keeps a subject at the right of a wide picture instead of cutting from the middle", () => {
    // 20x10 picture, square box: a window 10 cells wide. The subject is in the last four columns.
    const crop = chooseCrop(block(20, 10, 16, 19), 1);
    expect(crop.width).toBeCloseTo(0.5);
    expect(crop.height).toBe(1);
    expect(crop.x).toBeCloseTo(0.5); // the right half, not the middle (0.25)
  });

  it("keeps a subject at the left", () => {
    expect(chooseCrop(block(20, 10, 0, 3), 1).x).toBeCloseTo(0);
  });

  it("keeps a subject at the top or bottom of a tall picture", () => {
    const top = chooseCrop(block(10, 30, 0, 9, 0, 3), 16 / 9);
    expect(top.y).toBeLessThan(0.02); // within a cell of the top edge
    expect(top.width).toBe(1);
    expect(top.height).toBeCloseTo(10 / (16 / 9) / 30);
    const bottom = chooseCrop(block(10, 30, 0, 9, 26, 29), 16 / 9);
    expect(bottom.y + bottom.height).toBeGreaterThan(0.97); // within a cell of the bottom edge
  });

  it("uses the middle when the picture is flat, so there is nothing to prefer", () => {
    const crop = chooseCrop(mapWith(20, 10, []), 1);
    expect(crop.x).toBeCloseTo(0.25);
    expect(crop.width).toBeCloseTo(0.5);
  });

  it("prefers the middle between two equally interesting spots", () => {
    // Two small subjects, equally far each side. The middle window sees both partly; ties favour the centre.
    const crop = chooseCrop(mapWith(20, 10, [[3, 5], [16, 5]]), 1);
    expect(crop.x + crop.width / 2).toBeGreaterThan(0.2);
    expect(crop.x + crop.width / 2).toBeLessThan(0.8);
  });

  it("always returns a window inside the picture with the box's proportions", () => {
    for (const [w, h, ratio] of [[64, 36, 4 / 3], [40, 60, 16 / 9], [64, 40, 1000 / 563], [30, 30, 16 / 9], [100, 20, 1]] as const) {
      for (const hot of [[[0, 0]], [[w - 1, h - 1]], [[Math.floor(w / 2), Math.floor(h / 2)]], []] as Array<Array<[number, number]>>) {
        const crop = chooseCrop(mapWith(w, h, hot), ratio);
        expect(crop.x, `${w}x${h}`).toBeGreaterThanOrEqual(0);
        expect(crop.y).toBeGreaterThanOrEqual(0);
        expect(crop.x + crop.width).toBeLessThanOrEqual(1 + 1e-9);
        expect(crop.y + crop.height).toBeLessThanOrEqual(1 + 1e-9);
        expect((crop.width * w) / (crop.height * h)).toBeCloseTo(ratio, 5);
      }
    }
  });

  it("copes with tiny or odd input", () => {
    expect(chooseCrop({ width: 0, height: 0, data: [] }, 1)).toEqual({ x: 0, y: 0, width: 1, height: 1 });
    expect(chooseCrop(mapWith(2, 2, []), 0)).toEqual({ x: 0, y: 0, width: 1, height: 1 });
    expect(() => chooseCrop(mapWith(3, 1, [[2, 0]]), 4)).not.toThrow();
  });
});

describe("pictureTarget", () => {
  it("is the size and shape of the area the picture goes in", () => {
    const kinds: SlotKind[] = ["hero", "about", "gallery", "features", "projects", "menu", "posts"];
    for (const kind of kinds) {
      const target = pictureTarget(kind);
      expect(target.width).toBe(SLOT_GUIDE[kind].width);
      expect(target.height).toBe(SLOT_GUIDE[kind].height);
      expect(target.maxChars).toBeGreaterThan(100_000);
    }
    expect(pictureTarget("projects")).toMatchObject({ width: 1000, height: 563 });
    expect(pictureTarget("hero").maxChars).toBeGreaterThan(pictureTarget("about").maxChars);
  });
});

describe("describeFit", () => {
  const picture = (over: Partial<FittedPicture> = {}): FittedPicture => ({
    url: `data:image/jpeg;base64,${"A".repeat(100_000)}`,
    width: 1000,
    height: 563,
    sourceWidth: 3000,
    sourceHeight: 2000,
    cropped: true,
    small: false,
    ...over,
  });

  it("explains a single picture: size before and after and whether it was cropped", () => {
    const result = describeFit([{ name: "holiday.jpg", size: 3_000_000 }], [picture()], 1000);
    expect(result.tone).toBe("info");
    expect(result.text).toContain("“holiday.jpg”");
    expect(result.text).toContain("3000 × 2000 px → 1000 × 563 px, cropped to fit");
    expect(result.text).toMatch(/2\.9 MB → 73 KB/);
    expect(describeFit([{ name: "a.jpg", size: 1 }], [picture({ cropped: false })], 1000).text).toContain("resized to fit");
  });

  it("summarises several pictures", () => {
    const result = describeFit(
      [{ name: "a.jpg", size: 1_000_000 }, { name: "b.jpg", size: 1_000_000 }, { name: "c.jpg", size: 1_000_000 }],
      [picture(), picture({ cropped: false }), picture()],
      1000,
    );
    expect(result.text).toContain("Added 3 pictures, each fitted to its box (2 cropped to keep the best part)");
  });

  it("warns about pictures too small to look sharp, naming them", () => {
    const one = describeFit([{ name: "tiny.png", size: 20_000 }], [picture({ small: true, sourceWidth: 420, sourceHeight: 300, cropped: false })], 1000);
    expect(one.tone).toBe("warn");
    expect(one.text).toContain("“tiny.png” (420 × 300 px) is small, so it may look soft");
    expect(one.text).toContain("at least 1000 px wide");

    const two = describeFit(
      [{ name: "a.png", size: 1 }, { name: "b.png", size: 1 }, { name: "c.png", size: 1 }],
      [picture({ small: true }), picture(), picture({ small: true })],
      1000,
    );
    expect(two.tone).toBe("warn");
    expect(two.text).toContain("“a.png” (3000 × 2000 px), “c.png” (3000 × 2000 px) are small, so they may look soft");
    expect(two.text).not.toContain("“b.png” (");
  });
});
