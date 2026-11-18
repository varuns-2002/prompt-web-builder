"use client";

import { ArrowDown, ArrowUp, EyeOff, GripVertical, Plus } from "lucide-react";
import { useState } from "react";
import { hideSection, isBodySection, labelOf, moveSection, placeSection, showSection } from "@/lib/site/edits";
import { SECTION_KINDS, type BodySectionKind, type SectionKind, type SiteContent } from "@/lib/types";

const iconButton =
  "inline-flex size-8 items-center justify-center rounded-md text-slate-700 hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-indigo-600 disabled:opacity-30 dark:text-slate-300 dark:hover:bg-slate-700";

/**
 * The sections of the website, in page order. Drag a row by its handle, or use
 * the arrow buttons, to change the order. The hero always stays first.
 */
export function SectionList({
  sections,
  content,
  onChange,
}: {
  sections: SectionKind[];
  content: SiteContent;
  onChange: (next: SectionKind[]) => void;
}) {
  const [dragging, setDragging] = useState<BodySectionKind | null>(null);
  const [over, setOver] = useState<number | null>(null);

  const body = sections.filter((s): s is BodySectionKind => isBodySection(s));
  const missing = SECTION_KINDS.filter((k): k is BodySectionKind => isBodySection(k) && !sections.includes(k));
  const name = (kind: BodySectionKind) => labelOf(content, kind).title;

  function endDrag() {
    setDragging(null);
    setOver(null);
  }

  return (
    <fieldset>
      <legend className="text-sm font-medium">Sections</legend>
      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
        Drag a section by its handle, or use the arrows, to change the order on the page.
      </p>

      <ol className="mt-2 grid gap-1.5">
        <li className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm dark:bg-slate-800">
          <span className="size-4 shrink-0" aria-hidden="true" />
          <span className="font-medium">Hero</span>
          <span className="text-xs text-slate-600 dark:text-slate-400">always first</span>
        </li>
        {body.map((kind, index) => (
          <li
            key={kind}
            draggable
            onDragStart={(event) => {
              setDragging(kind);
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("text/plain", kind);
            }}
            onDragOver={(event) => {
              if (!dragging) return;
              event.preventDefault();
              setOver(index);
            }}
            onDrop={(event) => {
              event.preventDefault();
              if (dragging && dragging !== kind) onChange(placeSection(sections, dragging, index));
              endDrag();
            }}
            onDragEnd={endDrag}
            className={`flex items-center gap-1 rounded-lg border px-2 py-1.5 text-sm ${
              over === index && dragging && dragging !== kind
                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950"
                : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
            } ${dragging === kind ? "opacity-50" : ""}`}
          >
            <GripVertical className="size-4 shrink-0 cursor-grab text-slate-500" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate font-medium">{name(kind)}</span>
            <button
              type="button"
              className={iconButton}
              aria-label={`Move ${name(kind)} up`}
              disabled={index === 0}
              onClick={() => onChange(moveSection(sections, kind, -1))}
            >
              <ArrowUp className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              className={iconButton}
              aria-label={`Move ${name(kind)} down`}
              disabled={index === body.length - 1}
              onClick={() => onChange(moveSection(sections, kind, 1))}
            >
              <ArrowDown className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              className={iconButton}
              aria-label={`Hide ${name(kind)}`}
              title="Hide this section"
              onClick={() => onChange(hideSection(sections, kind))}
            >
              <EyeOff className="size-4" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ol>

      {missing.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-slate-600 dark:text-slate-400">Add a section</p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {missing.map((kind) => (
              <button
                key={kind}
                type="button"
                onClick={() => onChange(showSection(sections, kind))}
                className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-3 py-1 text-xs font-medium hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-indigo-600 dark:border-slate-600 dark:hover:bg-slate-800"
              >
                <Plus className="size-3" aria-hidden="true" />
                {name(kind)}
              </button>
            ))}
          </div>
        </div>
      )}
    </fieldset>
  );
}
