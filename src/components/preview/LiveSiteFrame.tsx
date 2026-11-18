"use client";

import { useEffect, useRef, useState } from "react";
import type { EditOutcome } from "@/lib/site/edits";
import { MAX_GALLERY_IMAGES, parseSlot } from "@/lib/site/limits";

/**
 * Runs the generated website exactly as published, so links, menu, theme
 * toggle and form all work. `sandbox` without allow-same-origin gives the page
 * an opaque origin, isolating it from the builder's storage and DOM.
 * allow-forms is needed so the site's own submit handler (validation) runs;
 * that handler cancels the real submission, so nothing is sent anywhere.
 *
 * The frame is also where the website is edited. It reports typed text, picture
 * drops and card or section actions with postMessage; every message is checked
 * before it is used.
 */
export function LiveSiteFrame({
  html,
  title,
  scrollKey,
  onDropImages,
  onRemoveImage,
  onEditText,
  onAction,
  replayKey,
}: {
  html: string;
  title: string;
  /** Changing this (a different design or a new prompt) starts the preview at the top. */
  scrollKey: string;
  onDropImages: (slot: string, files: File[]) => void;
  onRemoveImage: (slot: string) => void;
  /** Applies typed text. The result decides whether the preview needs to reload. */
  onEditText: (path: string, value: string) => EditOutcome;
  onAction: (action: string) => void;
  /** Each change plays the website's animations again. */
  replayKey: number;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const scrollY = useRef(0);
  const handlers = useRef({ onDropImages, onRemoveImage, onEditText, onAction });
  const latestHtml = useRef(html);
  const reloadTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // True after text typed in the preview was accepted: the page already shows it, so it must not reload.
  const skipNext = useRef(false);
  const [loaded, setLoaded] = useState({ html, version: 0 });

  useEffect(() => {
    handlers.current = { onDropImages, onRemoveImage, onEditText, onAction };
    latestHtml.current = html;
  });

  useEffect(() => {
    scrollY.current = 0;
  }, [scrollKey]);

  // Debounced so typing in the sidebar does not reload the frame on every keystroke.
  useEffect(() => {
    if (skipNext.current) {
      skipNext.current = false;
      return;
    }
    clearTimeout(reloadTimer.current);
    reloadTimer.current = setTimeout(
      () => setLoaded((previous) => ({ html: latestHtml.current, version: previous.version + 1 })),
      300,
    );
  }, [html]);

  useEffect(() => () => clearTimeout(reloadTimer.current), []);

  // "Replay animations" in the sidebar.
  useEffect(() => {
    if (replayKey > 0) frame.current?.contentWindow?.postMessage({ source: "builder", type: "replay" }, "*");
  }, [replayKey]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.source !== frame.current?.contentWindow) return;
      const data: unknown = event.data;
      if (typeof data !== "object" || data === null) return;
      const message = data as {
        source?: unknown;
        type?: unknown;
        slot?: unknown;
        files?: unknown;
        y?: unknown;
        path?: unknown;
        value?: unknown;
        action?: unknown;
      };
      if (message.source !== "site-editor") return;

      if (message.type === "scroll") {
        if (typeof message.y === "number" && Number.isFinite(message.y)) scrollY.current = Math.max(0, message.y);
        return;
      }

      if (message.type === "edit") {
        if (typeof message.path !== "string" || message.path.length > 40) return;
        if (typeof message.value !== "string" || message.value.length > 700) return;
        const outcome = handlers.current.onEditText(message.path, message.value);
        if (outcome === "applied") {
          skipNext.current = true;
        } else if (outcome === "rejected") {
          // Put back what the website really says.
          setLoaded((previous) => ({ html: latestHtml.current, version: previous.version + 1 }));
        }
        return;
      }

      if (message.type === "action") {
        if (typeof message.action === "string" && message.action.length <= 40) handlers.current.onAction(message.action);
        return;
      }

      if (!parseSlot(message.slot)) return;
      const slot = message.slot as string;

      if (message.type === "drop" && Array.isArray(message.files)) {
        const files = message.files.filter((f): f is File => f instanceof File).slice(0, MAX_GALLERY_IMAGES);
        if (files.length > 0) handlers.current.onDropImages(slot, files);
      } else if (message.type === "remove") {
        handlers.current.onRemoveImage(slot);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <iframe
      ref={frame}
      title={title}
      // The comment makes each reload a different document, even when the HTML is unchanged.
      srcDoc={`${loaded.html}<!--${loaded.version}-->`}
      sandbox="allow-scripts allow-forms allow-top-navigation-to-custom-protocols allow-popups allow-popups-to-escape-sandbox"
      onLoad={() =>
        frame.current?.contentWindow?.postMessage({ source: "builder", type: "restore", y: scrollY.current }, "*")
      }
      className="block h-[75vh] min-h-[420px] w-full border-0 bg-white"
    />
  );
}
