"use client";

import { ImagePlus, PenLine, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { PHOTO_ACCEPT, PhotoError, photoToDataUrl } from "@/lib/image";
import { describeFit } from "@/lib/fit-message";
import { INDUSTRY_LABELS } from "@/lib/scenes";
import { ACCEPTED_FORMATS_LABEL, MAX_UPLOAD_BYTES, formatBytes, pictureTarget, sizeLabel } from "@/lib/site/limits";
import { IMAGE_MODES, INDUSTRIES, type ImageMode, type IndustryId, type Variant } from "@/lib/types";

const MODE_LABELS: Record<ImageMode, string> = {
  scene: "Industry illustration",
  photo: "My own photo",
  none: "No hero image",
};

const selectClass =
  "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100";

export function ImageEditor({
  variant,
  onVariant,
  textIndustry,
  onRewriteText,
}: {
  variant: Variant;
  onVariant: (patch: Partial<Variant>, field: string) => void;
  /** The industry the website text is currently written for. */
  textIndustry: IndustryId;
  onRewriteText: (industry: IndustryId) => void;
}) {
  const mode: ImageMode = variant.imageMode ?? "scene";
  const industry: IndustryId = variant.industry ?? "business";
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fitNote, setFitNote] = useState<{ tone: "info" | "warn"; text: string } | null>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    setFitNote(null);
    try {
      const target = pictureTarget("hero");
      const fitted = await photoToDataUrl(file, target);
      onVariant({ photo: fitted.url, imageMode: "photo" }, "image");
      setFitNote(describeFit([file], [fitted], target.width));
    } catch (e) {
      setError(e instanceof PhotoError ? e.message : "Could not use that image.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <fieldset className="grid gap-3">
      <legend className="text-sm font-medium">Hero image</legend>

      <div>
        <label htmlFor="image-mode" className="text-xs text-slate-600 dark:text-slate-400">
          Show
        </label>
        <select
          id="image-mode"
          className={selectClass}
          value={mode}
          onChange={(e) => onVariant({ imageMode: e.target.value as ImageMode }, "image")}
        >
          {IMAGE_MODES.map((m) => (
            <option key={m} value={m}>
              {MODE_LABELS[m]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="industry" className="text-xs text-slate-600 dark:text-slate-400">
          Industry
        </label>
        <select
          id="industry"
          className={selectClass}
          value={industry}
          onChange={(e) => onVariant({ industry: e.target.value as IndustryId }, "industry")}
        >
          {INDUSTRIES.map((id) => (
            <option key={id} value={id}>
              {INDUSTRY_LABELS[id]}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
          Sets the illustration. The website text is currently written for{" "}
          <strong className="font-semibold">{INDUSTRY_LABELS[textIndustry]}</strong>.
        </p>
        {industry !== textIndustry && (
          <button
            type="button"
            onClick={() => onRewriteText(industry)}
            className="mt-2 inline-flex items-center gap-2 rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-900 hover:bg-indigo-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-100 dark:hover:bg-indigo-900"
          >
            <PenLine className="size-4" aria-hidden="true" />
            Rewrite the text for {INDUSTRY_LABELS[industry]}
          </button>
        )}
      </div>

      {mode === "photo" && (
        <div className="grid gap-2">
          <input
            ref={input}
            id="photo-file"
            type="file"
            accept={PHOTO_ACCEPT}
            className="sr-only"
            onChange={(e) => void onFile(e.target.files?.[0])}
          />
          <div className="flex flex-wrap gap-2">
            <label
              htmlFor="photo-file"
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-100 has-[:focus-visible]:outline-2 dark:border-slate-600 dark:hover:bg-slate-800"
            >
              <ImagePlus className="size-4" aria-hidden="true" />
              {busy ? "Processing…" : variant.photo ? "Replace photo" : "Choose a photo"}
            </label>
            {variant.photo && (
              <button
                type="button"
                onClick={() => onVariant({ photo: undefined, imageMode: "scene" }, "image")}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-indigo-600 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Trash2 className="size-4" aria-hidden="true" />
                Remove
              </button>
            )}
          </div>
          <p aria-live="polite" className="text-xs text-slate-600 dark:text-slate-400">
            {variant.photo
              ? "Photo added. It is cropped to fit, shrunk and its location data is removed."
              : "No photo yet, so the illustration is shown until you choose one."}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Any size works. The photo is automatically cropped to a wide {sizeLabel("hero")} shape, keeping the most
            interesting part, so you never have to resize it yourself. {ACCEPTED_FORMATS_LABEL}, up to{" "}
            {formatBytes(MAX_UPLOAD_BYTES)}.
          </p>
          {fitNote && (
            <p
              role="status"
              className={`rounded-lg p-2 text-xs ${
                fitNote.tone === "warn"
                  ? "bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
                  : "bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
              }`}
            >
              {fitNote.text}
            </p>
          )}
          {error && (
            <p role="alert" className="text-sm font-medium text-red-700 dark:text-red-400">
              {error}
            </p>
          )}
        </div>
      )}
    </fieldset>
  );
}
