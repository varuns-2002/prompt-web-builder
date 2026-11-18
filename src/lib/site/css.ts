import { readableOn, variantTheme, type ThemeColors } from "../themes";
import { ART_CSS } from "../scenes";
import { LIGHTBOX_CSS } from "./editor";
import { animationCss } from "./animation";
import type { Radius, Variant } from "../types";

const RADIUS: Record<Radius, { card: string; button: string; field: string }> = {
  sm: { card: "2px", button: "2px", field: "2px" },
  lg: { card: "12px", button: "8px", field: "8px" },
  xl: { card: "24px", button: "999px", field: "14px" },
};

const CARD: Record<Variant["cardStyle"], string> = {
  outlined: "border:1px solid var(--border);background:var(--bg)",
  elevated:
    "border:1px solid var(--border);background:var(--surface);box-shadow:0 10px 25px rgba(0,0,0,.12)",
  soft: "border:1px solid transparent;background:var(--surface)",
};

function vars(t: ThemeColors): string {
  return (
    `--bg:${t.bg};--surface:${t.surface};--text:${t.text};--muted:${t.muted};` +
    `--border:${t.border};--accent:${t.accent};--accent-text:${t.accentText};--danger:${t.danger}`
  );
}

/** Native controls and scrollbars follow the actual background, not the mode name. */
function scheme(t: ThemeColors): "light" | "dark" {
  return readableOn(t.bg) === "#ffffff" ? "dark" : "light";
}

