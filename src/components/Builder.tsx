"use client";

import * as Tabs from "@radix-ui/react-tabs";
import {
  Download,
  ExternalLink,
  FileCode,
  Globe,
  Monitor,
  Pencil,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { buildContent } from "@/lib/content";
import { isValidEmail } from "@/lib/email";
import { feedbackPromptKey, findPromptRating, getBrowserFeedbackStore, getFeedbackSessionId } from "@/lib/feedback";
import { PhotoError, photoToDataUrl, type FittedPicture } from "@/lib/image";
import { describeFit } from "@/lib/fit-message";
import { retargetIndustry } from "@/lib/industry-content";
import { createSingleHtml, createSiteZip, downloadFile, slugify } from "@/lib/site/download";
import {
  addItem,
  applyTextEdit,
  hideSection,
  moveItem,
  moveSection,
  parseAction,
  parseEditPath,
  removeItem,
  type EditOutcome,
} from "@/lib/site/edits";
import { MAX_ITEMS, parseSlot, pictureTarget } from "@/lib/site/limits";
import { generateEditorFile } from "@/lib/site/render";
import { imageChars, removeSlotImage, setSlotImages, withoutPictures } from "@/lib/site/slots";
import { PictureGuide } from "./PictureGuide";
import {
  checkAccessibility,
  generateVariants,
  paletteName,
  variantFeatures,
} from "@/lib/generator";
import { interpretPrompt } from "@/lib/interpreter";
import { TEMPLATE_GROUPS } from "@/lib/template-starters";
import { rankVariants } from "@/lib/ranker";
import { INDUSTRIES } from "@/lib/types";
import type {
  ContentItem,
  FeedbackAction,
  IndustryId,
  SectionKind,
  SiteContent,
  SiteSpec,
  Variant,
  VariantKind,
} from "@/lib/types";
import { Editor } from "./Editor";
import { LiveSiteFrame } from "./preview/LiveSiteFrame";
import { INDUSTRY_LABELS } from "@/lib/scenes";
import { ScaledPreview } from "./preview/ScaledPreview";

const EXAMPLES = [
  "A modern dark portfolio for a React developer with projects and a contact form",
  "An elegant cafe website called Olive & Thyme with a menu and reviews",
  "A bold SaaS landing page for remote teams with pricing and testimonials",
  "A minimal green blog for writers about travel",
];

interface Result {
  spec: SiteSpec;
  variants: Variant[];
  content: SiteContent;
}

const store = getBrowserFeedbackStore();

export function Builder() {
  const [prompt, setPrompt] = useState(EXAMPLES[0]);
  const [error, setError] = useState<string | null>(null);
  const [contactEmailError, setContactEmailError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [selectedId, setSelectedId] = useState<VariantKind | null>(null);
  const [device, setDevice] = useState("desktop");
  const [rating, setRating] = useState(0);
  const [publishing, setPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: "info" | "warn"; text: string } | null>(null);
  const [replayKey, setReplayKey] = useState(0);

  const selected = result?.variants.find((v) => v.id === selectedId) ?? null;
  const content = result?.content;
  // Cards show the real generated site, scaled down, so they always match the final result.
  // They are static, so the script is dropped (the frames are sandboxed without scripts anyway)
  // and pictures other than the hero photo are left out to keep three copies of the page light.
  const thumbnails = useMemo(() => {
    const map = {} as Record<VariantKind, string>;
    if (result) {
      const light = withoutPictures(result.content);
      for (const v of result.variants) {
        map[v.id] = createSingleHtml(v, light).replace(/<script>[\s\S]*?<\/script>/, "");
      }
    }
    return map;
  }, [result]);
  // The editing preview adds drop targets and Add/Replace/Remove buttons.
  const previewHtml = useMemo(
    () => (selected && content ? generateEditorFile(selected, content) : ""),
    [selected, content],
  );

  // Handlers read the latest state from here, because they can run after a render (dropped pictures
  // are processed asynchronously) or from the preview frame.
  const latest = useRef({ result, selectedId });
  useEffect(() => {
    latest.current = { result, selectedId };
  });

  function clearPublished() {
    setPublishedUrl(null);
    setPublishError(null);
  }

  /** Every change to the website goes through here. */
  function commit(next: Result) {
    latest.current = { ...latest.current, result: next };
    setResult(next);
    clearPublished();
  }
  /** Applies text typed in the preview. Tells the preview whether it must reload. */
  function editText(path: string, value: string): EditOutcome {
    const current = latest.current.result;
    const target = parseEditPath(path);
    if (!current || !target) return "rejected";
    const edit = applyTextEdit(current.content, target, value);
    if (!edit.ok) {
      setNotice({ tone: "warn", text: edit.error });
      return "rejected";
    }
    if (edit.outcome === "unchanged") return "unchanged";
    commit({ ...current, content: edit.content });
    setNotice(null);
    return edit.outcome;
  }

  function updateContent(patch: Partial<SiteContent>) {
    const current = latest.current.result;
    if (!current) return;
    commit({ ...current, content: { ...current.content, ...patch } });
  }

  const contactEmail = result?.content.contactEmail ?? "";
  const invalidContactEmail = contactEmail.trim() !== "" && !isValidEmail(contactEmail.trim());

  /** Changes which sections the selected design shows, and their order. */
  function setSections(sections: SectionKind[]) {
    const { result: current, selectedId: id } = latest.current;
    const base = current?.variants.find((v) => v.id === id);
    if (!current || !base) return;
    const next = { ...base, sections };
    commit({ ...current, variants: current.variants.map((v) => (v.id === id ? next : v)) });
    record("edit", next, { field: "sections" });
  }

  /** Card and section buttons in the preview. */
  function runAction(raw: string) {
    const action = parseAction(raw);
    const { result: current, selectedId: id } = latest.current;
    const variant = current?.variants.find((v) => v.id === id);
    if (!action || !current || !variant) return;

    if ("section" in action) {
      if (action.kind === "section-hide") {
        setSections(hideSection(variant.sections, action.section));
        setNotice({ tone: "info", text: "Section hidden. Add it back from the Sections list in the sidebar." });
      } else {
        setSections(moveSection(variant.sections, action.section, action.kind === "section-up" ? -1 : 1));
      }
      return;
    }

    if (action.kind === "add") {
      const content = addItem(current.content, action.list);
      if (!content) {
        setNotice({ tone: "warn", text: `You can have up to ${MAX_ITEMS} cards in one section.` });
        return;
      }
      setNotice(null);
      commit({ ...current, content });
    } else if (action.kind === "remove") {
      const content = removeItem(current.content, action.list, action.index);
      if (!content) return;
      commit({ ...current, content });
      setNotice({ tone: "info", text: "Card deleted." });
    } else {
      const content = moveItem(current.content, action.list, action.index, action.kind === "earlier" ? -1 : 1);
      if (content) commit({ ...current, content });
    }
  }

  async function addPictures(slotId: string, files: File[]) {
    const slot = parseSlot(slotId);
    if (!slot || !latest.current.result || !latest.current.selectedId) return;
    setNotice(null);

    let fitted: FittedPicture[];
    try {
      const target = pictureTarget(slot.kind);
      fitted = await Promise.all(files.map((file) => photoToDataUrl(file, target)));
    } catch (e) {
      setNotice({
        tone: "warn",
        text: e instanceof PhotoError ? e.message : "Could not add that picture.",
      });
      return;
    }
    const urls = fitted.map((picture) => picture.url);

    const { result: current, selectedId: id } = latest.current;
    if (!current || !id) return;
    const next = setSlotImages({ variants: current.variants, content: current.content }, id, slot, urls);
    const changed = next.variants !== current.variants || next.content !== current.content;
    commit({ ...current, variants: next.variants, content: next.content });
    if (next.notice) {
      setNotice({ tone: "warn", text: next.notice });
    } else if (changed) {
      setNotice(describeFit(files, fitted, pictureTarget(slot.kind).width));
    }
    clearPublished();
    const edited = next.variants.find((v) => v.id === id);
    if (edited) record("edit", edited, { field: "image" });
  }

  /**
   * Rewrites all the website text for another industry. Pictures, and a brand
   * name the user typed or gave in the prompt, are kept.
   */
  function rewriteText(industry: IndustryId) {
    const { result: current, selectedId: id } = latest.current;
    if (!current || !id) return;
    const spec = retargetIndustry(current.spec, industry);
    const fresh = buildContent(spec);
    const old = current.content;
    const brandEdited = old.brand !== current.spec.brand;
    // Cards keep the picture that was on the card in the same position.
    const keepPictures = (items: ContentItem[], before: ContentItem[]) =>
      items.map((item, index) => (before[index]?.image ? { ...item, image: before[index].image } : item));
    const content: SiteContent = {
      ...fresh,
      brand: brandEdited ? old.brand : fresh.brand,
      features: keepPictures(fresh.features, old.features),
      projects: keepPictures(fresh.projects, old.projects),
      menu: keepPictures(fresh.menu, old.menu),
      posts: keepPictures(fresh.posts, old.posts),
      aboutImage: old.aboutImage,
      gallery: old.gallery,
    };
    commit({
      ...current,
      spec,
      content,
      variants: current.variants.map((v) => ({ ...v, industry })),
    });
    setNotice({
      tone: "info",
      text: `Rewrote the website text for ${INDUSTRY_LABELS[industry]}. Your pictures were kept.`,
    });
    const edited = current.variants.find((v) => v.id === id);
    if (edited) record("edit", { ...edited, industry }, { field: "industry" });
  }

  function removePicture(slotId: string) {
    const slot = parseSlot(slotId);
    const { result: current, selectedId: id } = latest.current;
    if (!slot || !current || !id) return;
    const next = removeSlotImage({ variants: current.variants, content: current.content }, id, slot);
    commit({ ...current, variants: next.variants, content: next.content });
    setNotice(null);
  }

  function record(action: FeedbackAction, variant: Variant, extra: { rating?: number; field?: string } = {}) {
    if (!result) return;
    store.record({
      action,
      siteType: result.spec.type,
      tone: result.spec.tone,
      features: variantFeatures(variant),
      ...(action === "rate" ? { sessionId: getFeedbackSessionId(), promptKey: feedbackPromptKey(result.spec.prompt) } : {}),
      ...extra,
    });
  }

  function generate() {
    if (prompt.trim().length < 3) {
      setError("Describe the website you want, for example “a dark portfolio for a photographer”.");
      return;
    }
    setError(null);
    setNotice(null);
    if (result && selected) record("regenerate", selected);

    const spec = interpretPrompt(prompt);
    const ranked = rankVariants(generateVariants(spec), spec, store.list());
    const variants = ranked.map((r) => r.variant);
    const next: Result = { spec, variants, content: buildContent(spec) };
    if (result) {
      commit(next);
      setNotice({ tone: "info", text: "Made a new website from your description." });
    } else {
      latest.current = { result: next, selectedId: variants[0].id };
      setResult(next);
    }
    latest.current = { ...latest.current, selectedId: variants[0].id };
    setSelectedId(variants[0].id);
    setRating(findPromptRating(store.list(), getFeedbackSessionId(), spec.prompt)?.rating ?? 0);
    clearPublished();
  }

  function select(variant: Variant) {
    setSelectedId(variant.id);
    clearPublished();
    record("select", variant);
  }

  function updateVariant(patch: Partial<Variant>, field: string) {
    const { result: current, selectedId: id } = latest.current;
    const base = current?.variants.find((v) => v.id === id);
    if (!current || !base) return;
    const next = { ...base, ...patch };
    commit({ ...current, variants: current.variants.map((v) => (v.id === id ? next : v)) });
    // Free-form colors fire on every drag and are not a learnable design feature.
    if (field !== "colors") record("edit", next, { field });
  }

  function rate(value: number) {
    if (!selected) return;
    setRating(value);
    record("rate", selected, { rating: value });
  }

  function exportSpec() {
    if (!result || !selected) return;
    const payload = {
      exportedAt: new Date().toISOString(),
      spec: result.spec,
      // The embedded photo is large and private, so the spec only notes that one exists.
      variant: selected.photo ? { ...selected, photo: "(embedded photo omitted)" } : selected,
      content: withoutPictures(result.content),
    };
    downloadFile("website-spec.json", JSON.stringify(payload, null, 2), "application/json");
    record("export", selected, { field: "spec" });
  }

  function downloadZip() {
    if (!result || !selected) return;
    const zip = createSiteZip(selected, result.content);
    downloadFile(`${slugify(result.content.brand)}.zip`, zip as BlobPart, "application/zip");
    record("export", selected, { field: "zip" });
  }

  function downloadHtml() {
    if (!result || !selected) return;
    downloadFile(
      `${slugify(result.content.brand)}.html`,
      createSingleHtml(selected, result.content),
      "text/html",
    );
    record("export", selected, { field: "html" });
  }

  async function publish() {
    if (!result || !selected) return;
    setPublishing(true);
    setPublishError(null);
    // Opened synchronously so the browser treats it as a direct click.
    const tab = window.open("", "_blank");
    try {
      const response = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variant: selected, content: result.content }),
      });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        throw new Error(data.error ?? "Could not publish the website.");
      }
      setPublishedUrl(data.url);
      record("export", selected, { field: "publish" });
      if (tab) tab.location.href = data.url;
    } catch (error) {
      tab?.close();
      setPublishError(error instanceof Error ? error.message : "Could not publish the website.");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="builder-dashboard flex min-h-screen flex-col text-slate-900 dark:text-slate-100">
      <a href="#builder-main" className="sr-only z-50 rounded-lg bg-indigo-600 p-3 text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-4">
        Skip to website builder
      </a>
      <header className="border-b border-slate-200/80 bg-white/90 dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
            <Sparkles className="size-6" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-lg font-bold leading-tight">Prompt Web Builder</h1>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              Your ideas. Ready for the web.
            </p>
          </div>
          </div>
          <span className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 sm:inline-flex dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
            <span className="size-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" aria-hidden="true" />
            Built locally. No LLM API.
          </span>
        </div>
      </header>

      <main id="builder-main" tabIndex={-1} className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 gap-8 px-4 py-8 sm:px-6 sm:py-12">
        <section aria-labelledby="studio-heading" className="grid items-end gap-6 lg:grid-cols-[1fr_auto]">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-bold tracking-[0.18em] text-indigo-700 uppercase dark:text-indigo-300">Your website studio</p>
            <h2 id="studio-heading" className="text-3xl font-bold tracking-tight sm:text-5xl sm:leading-tight">
              Turn a little idea into<br className="hidden sm:block" /> your next <span className="text-indigo-600 dark:text-indigo-400">great website.</span>
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600 dark:text-slate-400">
              Describe what you have in mind. Compare three designs, make one your own, and take it live.
            </p>
          </div>
          <ol aria-label="Building your website" className="flex flex-wrap gap-3 text-xs font-medium text-slate-600 dark:text-slate-300">
            {["Describe", "Customize", "Publish"].map((step, index) => (
              <li key={step} className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                <span className="flex size-5 items-center justify-center rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">{index + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="prompt-heading" className="studio-panel prompt-panel rounded-3xl border border-slate-200 bg-white p-5 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300"><Pencil className="size-5" aria-hidden="true" /></span>
            <div>
          <h2 id="prompt-heading" className="text-lg font-semibold">
            What would you like to create?
          </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Start with a template or describe a website in your own words.</p>
            </div>
          </div>
          <form
            className="grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              generate();
            }}
          >
            <label htmlFor="template-starter" className="text-sm font-medium">
              Start with an industry template
            </label>
            <select
              id="template-starter"
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  setPrompt(e.target.value);
                  setError(null);
                }
              }}
              aria-describedby="template-help"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
            >
              <option value="">Choose a template to fill your prompt</option>
              {TEMPLATE_GROUPS.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.starters.map((starter) => (
                    <option key={starter.industry} value={starter.prompt}>{starter.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            <p id="template-help" className="text-xs text-slate-600 dark:text-slate-400">
              Choose a starter, edit the description below, then generate. These are showcase websites with enquiries, not live booking, payments, course delivery or working AI tools.
            </p>
            <label htmlFor="prompt" className="mt-3 text-sm font-medium">
              Website description
            </label>
            <textarea
              id="prompt"
              rows={4}
              maxLength={500}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "prompt-error" : undefined}
              className="w-full resize-y rounded-2xl border border-slate-300 bg-slate-50/70 px-4 py-4 text-base leading-relaxed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:border-slate-600 dark:bg-slate-950"
            />
            {error && (
              <p id="prompt-error" role="alert" className="text-sm font-medium text-red-700 dark:text-red-400">
                {error}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="submit"
                className="studio-primary inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                {result ? <RotateCcw className="size-4" aria-hidden="true" /> : <Sparkles className="size-4" aria-hidden="true" />}
                {result ? "Regenerate" : "Generate website"}
              </button>
              <span className="text-sm text-slate-600 dark:text-slate-400">Try:</span>
              {EXAMPLES.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setPrompt(example)}
                  className="max-w-xs truncate rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-indigo-600 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                  title={example}
                >
                  {example}
                </button>
              ))}
            </div>
          </form>
        </section>

        {!result && (
          <section aria-labelledby="possibilities-heading" className="grid gap-4">
            <h2 id="possibilities-heading" className="text-sm font-semibold text-slate-600 dark:text-slate-400">Everything you need to make it yours</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { Icon: Sparkles, title: "A starting point that fits", body: `${INDUSTRIES.length} industry choices with relevant copy, colours and illustrations.` },
                { Icon: Pencil, title: "Your style, every detail", body: "Edit text in the preview. Add pictures, choose colours and rearrange sections." },
                { Icon: Globe, title: "Ready to share", body: "Publish locally or download your website as a ZIP or a single HTML file." },
              ].map(({ Icon, title, body }) => (
                <article key={title} className="rounded-2xl border border-slate-200/80 bg-white/70 p-5 dark:border-slate-800 dark:bg-slate-900/70">
                  <Icon className="mb-4 size-5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                  <h3 className="text-sm font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{body}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {result && selected && (
          <>
            <section aria-labelledby="interp-heading" className="studio-panel grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <h2 id="interp-heading" className="text-base font-semibold">
                How your prompt was interpreted
              </h2>
              <ul className="flex flex-wrap gap-2 text-sm" aria-label="Interpreted requirements">
                {[
                  `Type: ${result.spec.type}`,
                  `Tone: ${result.spec.tone}`,
                  `Theme: ${result.spec.mode}`,
                  result.spec.audience ? `Audience: ${result.spec.audience}` : null,
                  `Imagery: ${INDUSTRY_LABELS[result.spec.industry]}`,
                  `Sections: ${result.spec.sections.join(", ")}`,
                ]
                  .filter(Boolean)
                  .map((chip) => (
                    <li key={chip} className="rounded-full bg-indigo-100 px-3 py-1 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200">
                      {chip}
                    </li>
                  ))}
              </ul>
              {result.spec.corrections && result.spec.corrections.length > 0 && (
                <p role="note" className="text-sm text-slate-600 dark:text-slate-400">
                  Fixed spelling:{" "}
                  {result.spec.corrections.map((c, index) => (
                    <span key={c.from}>
                      {index > 0 ? ", " : ""}
                      <span className="line-through">{c.from}</span> → <strong className="font-semibold">{c.to}</strong>
                    </span>
                  ))}
                  . If that is not what you meant, change your description and press Regenerate.
                </p>
              )}
              {result.spec.industry === "business" && (
                <p role="note" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                  I could not tell which industry this website is for, so the text is general. Choose your industry
                  under <strong className="font-semibold">Hero image → Industry</strong> below, then press{" "}
                  <strong className="font-semibold">Rewrite the text</strong>, and the headline, sections and sample
                  content will match it.
                </p>
              )}
            </section>

            <section aria-labelledby="variants-heading" className="grid grid-cols-1 gap-3">
              <h2 id="variants-heading" className="text-base font-semibold">
                Choose a design
              </h2>
              <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {result.variants.map((variant, index) => {
                  const active = variant.id === selected.id;
                  return (
                    <li key={variant.id} className="min-w-0">
                      <button
                        type="button"
                        aria-pressed={active}
                        onClick={() => select(variant)}
                        className={`design-choice block h-full w-full overflow-hidden rounded-2xl border-2 bg-white text-left shadow-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-slate-900 ${
                          active
                            ? "border-indigo-600"
                            : "border-slate-200 hover:border-slate-400 dark:border-slate-800 dark:hover:border-slate-600"
                        }`}
                      >
                        <ScaledPreview height={230}>
                          <iframe
                            title=""
                            srcDoc={thumbnails[variant.id]}
                            sandbox=""
                            scrolling="no"
                            tabIndex={-1}
                            className="block border-0 bg-white"
                            style={{ width: 1200, height: 800 }}
                          />
                        </ScaledPreview>
                        <span className="block border-t border-slate-200 p-4 dark:border-slate-800">
                          <span className="flex items-center justify-between gap-2">
                            <span className="font-semibold">{variant.label}</span>
                            {index === 0 && (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
                                Top pick
                              </span>
                            )}
                          </span>
                          <span className="mt-1 block text-sm text-slate-600 dark:text-slate-400">
                            {variant.description}
                          </span>
                          <span className="mt-2 block text-xs text-slate-600 dark:text-slate-400">
                            {paletteName(variant)} · {variant.mode} · {variant.heroLayout} hero
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section aria-labelledby="editor-heading" className="grid gap-6 lg:grid-cols-[22rem_1fr]">
              <div className="studio-panel grid min-w-0 content-start gap-5 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <h2 id="editor-heading" className="text-base font-semibold">
                  Customize “{selected.label}”
                </h2>
                <Editor
                  variant={selected}
                  content={result.content}
                  textIndustry={result.spec.industry}
                  onContent={updateContent}
                  onVariant={updateVariant}
                  onSections={setSections}
                  onRewriteText={rewriteText}
                  onReplay={() => setReplayKey((key) => key + 1)}
                />

                {selected.sections.includes("contact") && (
                  <fieldset className="grid gap-2">
                    <legend className="text-sm font-semibold">Contact form email</legend>
                    <label htmlFor="contact-recipient" className="text-sm">
                      Where should visitors send their message?
                    </label>
                    <input
                      id="contact-recipient"
                      type="email"
                      maxLength={254}
                      autoComplete="email"
                      value={contactEmail}
                      onChange={(event) => {
                        const value = event.target.value;
                        updateContent({ contactEmail: value });
                        if (!value.trim() || isValidEmail(value.trim())) setContactEmailError("");
                      }}
                      onBlur={() => {
                        setContactEmailError(
                          contactEmail.trim() && !isValidEmail(contactEmail.trim())
                            ? "Enter a valid email address or leave this blank."
                            : "",
                        );
                      }}
                      aria-invalid={Boolean(contactEmailError || invalidContactEmail)}
                      aria-describedby="contact-recipient-help contact-recipient-error"
                      placeholder="you@example.com"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-indigo-600 dark:border-slate-600 dark:bg-slate-950"
                    />
                    <p id="contact-recipient-help" className="text-xs text-slate-600 dark:text-slate-400">
                      Visitors choose Gmail or their email app to open a draft addressed to you, then press Send themselves. This does not send in the background. The address is visible in the website source.
                    </p>
                    <p id="contact-recipient-error" role="status" className="text-xs text-red-700 dark:text-red-400">
                      {contactEmailError || (invalidContactEmail ? "Enter a valid email address or leave this blank." : "")}
                    </p>
                  </fieldset>
                )}

                <QualityCheck variant={selected} />

                <fieldset>
                  <legend className="text-sm font-medium">Rate this design</legend>
                  <div className="mt-2 flex gap-1">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        aria-label={`${value} out of 5`}
                        aria-pressed={rating === value}
                        onClick={() => rate(value)}
                        className="rounded p-1 focus-visible:outline-2 focus-visible:outline-indigo-600"
                      >
                        <Star
                          className={`size-6 ${value <= rating ? "fill-amber-400 text-amber-500" : "text-slate-400"}`}
                          aria-hidden="true"
                        />
                      </button>
                    ))}
                  </div>
                  <p role="status" className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                    {rating > 0
                      ? `Saved ${rating} out of 5 for this prompt. Choose another star to replace it, not add a duplicate.`
                      : "One saved rating per prompt in this tab session. You can change it at any time."}
                  </p>
                </fieldset>

                <div className="grid gap-3 border-t border-slate-200 pt-5 dark:border-slate-800">
                  <h3 className="text-base font-semibold">Get your website</h3>
                  <button
                    type="button"
                    onClick={publish}
                    disabled={publishing || invalidContactEmail}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-60"
                  >
                    <Globe className="size-4" aria-hidden="true" />
                    {publishing ? "Publishing…" : "Publish & open website"}
                  </button>
                  <div aria-live="polite">
                    {publishedUrl && (
                      <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
                        Your website is live.{" "}
                        <a
                          href={publishedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-semibold underline"
                        >
                          Open it <ExternalLink className="size-3.5" aria-hidden="true" />
                        </a>
                        <span className="mt-1 block break-all text-xs">{publishedUrl}</span>
                      </p>
                    )}
                    {publishError && (
                      <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-900 dark:bg-red-950 dark:text-red-200">
                        {publishError}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={downloadZip}
                      disabled={invalidContactEmail}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:border-slate-600 dark:hover:bg-slate-800"
                    >
                      <Download className="size-4" aria-hidden="true" />
                      Download .zip
                    </button>
                    <button
                      type="button"
                      onClick={downloadHtml}
                      disabled={invalidContactEmail}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:border-slate-600 dark:hover:bg-slate-800"
                    >
                      <FileCode className="size-4" aria-hidden="true" />
                      Single HTML
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={exportSpec}
                    disabled={invalidContactEmail}
                    className="text-left text-sm text-slate-600 underline hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-indigo-600 dark:text-slate-400 dark:hover:text-slate-100"
                  >
                    Export design spec (JSON)
                  </button>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    The contact form offers Gmail or the visitor’s email app with a draft addressed to you.
                    The visitor must review and send it; delivery is not automatic.
                  </p>
                </div>
              </div>

              <div className="min-w-0">
                <Tabs.Root value={device} onValueChange={setDevice}>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <Tabs.List aria-label="Preview size" className="inline-flex rounded-lg bg-slate-200 p-1 dark:bg-slate-800">
                      {[
                        { value: "desktop", label: "Desktop", Icon: Monitor },
                        { value: "mobile", label: "Mobile", Icon: Smartphone },
                      ].map(({ value, label, Icon }) => (
                        <Tabs.Trigger
                          key={value}
                          value={value}
                          className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-indigo-600 data-[state=active]:bg-white data-[state=active]:shadow dark:data-[state=active]:bg-slate-950"
                        >
                          <Icon className="size-4" aria-hidden="true" />
                          {label}
                        </Tabs.Trigger>
                      ))}
                    </Tabs.List>
                  </div>
                  <p className="mb-3 flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Pencil className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    <span>
                      <strong className="font-semibold">Click any text in the website to edit it.</strong> Press Enter to
                      finish or Escape to cancel. Hover a card or section for buttons to move, delete or add.
                    </span>
                  </p>
                  {(["desktop", "mobile"] as const).map((value) => (
                    <Tabs.Content key={value} value={value}>
                      <div
                        className={`overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-md dark:border-slate-700 ${
                          value === "mobile" ? "mx-auto max-w-[390px]" : ""
                        }`}
                      >
                        <div className="flex items-center gap-1.5 border-b border-slate-200 bg-slate-100 px-3 py-2 dark:border-slate-700 dark:bg-slate-800" aria-hidden="true">
                          <span className="size-2.5 rounded-full bg-rose-400" />
                          <span className="size-2.5 rounded-full bg-amber-400" />
                          <span className="size-2.5 rounded-full bg-emerald-400" />
                          <span className="ml-3 text-xs text-slate-500 dark:text-slate-400">Your website preview</span>
                        </div>
                        <LiveSiteFrame
                          html={previewHtml}
                          title={`${value === "mobile" ? "Mobile" : "Desktop"} preview of ${result.content.brand}`}
                          scrollKey={`${selected.id}|${result.spec.prompt}|${value}`}
                          onDropImages={(slot, files) => void addPictures(slot, files)}
                          onRemoveImage={removePicture}
                          onEditText={editText}
                          onAction={runAction}
                          replayKey={replayKey}
                        />
                      </div>
                    </Tabs.Content>
                  ))}
                </Tabs.Root>
                <div aria-live="polite">
                  {notice && (
                    <p
                      role="status"
                      className={`mt-3 rounded-lg p-3 text-sm ${
                        notice.tone === "warn"
                          ? "bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
                          : "bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
                      }`}
                    >
                      {notice.text}
                    </p>
                  )}
                </div>
                <PictureGuide
                  usedChars={selected && content ? imageChars(selected, content) : 0}
                  galleryCount={content?.gallery.length ?? 0}
                />
              </div>
            </section>
          </>
        )}
      </main>

      <div className="flex justify-center px-6 py-8">
            <a
              href="https://www.webquell.com/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Webquell website (opens in a new tab)"
              className="inline-block rounded text-[26px] leading-none font-bold tracking-tight text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600 hover:underline dark:text-white"
            >
              <span>Web</span><span className="text-[#7565ff]">quell</span>
            </a>
      </div>
    </div>
  );
}

function QualityCheck({ variant }: { variant: Variant }) {
  const issues = checkAccessibility(variant);
  return (
    <div
      className={`flex items-start gap-2 rounded-lg p-3 text-sm ${
        issues.length === 0
          ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
          : "bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
      }`}
    >
      <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div>
        <p className="font-medium">
          {issues.length === 0 ? "Passes color-contrast checks (WCAG AA)" : "Contrast issues found"}
        </p>
        {issues.map((issue) => (
          <p key={issue}>{issue}</p>
        ))}
      </div>
    </div>
  );
}
