# Prompt Web Builder

Describe a website in plain English and get three ready-to-compare designs. You can customise one, rate it, and export its specification. No LLM or external API is used: prompts are interpreted locally, and every design is assembled from a fixed library of approved sections and themes.

## Features

- **Website studio dashboard.** A responsive layout with a soft gradient background, a clear Describe / Customize / Publish workflow, refreshed prompt and design cards, and light/dark styling. A centered Webquell wordmark at the bottom links to `https://www.webquell.com/` in a new tab, without a separate background panel or extra text. Branding is dashboard-only and is not added to generated websites.
- **Local prompt interpreter** converts a prompt into a typed `SiteSpec` (site type, industry, tone, light/dark, accent colour, audience, brand name and sections).
- **Websites written for the prompt's industry**, not generic business copy. There are 43 industry choices: 42 dedicated content packs in `src/lib/industry-content.ts`, plus general business. Each pack has its own headline, tagline, about text, button label, brand-name placeholder, sample cards, reviews, blog posts, section labels and default colours. For example, "create a website for f1 car driver" gives a dark, red racing site with results and a helmet-and-flag illustration. Generic software product landing pages keep their product copy; retail and the new specialist packs retain their own industry copy on product pages too. Blogs keep a blog's voice but write about the industry's topic. All names, prices, reviews and figures are fictional placeholders to edit.
- **29 industry template starters.** Above the prompt, choose a starter grouped under Local businesses, Professional services, Healthcare and education, Travel/logistics/agriculture, Digital businesses or More industries, customise the description, then press Generate website. The library now includes dedicated dental, cleaning, logistics, agriculture, AI-tool, cybersecurity, fintech, online-course, school and travel-booking packs, plus new starters for the existing healthcare, tutoring, legal, construction, travel and software packs. Every starter produces three editable design variants with matching content and a built-in illustration. Multiword prompts such as "digital wallet", "online course", "cyber security", "hotel booking", "wedding planner" and "interior designer" select the specialised industry. General doctors/clinics, tutors/universities, accounting, home repairs and travel retain their existing packs; dental, school, cleaning and booking prompts now select their more specific packs.
- **Specialist showcases, not live applications.** AI-tool and fintech templates are product marketing sites, not functioning AI services, banking or payment systems. Online-course templates show example programmes, not course delivery, enrolment or student accounts. Travel-booking templates show example itineraries and booking enquiries, not live availability, reservations or ticketing. Clinic/dental templates support enquiries, not appointment scheduling or medical advice. These features require separate backend integrations. Contact enquiries still open email drafts for the visitor to send.
- **Shop showcases, not checkout.** Online-shop templates display sample products and prices with product/order enquiries through the Contact section. They do not include a shopping cart, payment processing, inventory, order fulfilment or automatic email delivery.
- **Animated websites.** Every site gets motion, chosen in the editor under **Animation**: *Subtle* (default: the header and hero slide in one after another, sections and cards fade up as visitors scroll, cards lift and images zoom on hover, the menu underlines on hover), *Lively* (bigger and bouncier motion, a pulsing main button, card tilt on hover and a scroll progress bar) or *None*. The three designs start with a mix (the Creative one is lively), and **Replay animations** plays them again in the preview. It is built to never get in the way: visitors with 'reduce motion' on see no animation, only things below the fold are hidden (by the script, at load), so nothing is hidden without JavaScript, when printing, or in browsers without IntersectionObserver, and elements return to normal once they have arrived so hover effects work. Animation is plain CSS and a tiny script (`src/lib/site/animation.ts`) with no libraries, and the choice is one of three fixed values so nothing user-written reaches the stylesheet.
- **Typos and plurals are understood.** `src/lib/fuzzy.ts` reads the prompt before anything else: plurals are folded to their singular (`florists` is read as `florist`), and a word it does not know is fixed only when it is a very likely typo of one it does: a missing, extra or swapped letter (`photograher`, `resturant`, `photograhper`), or one vowel for another (`bakary`). The rules are deliberately strict, so ordinary words that sit one letter away from a keyword (`designed`, `teaches`, `trained`, `layers`, `stable`) are never changed, and when two keywords fit equally well nothing is changed. Every fix is listed in the dashboard (`photograher` to `photographer`), and brand names and the audience text are never altered. Site type, tone, colours and section words (`gallary`, `portfolo`) are corrected the same way.
- **Wrong or unknown industry?** If the prompt names none the interpreter knows, the dashboard says so. Pick the industry under *Hero image → Industry* and press **Rewrite the text for …** to swap in that industry's wording. Your pictures, and any brand name you typed or gave in the prompt, are kept.
- **Three variants** per prompt: *Safe*, *Recommended* and *Creative*, built from approved sections only.
- **Edit everything, directly in the website.** Click any text in the preview and type: the name, headline, tagline, button, About text, section titles, and every card's title, description, price or detail, and each review. Press Enter to finish or Escape to cancel; pasted text becomes plain text. The preview does not reload while you type, so you keep your place. Text that is empty (where it must not be) or too long is refused with a message and the real text comes back.
- **Add, delete and reorder cards.** Hover a card for ← → and Delete buttons, and use the "+ Add" tile after the last card (up to 12 per section). A section with no cards is left out of the published site, and shown in the editor as a place to add the first one.
- **Reorder and hide sections.** Hover a section in the preview for Up, Down and Hide buttons, or use the **Sections** list in the sidebar: drag a row by its handle, or use the arrows for keyboard control. Hidden sections can be added back from the same list. The hero always stays first and the menu follows the page order.
- **Contact form recipient.** When the Contact section is enabled, enter the owner's email in the editor. After validating the visitor's name, email and message, the form offers **Open in Gmail (new tab)** and **Open your email app**. Gmail opens a prefilled web draft (sign-in may be required); the other option uses the visitor's configured `mailto:` application. Neither sends automatically: the visitor must review the draft and press Send. The recipient address is visible in the website source. Gmail receives the draft details only when its link is opened. Previously published or downloaded sites must be republished or downloaded again to receive this update.
- **Editor** sidebar for brand, headline, tagline, button text, About text, theme, hero layout, card style, heading font and sections.
- **Industry imagery**: the prompt's industry selects a matching built-in illustration for the hero (for example a racing helmet and checkered flag, a car, a trophy, a paw print, a game controller, a camera, a coffee cup). The 43 illustrations are drawn from simple shapes in `src/lib/scenes.ts`, so there are no copyright or licensing issues, nothing to download and no network use. They follow the site's colors, dark mode and the visitor's chosen accent, float gently (and stop for visitors who prefer reduced motion), and become a monochrome silhouette on banner heroes. The owner can change the industry, hide the image, or upload their own photo.
- **Your own photo**: choose "My own photo" in the editor to use a JPEG, PNG or WebP as the hero. It is resized to at most 1600 px and re-encoded as JPEG in the browser (this also removes EXIF data such as GPS location), then embedded in the site, so downloads stay self-contained. In split heroes it sits in the image box; in banner and centered heroes it fills the hero behind a dark overlay so the text stays readable.
- **Drag and drop your own pictures**: drag image files from your computer straight onto the website preview. Every picture position is a drop target that highlights while you drag: the hero, the About section (shown beside the text), each card (projects, features, menu, blog posts) and a **Gallery** section that takes several pictures at once (up to 8; photographers get one automatically). Each area also has **Add image / Replace / Remove** buttons for people who prefer clicking, and the preview keeps its scroll position while pictures are added. On the finished site, gallery pictures open in a viewer with Previous/Next, arrow keys, Escape and click-outside to close. Pictures can be any size or shape: each is automatically cropped to the exact proportions of its area (16:9 for the hero and cards, 4:3 for About and the gallery), keeping the most interesting part rather than always the middle, then shrunk to the box size (1000 px wide, hero 1600 px) and re-encoded as JPEG in the browser (removing EXIF/GPS data) and embedded in the page, so the zip and single-file downloads stay self-contained. The editing controls exist only in the dashboard preview and are never published or downloaded.
- **Any picture size fits.** `src/lib/crop.ts` and `src/lib/image.ts` fit an uploaded picture to its box. The browser builds a small map of where the detail and colour are, and `chooseCrop` slides a window of the box's exact shape over it to keep the busiest part (with a slight pull towards the middle), so a subject at the side of a panorama or the bottom of a portrait is not cut off. The result is exactly the box's proportions, so it fills the area with no further cropping. A picture smaller than the box is never enlarged in the file, and the dashboard says so (`small` pictures may look soft). After each upload the dashboard reports what happened, for example `3000 × 2000 px → 1000 × 563 px, cropped to fit (3.1 MB → 74 KB)`. To keep one ratio for the hero, a hero photo is shown in a 16:9 box in the split layout too.
- **Picture size guidance**: users are told what to upload before they try. Each drop area in the preview shows its recommended size ("Best size 1000 × 563 px", with formats and the upload limit), and a **Picture sizes** panel under the preview lists them all: hero 1600 × 900, About and gallery 1000 × 750, cards 1000 × 563, JPEG/PNG/WebP only, files up to 20 MB (anything larger is shrunk automatically; any shape is cropped automatically to fit). A meter shows how much of the website's picture space is used ("296 KB of 1.7 MB · 3 of 8 gallery pictures"), and after each upload a message reports the saving ("3.1 MB → 74 KB after resizing and compressing"). The sizes come from the same constants the code enforces (`lib/site/limits.ts`), and a test keeps them in step.
- **Color editor**: quick palettes plus custom accent, background and text colors (picker or hex). Button text, cards, borders, muted text and error color are derived automatically so they stay readable, and the contrast check warns if your own text/background choice is hard to read. Custom colors are validated (`#rrggbb` only) and carried into the preview, the published site and the downloads.
- **Desktop and mobile preview** that runs the real generated website in a sandboxed frame, so you can click links, open the mobile menu, toggle the theme and submit the form right in the dashboard. Design thumbnails are the same generated site rendered in non-interactive frames, so they always match the final result.
- **A real, working website** from any design:
  - **Publish & open website** hosts it at `/sites/<id>` on this server and opens it in a new tab.
  - **Download .zip** gives a static site (`index.html`, `styles.css`, `script.js`, `README.txt`) to upload to any static host.
  - **Single HTML** gives one self-contained file you can double-click.
  - The generated site has anchor navigation with scroll highlighting, a mobile menu, a light/dark toggle that remembers the choice, skip link and a contact form with validation. When a recipient email is configured, visitors can open a prefilled draft in Gmail or their default email app.
  - **Visitor color picker**: a "Colors" button on the finished site lets each visitor recolor it with six swatches or any custom color, with Reset. The choice is remembered per browser and stays when switching light/dark. Button text flips between black and white to stay readable. The site owner can turn it off with "Let visitors change the site's color" in the editor.
