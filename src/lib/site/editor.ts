/**
 * Behaviour that exists only inside the dashboard's editing preview: dragging
 * pictures onto the page, Add/Replace/Remove buttons, and scroll-position
 * restore. Published and downloaded sites never include any of this.
 *
 * The preview runs in a sandboxed frame, so it talks to the dashboard with
 * postMessage. The dashboard validates every message it receives.
 */

export const EDITOR_CSS = `.hero[data-slot]{position:relative}
.media.empty{display:grid;place-items:center;background:var(--surface);border:2px dashed var(--border);border-radius:var(--radius-card)}
.card .media.empty{border-radius:0;border-width:0 0 2px}
.media-empty{padding:12px;text-align:center;color:var(--muted);font-size:.9rem}
.media-empty p{margin:0 0 8px}
.media-empty .media-hint{margin:0 0 10px;font-size:.75rem;line-height:1.4}
.slot-hint{align-self:center;padding:4px 10px;font-size:.75rem;font-weight:600;color:var(--text);background:var(--bg);border:1px solid var(--border);border-radius:999px;white-space:nowrap}
.media-empty button,.slot-bar button{font:inherit;font-size:.8rem;font-weight:600;padding:6px 12px;color:var(--accent-text);background:var(--accent);border:0;border-radius:var(--radius-btn);cursor:pointer}
.slot-bar{position:absolute;top:10px;right:10px;z-index:5;display:flex;gap:6px;opacity:0;transition:opacity .15s}
[data-slot]:hover>.slot-bar,[data-slot]:focus-within>.slot-bar{opacity:1}
.slot-bar button[data-slot-action="remove"]{color:var(--text);background:var(--bg);border:1px solid var(--border)}
[data-slot].drop-target{outline:3px dashed var(--accent);outline-offset:-3px}
[data-slot].drop-target::after{content:"Drop to add";position:absolute;inset:0;z-index:6;display:grid;place-items:center;font-weight:700;color:var(--text);background:color-mix(in srgb,var(--accent) 22%,transparent);pointer-events:none}
.drop-toast{position:fixed;left:50%;bottom:16px;z-index:200;transform:translateX(-50%);max-width:90vw;padding:8px 16px;font-size:.9rem;font-weight:600;color:var(--bg);background:var(--text);border-radius:999px}
.drop-toast[hidden]{display:none}
.section,.card{position:relative}
[data-edit]{cursor:text;border-radius:3px}
[data-edit]:hover{outline:2px dashed currentColor;outline-offset:3px}
[data-edit]:focus{outline:2px solid currentColor;outline-offset:3px;background:color-mix(in srgb,currentColor 8%,transparent)}
[data-edit]:empty::before{content:attr(data-placeholder);opacity:.55;font-weight:400;font-style:italic}
.card-bar{position:absolute;top:8px;left:8px;z-index:5;display:flex;gap:4px;opacity:0;transition:opacity .15s}
.card:hover>.card-bar,.card:focus-within>.card-bar{opacity:1}
.section-bar{position:absolute;top:10px;right:16px;z-index:8;display:flex;gap:6px;opacity:0;transition:opacity .15s}
.section:hover>.section-bar,.section:focus-within>.section-bar{opacity:1}
.card-bar button,.section-bar button{font:inherit;font-size:.75rem;font-weight:600;padding:5px 10px;color:var(--text);background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-btn);cursor:pointer}
.card-bar button.danger{color:var(--danger)}
.card-bar button:disabled,.section-bar button:disabled{opacity:.4;cursor:default}
.add-card{display:grid;place-items:center;min-height:140px;border:2px dashed var(--border);border-radius:var(--radius-card)}
.add-card button{font:inherit;font-weight:600;padding:8px 16px;color:var(--accent-text);background:var(--accent);border:0;border-radius:var(--radius-btn);cursor:pointer}
`;