/** Stylesheet for a generated site. Only values from validated enums are interpolated. */
export function buildCss(variant: Variant): string {
  const light = variantTheme(variant, "light");
  const dark = variantTheme(variant, "dark");
  const r = RADIUS[variant.radius];
  const headingFont =
    variant.headingFont === "serif"
      ? 'Georgia,"Times New Roman",serif'
      : 'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif';

  return `:root{--heading-font:${headingFont};--radius-card:${r.card};--radius-btn:${r.button};--radius-field:${r.field}}
:root[data-theme="light"]{${vars(light)};color-scheme:${scheme(light)}}
:root[data-theme="dark"]{${vars(dark)};color-scheme:${scheme(dark)}}
*,*::before,*::after{box-sizing:border-box}
html{scroll-behavior:smooth;scroll-padding-top:76px}
body{margin:0;background:var(--bg);color:var(--text);font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;line-height:1.6}
h1,h2,h3{font-family:var(--heading-font);line-height:1.15;margin:0}
a{color:inherit}
:focus-visible{outline:3px solid var(--text);outline-offset:3px}
.container{max-width:1120px;margin:0 auto;padding:0 24px}
.skip{position:absolute;left:-999px;top:8px}
.skip:focus{left:16px;z-index:100;background:var(--accent);color:var(--accent-text);padding:8px 16px;border-radius:var(--radius-btn)}
.site-header{position:sticky;top:0;z-index:50;background:var(--bg);border-bottom:1px solid var(--border)}
.bar{display:flex;align-items:center;justify-content:space-between;gap:16px;max-width:1120px;margin:0 auto;padding:14px 24px}
.brand{font-family:var(--heading-font);font-size:1.25rem;font-weight:700;text-decoration:none;white-space:nowrap}
.nav{display:flex;flex-wrap:wrap;align-items:center;gap:4px}
.nav a{color:var(--muted);text-decoration:none;padding:8px 12px;border-radius:var(--radius-btn);font-size:.95rem}
.nav a:hover,.nav a[aria-current="true"]{color:var(--text)}
.nav a[aria-current="true"]{font-weight:600;text-decoration:underline;text-underline-offset:6px}
.menu-btn,.theme-btn{font:inherit;color:var(--text);background:transparent;border:1px solid var(--border);border-radius:var(--radius-btn);padding:6px 14px;cursor:pointer}
.menu-btn{display:none}
.color-picker{display:none;position:relative}
.js .color-picker{display:block}
.color-panel{position:absolute;right:0;top:calc(100% + 10px);z-index:60;width:260px;padding:16px;background:var(--bg);color:var(--text);border:1px solid var(--border);border-radius:var(--radius-card);box-shadow:0 12px 30px rgba(0,0,0,.2)}
.color-title{margin:0 0 12px;font-weight:700}
.swatches{display:flex;flex-wrap:wrap;gap:10px}
.swatch{width:34px;height:34px;padding:0;border-radius:50%;border:2px solid transparent;cursor:pointer}
.swatch[aria-pressed="true"]{border-color:var(--text);box-shadow:0 0 0 2px var(--bg) inset}
.color-custom{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:16px;font-size:.95rem;font-weight:600}
.color-custom input{width:48px;height:34px;padding:2px;border:1px solid var(--border);border-radius:var(--radius-field);background:var(--bg);cursor:pointer}
.color-reset{margin-top:16px;font:inherit;font-size:.9rem;color:var(--text);background:transparent;border:1px solid var(--border);border-radius:var(--radius-btn);padding:6px 14px;cursor:pointer}
.btn{display:inline-block;padding:12px 26px;font:600 .95rem/1.2 inherit;background:var(--accent);color:var(--accent-text);border:0;border-radius:var(--radius-btn);text-decoration:none;cursor:pointer}
.btn:hover{filter:brightness(1.1)}
.hero{padding:96px 0}
.hero h1{font-size:clamp(2.25rem,5vw,3.75rem);font-weight:800;letter-spacing:-.02em}
.lead{font-size:1.2rem;color:var(--muted);max-width:42rem;margin:20px 0 0}
.actions{margin-top:32px}
.hero-centered{text-align:center}
.hero-centered h1,.hero-centered .lead{margin-inline:auto;max-width:48rem}
.hero-split .container{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center}
.hero-art{aspect-ratio:4/3;overflow:hidden;border:1px solid var(--border);border-radius:var(--radius-card);background:linear-gradient(135deg,var(--accent),var(--surface))}
.hero-art:has(.photo){aspect-ratio:16/9}
.hero-art .photo{display:block;width:100%;height:100%;object-fit:cover}
.hero-banner .container{display:grid;grid-template-columns:1.1fr .9fr;gap:48px;align-items:center}
.hero-banner .container:not(:has(.banner-art)){grid-template-columns:1fr}
.has-photo h1{max-width:48rem}
.banner-art{border:0;border-radius:0;background:none;overflow:visible}
.hero-centered .wide-art{max-width:680px;margin:56px auto 0;aspect-ratio:16/9}
.hero-banner{background:var(--accent);color:var(--accent-text)}
.hero-banner .lead{color:var(--accent-text)}
.hero-banner .btn{background:var(--accent-text);color:var(--accent)}
.has-photo{position:relative;overflow:hidden;color:#fff;background:#111}
.hero-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.has-photo::before{content:"";position:absolute;inset:0;z-index:1;background:rgba(0,0,0,.6)}
.has-photo .container{position:relative;z-index:2}
.has-photo .lead{color:#fff}
.has-photo .btn{background:var(--accent);color:var(--accent-text)}
${ART_CSS}
.section{padding:72px 0}
.section.alt{background:var(--surface)}
.section h2{font-size:clamp(1.75rem,3vw,2.5rem);margin-bottom:32px}
.about{max-width:42rem;font-size:1.15rem;color:var(--muted);margin:0}
.grid{display:grid;gap:20px;grid-template-columns:repeat(auto-fit,minmax(240px,1fr))}
.card{padding:24px;border-radius:var(--radius-card);${CARD[variant.cardStyle]}}
.card.has-thumb{padding:0;overflow:hidden}
.card-body{padding:20px}
.thumb{aspect-ratio:16/9;background:linear-gradient(135deg,var(--accent),var(--border))}
.media{position:relative;aspect-ratio:16/9;overflow:hidden;background:var(--surface)}
.media img{display:block;width:100%;height:100%;object-fit:cover}
.about-grid{display:grid;gap:40px;grid-template-columns:1fr}
.about-grid.has-media{grid-template-columns:1.15fr 1fr;align-items:center}
.about-media{aspect-ratio:4/3;border-radius:var(--radius-card)}
.gallery-grid{display:grid;gap:14px;grid-template-columns:repeat(auto-fill,minmax(230px,1fr))}
.gallery-item{aspect-ratio:4/3;border-radius:var(--radius-card)}
${LIGHTBOX_CSS}
.card h3{font-size:1.15rem}
.card p{margin:8px 0 0;color:var(--muted)}
.card .btn{margin-top:20px}
.meta{margin-top:16px;font-size:.8rem;font-weight:500;color:var(--muted)}
.price{font-size:1.75rem;font-weight:800;margin-bottom:8px}
figure.card{margin:0}
blockquote{margin:0}
figcaption{margin-top:16px;font-weight:600}
.form{max-width:560px;margin:0 auto;display:grid;gap:12px;padding:24px;border-radius:var(--radius-card);${CARD[variant.cardStyle]}}
.form label{display:block;font-weight:600}
.form input,.form textarea{display:block;width:100%;margin-top:4px;padding:10px 12px;font:inherit;color:var(--text);background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-field)}
.form [aria-invalid="true"]{border-color:var(--danger)}
.error{display:block;min-height:1.4em;font-size:.875rem;font-weight:500;color:var(--danger)}
.status{margin:0;font-weight:600}
.site-footer{border-top:1px solid var(--border);padding:32px 0;color:var(--muted);font-size:.9rem}
@media (max-width:760px){
.hero{padding:64px 0}
.section{padding:52px 0}
.hero-split .container{grid-template-columns:1fr}
.about-grid.has-media{grid-template-columns:1fr}
.hero-banner .container{grid-template-columns:1fr}
.banner-art{display:none}
.js .menu-btn{display:inline-block}
.js .nav{display:none;position:absolute;top:100%;left:0;right:0;flex-direction:column;align-items:stretch;padding:12px 24px;background:var(--bg);border-bottom:1px solid var(--border)}
.js .nav.open{display:flex}
.js .color-panel{position:static;width:auto;margin-top:8px;box-shadow:none}
}
${animationCss(variant)}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}*{transition:none!important;animation:none!important}}
`;
}