- **Accessibility gate**: WCAG AA colour-contrast checks for every palette and mode.
- **Feedback capture** (selections, edits, ratings, exports, regenerations) stored locally. Selections, exports and star ratings influence the next generation's ranking; edits and regenerations are recorded but do not change scores. Each prompt has one saved star rating per browser-tab session. Changing stars or rating another design for that prompt replaces its rating and design features instead of adding another training event. Case and whitespace differences count as the same prompt; different prompts have independent ratings. Regenerating a prompt restores its rating, and the session identity survives refreshes using `sessionStorage`. Design-rating controls remain available, but feedback totals, the feedback summary and a Clear feedback control are not shown to end users.
- **Local adaptive ranking, not a trained generative model.** The ranker learns preferences for hero layout, card style, heading font, palette and light/dark mode from feedback for the same site type. High ratings boost matching features, low ratings penalise them, and three stars are neutral. Adjustments are bounded, so one rating may change scores without changing the order. Feedback is read when Generate website is pressed; it does not rearrange the current designs while you rate them. Data stays in this browser's local storage (up to 1,000 interaction events), is not shared across visitors or devices, and does not train a model that generates new templates or code.
- Generated output is **data, never code**. Nothing the user types is evaluated or injected as markup.

## Getting started

**Windows, quickest:** double-click `start.cmd`. It finds Node.js, installs dependencies the first time, starts the server and opens http://localhost:3100. Close its window to stop the server. (The server only runs while that window is open; if the page will not load, it is not running.)