export const EDITOR_SCRIPT = `(function () {
  "use strict";
  var SLOT = /^(hero|about|gallery|(gallery|features|projects|menu|posts):\\d{1,2})$/;
  var IMAGE = /^image\\/(jpeg|png|webp)$/;
  var current = null;
  var toastTimer = 0;

  function slotOf(node) {
    var el = node && node.closest ? node.closest("[data-slot]") : null;
    return el && SLOT.test(el.getAttribute("data-slot")) ? el : null;
  }
  function hasFiles(e) {
    var types = e.dataTransfer && e.dataTransfer.types;
    return !!types && Array.prototype.indexOf.call(types, "Files") >= 0;
  }
  function mark(el) {
    if (current === el) return;
    if (current) current.classList.remove("drop-target");
    current = el;
    if (el) el.classList.add("drop-target");
  }
  function toast(text) {
    var n = document.getElementById("drop-toast");
    if (!n) {
      n = document.createElement("div");
      n.id = "drop-toast";
      n.className = "drop-toast";
      n.setAttribute("role", "status");
      document.body.appendChild(n);
    }
    n.textContent = text;
    n.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { n.hidden = true; }, 3500);
  }
  function send(message) {
    message.source = "site-editor";
    parent.postMessage(message, "*");
  }

  // Without these handlers the browser would navigate the frame to a dropped file.
  document.addEventListener("dragover", function (e) {
    if (!hasFiles(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    mark(slotOf(e.target));
  });
  document.addEventListener("dragleave", function (e) {
    if (!e.relatedTarget) mark(null);
  });
  document.addEventListener("drop", function (e) {
    if (!hasFiles(e)) return;
    e.preventDefault();
    var el = slotOf(e.target);
    mark(null);
    if (!el) { toast("Drop the picture onto one of the dashed or highlighted areas."); return; }
    var files = Array.prototype.filter.call(e.dataTransfer.files, function (f) { return IMAGE.test(f.type); });
    if (!files.length) { toast("Only JPEG, PNG or WebP pictures can be added."); return; }
    send({ type: "drop", slot: el.getAttribute("data-slot"), files: files });
  });

  var picker = document.createElement("input");
  picker.type = "file";
  picker.accept = "image/jpeg,image/png,image/webp";
  picker.hidden = true;
  document.body.appendChild(picker);
  var pickSlot = null;
  picker.addEventListener("change", function () {
    var files = Array.prototype.slice.call(picker.files || []);
    if (pickSlot && files.length) send({ type: "drop", slot: pickSlot, files: files });
    picker.value = "";
    pickSlot = null;
  });
  document.addEventListener("click", function (e) {
    // Card and section controls (move, delete, add, hide).
    var act = e.target.closest ? e.target.closest("[data-act]") : null;
    if (act) {
      e.preventDefault();
      if (!act.disabled) send({ type: "action", action: act.getAttribute("data-act") });
      return;
    }
    var button = e.target.closest ? e.target.closest("[data-slot-action]") : null;
    var el = button && slotOf(button);
    if (!button || !el) return;
    e.preventDefault();
    var slot = el.getAttribute("data-slot");
    var action = button.getAttribute("data-slot-action");
    if (action === "remove") { send({ type: "remove", slot: slot }); return; }
    pickSlot = slot;
    picker.multiple = action === "pick-many";
    picker.click();
  });

  // Typing in place. Text is plain: pasted formatting is dropped and line breaks become spaces.
  function norm(text) { return String(text).replace(/\\s+/g, " ").trim(); }
  function editOf(node) { return node && node.closest ? node.closest("[data-edit]") : null; }
  Array.prototype.forEach.call(document.querySelectorAll("[data-edit]"), function (el) {
    try { el.contentEditable = "plaintext-only"; } catch (err) { el.contentEditable = "true"; }
    el.spellcheck = true;
    el.setAttribute("title", "Click to edit");
  });
  var original = new WeakMap();
  document.addEventListener("focusin", function (e) {
    var el = editOf(e.target);
    if (el) original.set(el, norm(el.textContent));
  });
  document.addEventListener("keydown", function (e) {
    var el = editOf(e.target);
    if (!el) return;
    if (e.key === "Enter") { e.preventDefault(); el.blur(); }
    else if (e.key === "Escape") { el.textContent = original.get(el) || ""; el.blur(); }
  });
  document.addEventListener("paste", function (e) {
    var el = editOf(e.target);
    if (!el) return;
    e.preventDefault();
    var text = (e.clipboardData || window.clipboardData).getData("text/plain");
    document.execCommand("insertText", false, norm(text));
  });
  document.addEventListener("focusout", function (e) {
    var el = editOf(e.target);
    if (!el) return;
    var value = norm(el.textContent);
    var before = original.get(el);
    original.delete(el);
    el.textContent = value;
    if (value !== before) send({ type: "edit", path: el.getAttribute("data-edit"), value: value });
  });

  // Lets the dashboard keep your place when the preview reloads after an edit.
  var frame = 0;
  window.addEventListener("scroll", function () {
    if (frame) return;
    frame = requestAnimationFrame(function () {
      frame = 0;
      send({ type: "scroll", y: Math.round(window.scrollY) });
    });
  }, { passive: true });
  window.addEventListener("message", function (e) {
    if (e.source !== parent) return;
    var d = e.data;
    if (d && d.source === "builder" && d.type === "restore" && typeof d.y === "number") {
      window.scrollTo({ top: d.y, behavior: "instant" });
    } else if (d && d.source === "builder" && d.type === "replay") {
      document.dispatchEvent(new Event("replay-animations"));
    }
  });
})();
`;

