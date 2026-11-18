import type { AnimationStyle, Variant } from "../types";

/**
 * Animation for generated websites. Everything here is static text: the style is
 * one of three fixed choices and no user content is ever placed in the CSS or script.
 *
 *  - Entrance animations on the header and hero are pure CSS, so they run on first paint.
 *  - Sections below the fold fade in as they scroll into view. Only elements that start
 *    below the fold are hidden, and only by the script, so a page without JavaScript,
 *    a printed page and a visitor who prefers reduced motion always see everything.
 *  - Hover effects are CSS.
 */

export function animationStyle(variant: Variant): AnimationStyle {
  return variant.animation ?? "subtle";
}

const SETTINGS: Record<Exclude<AnimationStyle, "none">, string> = {
  subtle: "--rise:20px;--scale:1;--dur:.6s;--ease:cubic-bezier(.22,.8,.3,1);--step:.08s;--lift:-4px",
  lively: "--rise:46px;--scale:.94;--dur:.85s;--ease:cubic-bezier(.2,.9,.25,1.18);--step:.12s;--lift:-9px",
};

const STAGGER = [1, 2, 3, 4, 5, 6]
  .map((n) => `.grid>[data-reveal]:nth-child(${n + 1}),.gallery-grid>[data-reveal]:nth-child(${n + 1}){transition-delay:calc(var(--step)*${n})}`)
  .join("\n");

const COMMON = `@keyframes rise{from{opacity:0;transform:translateY(var(--rise))}to{opacity:1;transform:none}}
@keyframes pop{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:none}}
@keyframes drop{from{opacity:0;transform:translateY(-100%)}to{opacity:1;transform:none}}
[data-anim] .site-header{animation:drop var(--dur) var(--ease) both}
[data-anim] .hero h1{animation:rise var(--dur) var(--ease) .1s both}
[data-anim] .hero .lead{animation:rise var(--dur) var(--ease) calc(.1s + var(--step)) both}
[data-anim] .hero .actions{animation:rise var(--dur) var(--ease) calc(.1s + var(--step)*2) both}
[data-anim] .hero-art{animation:pop calc(var(--dur) + .2s) var(--ease) .25s both}
.js [data-reveal]{opacity:0;transform:translateY(var(--rise)) scale(var(--scale));transition:opacity var(--dur) var(--ease),transform var(--dur) var(--ease)}
.js [data-reveal].in{opacity:1;transform:none}
${STAGGER}
[data-anim] .card{transition:transform .28s var(--ease),box-shadow .28s}
[data-anim] .card:hover{transform:translateY(var(--lift));box-shadow:0 16px 34px rgba(0,0,0,.16)}
[data-anim] .card .media img,[data-anim] .gallery-item img{transition:transform .6s var(--ease)}
[data-anim] .card:hover .media img,[data-anim] .gallery-item:hover img{transform:scale(1.06)}
[data-anim] .btn{transition:transform .2s var(--ease),filter .2s}
[data-anim] .btn:hover{transform:translateY(-2px)}
[data-anim] .btn:active{transform:scale(.97)}
[data-anim] .nav a{position:relative}
[data-anim] .nav a::after{content:"";position:absolute;left:12px;right:12px;bottom:3px;height:2px;border-radius:2px;background:var(--accent);transform:scaleX(0);transform-origin:left;transition:transform .28s var(--ease)}
[data-anim] .nav a:hover::after{transform:scaleX(1)}
[data-anim] .progress{position:fixed;top:0;left:0;right:0;z-index:70;height:3px;background:var(--accent);transform:scaleX(var(--p,0));transform-origin:left;pointer-events:none}`;

const LIVELY_EXTRA = `@keyframes pulse{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--accent) 55%,transparent)}70%{box-shadow:0 0 0 16px transparent}100%{box-shadow:0 0 0 0 transparent}}
@keyframes pulse-light{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--accent-text) 60%,transparent)}70%{box-shadow:0 0 0 16px transparent}100%{box-shadow:0 0 0 0 transparent}}
[data-anim="lively"] .hero .btn{animation:pulse 2.4s ease-out 1.4s infinite}
[data-anim="lively"] .hero-banner .btn{animation-name:pulse-light}
[data-anim="lively"] .card:hover{transform:translateY(var(--lift)) scale(1.025) rotate(-.4deg)}
[data-anim="lively"] .btn:hover{transform:translateY(-3px) scale(1.05)}
[data-anim="lively"] .section h2{transform-origin:left}`;

const REDUCED = `@media (prefers-reduced-motion:reduce){[data-anim] *,[data-anim] *::after{animation:none!important}.js [data-reveal]{opacity:1!important;transform:none!important;transition:none!important}[data-anim] .progress{display:none}}
@media print{.js [data-reveal]{opacity:1!important;transform:none!important}}`;

/** The stylesheet for a chosen animation style. Empty when animation is off. */
export function animationCss(variant: Variant): string {
  const style = animationStyle(variant);
  if (style === "none") return "";
  return [
    `[data-anim="${style}"]{${SETTINGS[style]}}`,
    COMMON,
    style === "lively" ? LIVELY_EXTRA : "",
    REDUCED,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Markup for the scroll progress bar. Only the lively style has one. */
export function progressBarHtml(variant: Variant): string {
  return animationStyle(variant) === "lively" ? `<div class="progress" aria-hidden="true"></div>` : "";
}

/** Reveals sections as they scroll into view, and drives the progress bar. */
export const ANIMATION_SCRIPT = `(function () {
  "use strict";
  var root = document.documentElement;
  var style = root.getAttribute("data-anim");
  if (!style) return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var bar = document.querySelector(".progress");
  if (bar) {
    var frame = 0;
    var update = function () {
      frame = 0;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      root.style.setProperty("--p", max > 0 ? String(Math.min(1, window.scrollY / max)) : "0");
    };
    window.addEventListener("scroll", function () { if (!frame) frame = requestAnimationFrame(update); }, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  if (!("IntersectionObserver" in window)) return;
  var SELECTOR = ".section h2,.about-grid>*,.grid>*,.gallery-grid>*,.form,.site-footer .container";
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      observer.unobserve(el);
      el.classList.add("in");
      // Once it has arrived the element goes back to normal, so hover effects work.
      setTimeout(function () { el.removeAttribute("data-reveal"); el.classList.remove("in"); }, 2200);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

  // Only things below the fold are hidden, so nothing flashes at load.
  function arm(everything) {
    Array.prototype.forEach.call(document.querySelectorAll(SELECTOR), function (el) {
      if (!everything && el.getBoundingClientRect().top < window.innerHeight * 0.92) return;
      el.setAttribute("data-reveal", "");
      el.classList.remove("in");
      observer.observe(el);
    });
  }
  arm(false);

  // The dashboard can play the animations again.
  document.addEventListener("replay-animations", function () {
    window.scrollTo(0, 0);
    arm(true);
  });
})();
`;