Requires Node.js 20.19+ (Node 24 LTS recommended).

```bash
npm install
npm run dev        # http://localhost:3000
```

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm test` | Vitest unit tests |

## Architecture

```text
Prompt
  → interpretPrompt()          src/lib/interpreter.ts   deterministic keyword/regex rules
  → SiteSpec                   src/lib/types.ts         validated, typed requirements
  → generateVariants()         src/lib/generator.ts     3 designs from approved options
  → rankVariants()             src/lib/ranker.ts        orders designs using feedback
  → LiveSiteFrame / thumbnails src/components/preview   sandboxed frames showing the generated site
        editing preview        src/lib/site/editor.ts   drop targets, typing in place, card/section buttons, postMessage; preview only
        edit operations        src/lib/site/edits.ts    pure text edits, add/remove/move cards, section order; same limits as the server
        picture state          src/lib/site/slots.ts    pure add / replace / remove helpers
  → Editor / ratings           src/components
  → generateSite()             src/lib/site/render.ts   standalone HTML + CSS + JS (all text escaped)
  → publish / zip / single file
        POST /api/sites        src/app/api/sites        validates, then writes .generated-sites/<id>/
        GET  /sites/<id>       src/app/sites            serves the files with a strict CSP
  → FeedbackStore              src/lib/feedback.ts      persistence boundary
```

- `themes.ts` holds the palettes, light/dark neutrals and the contrast calculator.
- `content.ts` produces placeholder copy for each site type; users edit it in the UI.
- `generator.ts#checkAccessibility` is a rule-based quality gate that does not depend on popularity.

### How editing in the preview works

The preview frame is sandboxed with an opaque origin, so it cannot touch the dashboard. Every editable element carries a `data-edit` path (`headline`, `label:projects:title`, `item:projects:1:body`) and every button a `data-act` action (`add:projects`, `remove:projects:1`, `section-up:about`). When you finish typing or press a button, the frame sends `postMessage({ type: "edit" | "action", ... })`. The dashboard accepts messages only from that frame, parses the path or action against a fixed grammar, validates the text against the same limits the server uses, and applies it with pure functions (`edits.ts`). None of the editing markup, script or styles is ever part of a published or downloaded site, and a test checks that.