export const LIGHTBOX_CSS = `.gallery-open{display:block;width:100%;height:100%;padding:0;border:0;background:none;cursor:zoom-in}
.gallery-open img{transition:transform .3s}
.gallery-open:hover img{transform:scale(1.04)}
dialog.lightbox{width:100vw;height:100vh;max-width:none;max-height:none;margin:0;padding:64px 0 24px;box-sizing:border-box;border:0;background:transparent}
dialog.lightbox[open]{display:grid;place-items:center}
dialog.lightbox::backdrop{background:rgba(0,0,0,.85)}
.lightbox img{display:block;max-width:94vw;max-height:calc(100vh - 120px);object-fit:contain;border-radius:var(--radius-card)}
.lightbox-bar{position:fixed;left:0;right:0;top:14px;z-index:2;display:flex;justify-content:center;gap:8px}
.lightbox-bar button{font:inherit;padding:8px 16px;color:#fff;background:rgba(0,0,0,.6);border:1px solid rgba(255,255,255,.5);border-radius:var(--radius-btn);cursor:pointer}
`;

/** Click a gallery picture to see it larger. Arrow keys move between pictures. */
export const LIGHTBOX_SCRIPT = `(function () {
  "use strict";
  var dialog = document.getElementById("lightbox");
  var big = document.getElementById("lightbox-img");
  var opens = Array.prototype.slice.call(document.querySelectorAll(".gallery-open"));
  if (!dialog || !big || !opens.length || typeof dialog.showModal !== "function") return;
  var index = 0;

  function show(i) {
    index = (i + opens.length) % opens.length;
    big.src = opens[index].querySelector("img").src;
  }
  opens.forEach(function (button, i) {
    button.addEventListener("click", function () { show(i); dialog.showModal(); });
  });
  dialog.addEventListener("click", function (e) {
    if (e.target === dialog || (e.target.closest && e.target.closest("[data-lightbox-close]"))) dialog.close();
  });
  dialog.querySelector("[data-lightbox-prev]").addEventListener("click", function () { show(index - 1); });
  dialog.querySelector("[data-lightbox-next]").addEventListener("click", function () { show(index + 1); });
  dialog.addEventListener("keydown", function (e) {
    if (e.key === "Escape") dialog.close();
    if (e.key === "ArrowLeft") show(index - 1);
    if (e.key === "ArrowRight") show(index + 1);
  });
})();
`;
