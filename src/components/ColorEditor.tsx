"use client";

import { RotateCcw } from "lucide-react";
import { useState } from "react";
import { PALETTES, normalizeHex, variantTheme } from "@/lib/themes";
import { PALETTE_IDS, type CustomColors, type Variant } from "@/lib/types";

type ColorKey = keyof CustomColors;

const FIELDS: Array<{ key: ColorKey; label: string; hint: string }> = [
  { key: "accent", label: "Accent", hint: "Buttons, highlights and the hero banner" },
  { key: "bg", label: "Background", hint: "Page background" },
  { key: "text", label: "Text", hint: "Headings and body text" },
];

const inputClass =
  "block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm uppercase text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100";

function ColorField({
  id,
  label,
  hint,
  value,
  custom,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  value: string;
  custom: boolean;
  onChange: (color: string) => void;
}) {
  // Holds partially typed hex values until they become valid.
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <div>
      <label htmlFor={`${id}-hex`} className="text-sm font-medium">
        {label}
        {custom && <span className="ml-2 text-xs font-normal text-indigo-700 dark:text-indigo-300">custom</span>}
      </label>
      <p id={`${id}-hint`} className="text-xs text-slate-600 dark:text-slate-400">
        {hint}
      </p>
      <div className="mt-1 flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} color picker`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="size-10 shrink-0 cursor-pointer rounded-lg border border-slate-300 bg-transparent p-1 dark:border-slate-600"
        />
        <input
          id={`${id}-hex`}
          aria-describedby={`${id}-hint`}
          className={inputClass}
          value={draft ?? value}
          maxLength={7}
          spellCheck={false}
          autoComplete="off"
          onChange={(e) => {
            setDraft(e.target.value);
            const hex = normalizeHex(e.target.value);
            if (hex) onChange(hex);
          }}
          onBlur={() => setDraft(null)}
        />
      </div>
    </div>
  );
}

export function ColorEditor({
  variant,
  onVariant,
}: {
  variant: Variant;
  onVariant: (patch: Partial<Variant>, field: string) => void;
}) {
  const colors = variant.colors ?? {};
  const theme = variantTheme(variant, variant.mode);
  const hasCustom = Object.keys(colors).length > 0;

  function setColor(key: ColorKey, color: string) {
    onVariant({ colors: { ...colors, [key]: color } }, "colors");
  }

  function choosePreset(id: (typeof PALETTE_IDS)[number]) {
    const rest = { ...colors };
    delete rest.accent;
    onVariant({ paletteId: id, colors: Object.keys(rest).length ? rest : undefined }, "palette");
  }

  return (
    <fieldset className="grid gap-4">
      <legend className="text-sm font-medium">Colors</legend>

      <div>
        <p className="text-xs text-slate-600 dark:text-slate-400">Quick palettes</p>
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Quick palettes">
          {PALETTE_IDS.map((id) => {
            const active = !colors.accent && variant.paletteId === id;
            return (
              <button
                key={id}
                type="button"
                aria-label={PALETTES[id].name}
                aria-pressed={active}
                title={PALETTES[id].name}
                onClick={() => choosePreset(id)}
                style={{ backgroundColor: PALETTES[id].accent }}
                className={`size-8 rounded-full border-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
                  active ? "border-slate-900 ring-2 ring-white dark:border-white dark:ring-slate-900" : "border-transparent"
                }`}
              />
            );
          })}
        </div>
      </div>

      {FIELDS.map(({ key, label, hint }) => (
        <ColorField
          key={key}
          id={`color-${key}`}
          label={label}
          hint={hint}
          value={theme[key]}
          custom={Boolean(colors[key])}
          onChange={(color) => setColor(key, color)}
        />
      ))}

      <button
        type="button"
        onClick={() => onVariant({ colors: undefined }, "colors")}
        disabled={!hasCustom}
        className="inline-flex items-center gap-2 justify-self-start rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-indigo-600 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <RotateCcw className="size-4" aria-hidden="true" />
        Reset custom colors
      </button>
      <p className="text-xs text-slate-600 dark:text-slate-400">
        Button text, cards, borders and muted text adjust automatically to stay readable. Custom background and text
        apply to the {variant.mode} theme.
      </p>
    </fieldset>
  );
}