### Hosting and security of generated sites

- `POST /api/sites` accepts only same-origin requests, caps the body at 2.6 MB (room for the pictures), and validates every field (`lib/site/validate.ts`): enums for design options, length limits for text, at most 12 items per list. Every picture (hero photo, card, About and gallery) must be a JPEG, PNG or WebP data URL within its size limit (`lib/site/limits.ts`; measured as base64 text, so about 330 KB of image data for the hero, 150 KB for each other picture, 1.7 MB for the whole site, 8 gallery pictures) whose first bytes match its declared type; SVG is rejected because it can carry script. Unknown fields are dropped.

### How picture dropping works

The preview frame is sandboxed with an opaque origin, so it cannot touch the dashboard. Inside it, a small script (`EDITOR_SCRIPT`, preview only) highlights the drop target under the cursor and sends `postMessage({ type: "drop" | "remove", slot, files })` to the dashboard. The dashboard only accepts messages from that frame, only for slot ids matching a fixed pattern (`hero`, `about`, `gallery`, `projects:2`, ...), and runs every file through the same resize and re-encode step before storing it.
- The server regenerates the site from the validated data, so client-supplied HTML is never stored. All text is HTML-escaped.
- Site ids are random 16-hex-character values and only `index.html`, `styles.css` and `script.js` can be served, so there is no path traversal.
- Hosted sites are served with `Content-Security-Policy: script-src 'self'; style-src 'self'; default-src 'none'`, which blocks inline script even if escaping ever failed.
- Sites are written to `.generated-sites/` (git-ignored; the oldest are pruned beyond 200). This needs a writable disk, so on serverless hosts swap `lib/site/store.ts` for object storage. The zip and single-HTML downloads need no server storage.

### Learning from feedback

`FeedbackStore` is the boundary between the app and wherever feedback lives. The MVP's `LocalFeedbackStore` writes to `localStorage` (capped at 1000 events, tolerant of corrupt or unavailable storage). A backend implementation can replace it without touching the UI.

New ratings carry a tab-session ID and normalized prompt key. The store upserts by that pair, preserving the event ID, and the ranker reads only the resulting latest rating. Historical events without these keys are preserved because their session/prompt cannot be inferred. Session storage being unavailable limits deduplication to the current page lifetime and logs a warning. The 1000-event retention cap still applies. Removing the Clear feedback button is a UI change, not tamper-proof storage: users can still remove browser data. Feedback is not shared across browsers or visitors.

`rankVariants()` is the current baseline model. It scores each design feature value (hero layout, card style, heading font, palette, theme) using feedback for the same site type (select = +1, export = +1.5, rating = −1 to +1), then adds a bounded bonus (max 0.35) to a fixed prior. It exposes the interface a trained model would use, so a scikit-learn or gradient-boosted ranker can replace it later.

Recommended path for real learning:

1. Persist `FeedbackEvent` rows in a database with anonymised identifiers.
2. Train a ranker offline on a schedule, validating the data first.
3. Compare the candidate with the current model on held-out data and deploy only if it improves.
4. Version models and keep a rollback path. Do not retrain live from every interaction.

### Adding an LLM later

Replace `interpretPrompt()` with a function that asks an LLM for JSON, then **validate it against the `SiteSpec` types** before use. Everything downstream already consumes only the validated spec.

## Limitations

- The interpreter understands a defined vocabulary (see `interpreter.ts`), not arbitrary language.
- The interpreter matches a defined keyword and phrase vocabulary (`src/lib/lexicon.ts`), not arbitrary language. It understands plurals and common typos, but not an industry it has no words for (such as a submarine museum): that falls back to general business wording, with a prompt in the dashboard to choose the nearest industry. Adding an industry means adding keywords in `lexicon.ts`, a content pack in `industry-content.ts` and an illustration in `scenes.ts`; the TypeScript compiler requires all three.
- Copy is placeholder text written once per industry, so two sites in the same industry start with the same words. Imagery is a fixed set of 43 built-in illustrations plus pictures you add yourself; there are no stock photos or AI-generated images (an Unsplash/Pexels integration would need an API key and photographer credit). Pictures are embedded in the page, so a site with many large pictures is a large single file; the limits above keep it to roughly 2.4 MB of HTML at most. Pictures have no alt text yet and are treated as decorative.
- Generated sites are single pages. Their contact form offers a Gmail web draft or a `mailto:` draft. Gmail requires internet access and an account; `mailto:` requires a configured email app. Neither delivers messages in the background.
- Feedback lives in one browser, so rankings do not yet learn across users.
