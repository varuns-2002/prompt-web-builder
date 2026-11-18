"use client";

import * as Label from "@radix-ui/react-label";
import { Play } from "lucide-react";
import type { ReactNode } from "react";
import {
  type AnimationStyle,
  type CardStyle,
  type HeadingFont,
  type HeroLayout,
  type IndustryId,
  type SectionKind,
  type SiteContent,
  type ThemeMode,
  type Variant,
} from "@/lib/types";
import { ColorEditor } from "./ColorEditor";
import { ImageEditor } from "./ImageEditor";
import { SectionList } from "./SectionList";

const inputClass =
  "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100";

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div>
      <Label.Root htmlFor={id} className="text-sm font-medium">
        {label}
      </Label.Root>
      {children}
    </div>
  );
}

interface EditorProps {
  variant: Variant;
  content: SiteContent;
  textIndustry: IndustryId;
  onContent: (patch: Partial<SiteContent>) => void;
  onVariant: (patch: Partial<Variant>, field: string) => void;
  onSections: (next: SectionKind[]) => void;
  onRewriteText: (industry: IndustryId) => void;
  onReplay: () => void;
}

export function Editor({
  variant,
  content,
  textIndustry,
  onContent,
  onVariant,
  onSections,
  onRewriteText,
  onReplay,
}: EditorProps) {
  return (
    <div className="grid gap-4">
      <p className="text-xs text-slate-600 dark:text-slate-400">
        You can also click any text in the website preview to edit it there, including card titles, prices and reviews.
      </p>
      <Field id="brand" label="Brand name">
        <input
          id="brand"
          className={inputClass}
          value={content.brand}
          maxLength={60}
          onChange={(e) => onContent({ brand: e.target.value })}
        />
      </Field>
      <Field id="headline" label="Headline">
        <input
          id="headline"
          className={inputClass}
          value={content.headline}
          maxLength={120}
          onChange={(e) => onContent({ headline: e.target.value })}
        />
      </Field>
      <Field id="tagline" label="Tagline">
        <textarea
          id="tagline"
          className={inputClass}
          rows={3}
          value={content.tagline}
          maxLength={240}
          onChange={(e) => onContent({ tagline: e.target.value })}
        />
      </Field>
      <Field id="cta" label="Button text">
        <input
          id="cta"
          className={inputClass}
          value={content.ctaLabel}
          maxLength={40}
          onChange={(e) => onContent({ ctaLabel: e.target.value })}
        />
      </Field>
      <Field id="about" label="About text">
        <textarea
          id="about"
          className={inputClass}
          rows={4}
          value={content.about}
          maxLength={600}
          onChange={(e) => onContent({ about: e.target.value })}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field id="mode" label="Theme">
          <select
            id="mode"
            className={inputClass}
            value={variant.mode}
            onChange={(e) => onVariant({ mode: e.target.value as ThemeMode }, "mode")}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </Field>
        <Field id="hero-layout" label="Hero layout">
          <select
            id="hero-layout"
            className={inputClass}
            value={variant.heroLayout}
            onChange={(e) => onVariant({ heroLayout: e.target.value as HeroLayout }, "heroLayout")}
          >
            <option value="centered">Centered</option>
            <option value="split">Split</option>
            <option value="banner">Banner</option>
          </select>
        </Field>
        <Field id="card-style" label="Card style">
          <select
            id="card-style"
            className={inputClass}
            value={variant.cardStyle}
            onChange={(e) => onVariant({ cardStyle: e.target.value as CardStyle }, "cardStyle")}
          >
            <option value="outlined">Outlined</option>
            <option value="elevated">Elevated</option>
            <option value="soft">Soft</option>
          </select>
        </Field>
        <Field id="heading-font" label="Heading font">
          <select
            id="heading-font"
            className={inputClass}
            value={variant.headingFont}
            onChange={(e) => onVariant({ headingFont: e.target.value as HeadingFont }, "headingFont")}
          >
            <option value="sans">Sans-serif</option>
            <option value="serif">Serif</option>
          </select>
        </Field>
      </div>

      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium">Animation</legend>
        <select
          id="animation"
          aria-label="Animation style"
          className={inputClass}
          value={variant.animation ?? "subtle"}
          onChange={(e) => onVariant({ animation: e.target.value as AnimationStyle }, "animation")}
        >
          <option value="none">None</option>
          <option value="subtle">Subtle (fade in, gentle hover)</option>
          <option value="lively">Lively (bigger motion, progress bar)</option>
        </select>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          The hero animates in and sections fade in as visitors scroll. Visitors who turn on “reduce motion” in their
          device settings see no animation.
        </p>
        <button
          type="button"
          onClick={onReplay}
          disabled={(variant.animation ?? "subtle") === "none"}
          className="inline-flex items-center gap-2 justify-self-start rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-indigo-600 disabled:opacity-50 dark:border-slate-600 dark:hover:bg-slate-800"
        >
          <Play className="size-4" aria-hidden="true" />
          Replay animations
        </button>
      </fieldset>

      <ImageEditor variant={variant} onVariant={onVariant} textIndustry={textIndustry} onRewriteText={onRewriteText} />

      <ColorEditor variant={variant} onVariant={onVariant} />

      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          className="mt-0.5 size-4 accent-indigo-600"
          checked={variant.visitorColors !== false}
          onChange={(e) => onVariant({ visitorColors: e.target.checked }, "visitorColors")}
        />
        <span>
          <span className="font-medium">Let visitors change the site&apos;s color</span>
          <span className="block text-xs text-slate-600 dark:text-slate-400">
            Adds a “Colors” button to the website so each visitor can pick their own accent color.
          </span>
        </span>
      </label>

      <SectionList sections={variant.sections} content={content} onChange={onSections} />
    </div>
  );
}
