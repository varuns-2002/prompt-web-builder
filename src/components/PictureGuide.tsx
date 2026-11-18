import { ImagePlus } from "lucide-react";
import {
  ACCEPTED_FORMATS_LABEL,
  MAX_GALLERY_IMAGES,
  MAX_UPLOAD_BYTES,
  formatBytes,
  pictureBudget,
  sizeLabel,
} from "@/lib/site/limits";

const ROWS: Array<{ label: string; size: string; note: string }> = [
  { label: "Hero", size: sizeLabel("hero"), note: "wide photo behind or beside the headline" },
  { label: "About", size: sizeLabel("about"), note: "shown beside the text" },
  { label: "Cards", size: sizeLabel("projects"), note: "projects, features, menu and blog posts" },
  { label: "Gallery", size: sizeLabel("gallery"), note: `up to ${MAX_GALLERY_IMAGES} pictures` },
];

/** Tells the user what pictures they can add and how much room is left. */
export function PictureGuide({ usedChars, galleryCount }: { usedChars: number; galleryCount: number }) {
  const budget = pictureBudget(usedChars);
  const percent = Math.round(budget.fraction * 100);
  const nearlyFull = budget.fraction >= 0.85;

  return (
    <section
      aria-labelledby="picture-guide-title"
      className="mt-3 rounded-xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <h3 id="picture-guide-title" className="flex items-center gap-2 font-semibold">
        <ImagePlus className="size-4" aria-hidden="true" />
        Add your own pictures
      </h3>
      <p className="mt-1 text-slate-600 dark:text-slate-400">
        Drag an image from your computer onto the website above, or use the Add image button on any area. Pictures
        are resized and compressed for you, so you can use ordinary photos.
      </p>

      <dl className="mt-3 grid gap-x-4 gap-y-1.5 sm:grid-cols-[auto_auto_1fr]">
        {ROWS.map((row) => (
          <div key={row.label} className="contents">
            <dt className="font-medium">{row.label}</dt>
            <dd className="font-mono text-xs leading-6">{row.size}</dd>
            <dd className="text-slate-600 dark:text-slate-400">{row.note}</dd>
          </div>
        ))}
      </dl>

      <ul className="mt-3 grid gap-1 text-slate-600 dark:text-slate-400">
        <li>Formats: {ACCEPTED_FORMATS_LABEL}. SVG and GIF are not accepted.</li>
        <li>Files up to {formatBytes(MAX_UPLOAD_BYTES)} can be uploaded.</li>
        <li>Any size or shape works. Each picture is automatically cropped to fit its area, keeping the most interesting part, and shrunk to the size above, so you never need to resize it first.</li>
        <li>Pictures are never stretched. A picture smaller than the size above is kept as it is and you are told if it may look soft.</li>
        <li>Photos are saved without location data (EXIF).</li>
      </ul>

      <div className="mt-3">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="picture-budget" className="font-medium">
            Picture space used
          </label>
          <span className={nearlyFull ? "font-semibold text-amber-700 dark:text-amber-300" : ""}>
            {budget.used} of {budget.total}
            {galleryCount > 0 ? ` · ${galleryCount} of ${MAX_GALLERY_IMAGES} gallery pictures` : ""}
          </span>
        </div>
        <meter
          id="picture-budget"
          min={0}
          max={100}
          low={70}
          high={85}
          optimum={0}
          value={percent}
          aria-valuetext={`${budget.used} of ${budget.total} used`}
          className="mt-1.5 block h-2.5 w-full"
        />
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
          All pictures in the website share this space, which keeps the finished page quick to load.
        </p>
      </div>
    </section>
  );
}
