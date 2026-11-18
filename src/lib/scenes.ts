import type { IndustryId } from "./types";

/**
 * Built-in illustrations, one per industry. They are drawn from simple shapes
 * and styled by CSS classes (see ART_CSS), so they follow the site's colors,
 * dark mode and the visitor's chosen accent. Nothing here comes from user input.
 *
 * Classes: bg surface | a accent | a2/a3 faded accent | t text | m muted
 *          l page color with outline | w accent-text | st/sa/sw/sm strokes
 * Animated parts are wrapped in <g class="float">, which must not carry its
 * own transform attribute (CSS animation would override it).
 */

export const INDUSTRY_LABELS: Record<IndustryId, string> = {
  photography: "Photography",
  software: "Software & tech",
  food: "Food & cafe",
  fitness: "Fitness & sports",
  health: "Health & medical",
  legal: "Legal",
  realestate: "Real estate",
  education: "Education",
  travel: "Travel",
  fashion: "Fashion",
  music: "Music",
  beauty: "Beauty & salon",
  finance: "Finance",
  construction: "Construction & trades",
  creative: "Art & design",
  writing: "Writing & blogs",
  motorsport: "Motorsport & racing",
  automotive: "Cars & garages",
  sports: "Sports & athletes",
  pets: "Pets & animals",
  gaming: "Gaming & esports",
  floral: "Florists & plants",
  community: "Clubs & communities",
  homeservices: "Home services",
  bakery: "Bakery & cakes",
  consulting: "Consulting & advisory",
  recruitment: "Recruitment & staffing",
  marketing: "Marketing & agencies",
  events: "Events & celebrations",
  interiors: "Interior design",
  nonprofit: "Nonprofits & charities",
  retail: "Online shops & retail",
  dental: "Dental practices",
  cleaning: "Cleaning services",
  logistics: "Logistics & delivery",
  agriculture: "Agriculture & farming",
  aitools: "AI tools",
  cybersecurity: "Cybersecurity",
  fintech: "Fintech & digital wallets",
  onlinecourses: "Online courses",
  schools: "Schools",
  travelbooking: "Travel booking showcases",
  business: "General business",
};

export const ART_CSS = `.art{display:block;width:100%;height:100%}
.art .bg{fill:var(--surface)}
.art .a{fill:var(--accent)}
.art .a2{fill:var(--accent);opacity:.35}
.art .a3{fill:var(--accent);opacity:.14}
.art .t{fill:var(--text)}
.art .m{fill:var(--muted)}
.art .l{fill:var(--bg);stroke:var(--border);stroke-width:2}
.art .w{fill:var(--accent-text)}
.art .bd{fill:none;stroke:var(--border);stroke-width:2}
.art .st,.art .sa,.art .sw,.art .sm{fill:none;stroke-linecap:round;stroke-linejoin:round}
.art .st{stroke:var(--text);stroke-width:4}
.art .sa{stroke:var(--accent);stroke-width:4}
.art .sw{stroke:var(--accent-text);stroke-width:4}
.art .sm{stroke:var(--muted);stroke-width:5}
.art .float{animation:art-float 7s ease-in-out infinite}
.art .float.slow{animation-duration:10s;animation-delay:-3s}
@keyframes art-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
@media (prefers-reduced-motion:reduce){.art .float{animation:none}}
.hero-banner .art .bg,.hero-banner .art .deco{display:none}
.hero-banner .art :is(.a,.a2,.a3,.t,.m){fill:var(--accent-text)}
.hero-banner .art .w{fill:var(--accent);stroke:none}
.hero-banner .art .l{fill:var(--accent);stroke:var(--accent-text);stroke-width:3}
.hero-banner .art :is(.st,.sa,.sm){stroke:var(--accent-text)}
.hero-banner .art .bd{stroke:var(--accent)}
.hero-banner .art .sw{stroke:var(--accent)}
`;

/** Evenly spaced rectangles, used for windows, bars and text lines. */
function grid(
  x: number,
  y: number,
  cols: number,
  rows: number,
  dx: number,
  dy: number,
  w: number,
  h: number,
  cls: string,
  rx = 2,
): string {
  let out = "";
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      out += `<rect class="${cls}" x="${x + c * dx}" y="${y + r * dy}" width="${w}" height="${h}" rx="${rx}"/>`;
    }
  }
  return out;
}

/** Alternating squares, as on a checkered flag. */
function checker(x: number, y: number, cols: number, rows: number, size: number, cls: string): string {
  let out = "";
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if ((r + c) % 2 === 0) out += `<rect class="${cls}" x="${x + c * size}" y="${y + r * size}" width="${size}" height="${size}"/>`;
    }
  }
  return out;
}

const BASE =
  '<rect class="bg" width="400" height="300"/>' +
  '<circle class="a3 deco" cx="318" cy="84" r="112"/>' +
  '<circle class="a3 deco" cx="64" cy="262" r="74"/>';

const SCENES: Record<IndustryId, string> = {
  dental:
    '<path class="l" d="M200 86c-67-40-97 15-76 67 11 28 5 86 29 86 19 0 15-61 47-61s28 61 47 61c24 0 18-58 29-86 21-52-9-107-76-67z"/>' +
    '<path class="sa" d="M167 112q33 18 66 0"/><path class="a2" d="M145 136q12 19 12 49 14-30 27-35-23 0-39-14z"/>' +
    '<g class="float"><path class="a" d="M303 65l7 20 20 7-20 7-7 20-7-20-20-7 20-7z"/></g>',
  cleaning:
    '<path class="l" d="M114 116h68l12 123h-92z"/><path class="a" d="M126 83h47v35h-47zM162 83V67h50v14h-33v9z"/>' +
    '<rect class="a2" x="117" y="156" width="62" height="43" rx="8"/><path class="sa" d="M280 63l-39 121"/>' +
    '<path class="a" d="M219 176l48 16 15 47h-101z"/><path class="sw" d="M220 199l-12 26M238 205l-4 22M254 208l5 20"/>' +
    '<g class="float"><circle class="bd" cx="73" cy="111" r="13"/><circle class="a2" cx="291" cy="130" r="20"/><path class="sa" d="M89 51v24M77 63h24"/></g>',
  logistics:
    '<rect class="l" x="57" y="104" width="181" height="110" rx="7"/><path class="a" d="M238 134h57l39 43v37h-96z"/>' +
    '<path class="w" d="M255 146h34l25 29h-59z"/><path class="a2" d="M78 122h55v55H78zM145 122h70v55h-70z"/>' +
    '<path class="bd" d="M105 122v22M180 122v22"/><circle class="t" cx="110" cy="218" r="22"/><circle class="l" cx="110" cy="218" r="9"/>' +
    '<circle class="t" cx="285" cy="218" r="22"/><circle class="l" cx="285" cy="218" r="9"/><path class="sm" d="M49 246h300"/>' +
    '<g class="float"><path class="sa" d="M159 69h103l-13-13M262 69l-13 13"/></g>',
  agriculture:
    '<circle class="a2" cx="295" cy="77" r="32"/><path class="a3" d="M30 188q84-96 174-15 80-65 166 4v77H30z"/>' +
    '<path class="sa" d="M47 234q148-113 306-26M91 253q124-102 269-22M173 255q94-59 189-1"/>' +
    '<path class="l" d="M94 181v-72h55l26 72z"/><path class="a" d="M85 169h110v36H85z"/><path class="a2" d="M106 119h33l17 48h-50z"/>' +
    '<circle class="t" cx="107" cy="204" r="25"/><circle class="l" cx="107" cy="204" r="12"/><circle class="t" cx="184" cy="208" r="17"/>' +
    '<g class="float"><path class="sa" d="M242 154v-58M242 135q-25 0-25-24 25 0 25 24M242 119q24 0 24-24-24 0-24 24"/></g>',
  aitools:
    '<path class="sa" d="M130 99l70 51 71-55M200 150l-72 70M200 150l80 64"/>' +
    '<rect class="l" x="157" y="111" width="86" height="78" rx="18"/><circle class="a" cx="184" cy="145" r="7"/><circle class="a" cx="216" cy="145" r="7"/>' +
    '<path class="sa" d="M185 167h30M200 111V92"/><circle class="a" cx="200" cy="88" r="6"/>' +
    '<rect class="a2" x="92" y="66" width="52" height="46" rx="10"/><path class="st" d="M106 89h24"/>' +
    '<circle class="l" cx="119" cy="225" r="24"/><path class="sa" d="M108 225l8 8 15-17"/>' +
    '<rect class="a" x="260" y="195" width="49" height="41" rx="9"/>' +
    '<g class="float"><path class="a" d="M285 54l8 22 22 8-22 8-8 22-8-22-22-8 22-8z"/></g>',
  cybersecurity:
    '<path class="l" d="M200 48l99 39v67c0 52-45 84-99 106-54-22-99-54-99-106V87z"/>' +
    '<path class="a3" d="M200 66l80 31v57c0 38-32 67-80 87z"/><rect class="a" x="157" y="133" width="86" height="65" rx="10"/>' +
    '<path class="sa" d="M174 134v-21a26 26 0 0 1 52 0v21"/><circle class="w" cx="200" cy="158" r="7"/><path class="sw" d="M200 164v15"/>' +
    '<g class="float"><path class="sa" d="M64 106v30h22M336 106v30h-22M64 193v-30h22M336 193v-30h-22"/></g>',
  fintech:
    '<rect class="l" x="124" y="44" width="151" height="216" rx="21"/><path class="bd" d="M168 59h62M184 244h32"/>' +
    '<rect class="a3" x="140" y="83" width="119" height="127" rx="8"/>' +
    '<rect class="a" x="77" y="113" width="157" height="91" rx="12"/><path class="sw" d="M95 139h45M95 179h25M136 179h25"/>' +
    '<rect class="a2" x="246" y="158" width="69" height="49" rx="10"/><circle class="w" cx="268" cy="183" r="5"/>' +
    '<g class="float"><circle class="l" cx="298" cy="87" r="29"/><path class="sa" d="M283 87h30l-9-9M313 87l-9 9"/></g>',
  onlinecourses:
    '<rect class="l" x="62" y="60" width="276" height="172" rx="12"/><path class="t" d="M182 232h36l7 19h-50z"/><path class="sm" d="M151 254h98"/>' +
    '<rect class="a2" x="77" y="76" width="165" height="117" rx="8"/><circle class="a" cx="159" cy="132" r="30"/><path class="w" d="M152 116l24 16-24 16z"/>' +
    grid(257, 83, 1, 4, 0, 27, 62, 12, "a2", 4) +
    '<path class="sa" d="M82 213h151"/><circle class="a" cx="154" cy="213" r="5"/>' +
    '<g class="float"><circle class="l" cx="318" cy="218" r="27"/><path class="sa" d="M305 218l9 9 17-20"/></g>',
  schools:
    '<rect class="l" x="65" y="131" width="270" height="110" rx="4"/><path class="a" d="M54 132l56-45h180l56 45z"/>' +
    '<rect class="l" x="162" y="84" width="76" height="157"/><path class="a" d="M150 85l50-37 50 37z"/>' +
    '<circle class="a2" cx="200" cy="113" r="20"/><path class="st" d="M200 100v14l9 5"/><path class="a" d="M185 241v-53h30v53z"/>' +
    grid(84, 150, 2, 2, 38, 40, 23, 24, "a2", 2) +
    grid(255, 150, 2, 2, 38, 40, 23, 24, "a2", 2) +
    '<g class="float"><path class="sa" d="M307 88V45"/><path class="a2" d="M309 45h39l-10 12 10 12h-39z"/></g>',
  travelbooking:
    '<rect class="l" x="75" y="61" width="183" height="185" rx="12"/><path class="a2" d="M90 95l45-17 49 20 57-18v117l-57 18-49-20-45 17z"/>' +
    '<path class="bd" d="M135 78v117M184 98v117"/><path class="sa" d="M114 174q55-83 107-20"/>' +
    '<circle class="a" cx="114" cy="174" r="7"/><circle class="a" cx="221" cy="154" r="7"/>' +
    '<rect class="l" x="238" y="157" width="89" height="85" rx="9"/><path class="a" d="M238 168q0-11 11-11h67q11 0 11 11v17h-89z"/>' +
    '<path class="st" d="M258 150v17M307 150v17"/>' +
    grid(252, 197, 3, 2, 23, 22, 12, 10, "a2", 2) +
    '<g class="float"><path class="a" d="M296 54l7 29 38 20v9l-39-9-11 23h-9l3-28-30-23v-9l32 13z"/></g>',
  bakery:
    '<ellipse class="l" cx="200" cy="236" rx="126" ry="18"/>' +
    '<path class="a" d="M92 210c-15-62 17-103 61-103s70 45 63 103z"/>' +
    '<path class="sw" d="M115 154l27-23M137 177l31-27M161 196l28-25"/>' +
    '<path class="a2" d="M231 210v-63h77v63z"/><path class="t" d="M225 147q0-24 22-24 20-30 39 0 29-3 29 24z"/>' +
    '<g class="float"><path class="sm" d="M137 86q-12-12 0-25M180 94q-12-12 0-25"/></g>',
  consulting:
    '<rect class="l" x="83" y="58" width="234" height="184" rx="12"/>' +
    '<path class="sa" d="M117 197l49-43 39 15 64-66"/><path class="sa" d="M242 103h27v27"/>' +
    '<rect class="a2" x="113" y="81" width="85" height="11" rx="4"/>' +
    '<g class="float"><circle class="a" cx="300" cy="223" r="32"/><path class="sw" d="M285 223l10 10 20-24"/></g>',
  recruitment:
    '<rect class="l" x="83" y="66" width="196" height="176" rx="12"/>' +
    '<circle class="a" cx="143" cy="119" r="24"/><path class="a2" d="M106 184q0-42 37-42t37 42z"/>' +
    '<path class="sm" d="M197 111h53M197 132h43M110 209h140"/>' +
    '<g class="float"><circle class="l" cx="279" cy="177" r="38"/><path class="sa" d="M307 206l33 33"/><path class="sa" d="M263 178l10 10 21-24"/></g>',
  marketing:
    '<path class="a" d="M89 127h61l125-57v158l-125-57H89z"/>' +
    '<path class="t" d="M118 171h35l21 65h-37z"/>' +
    '<path class="sw" d="M150 127v44"/>' +
    '<g class="float"><path class="sa" d="M302 112l31-18M310 150h38M302 188l31 18"/></g>' +
    '<circle class="a2" cx="77" cy="69" r="14"/>',
  events:
    '<rect class="l" x="93" y="87" width="214" height="150" rx="13"/>' +
    '<path class="a" d="M93 100q0-13 13-13h188q13 0 13 13v28H93z"/>' +
    '<path class="st" d="M144 73v31M256 73v31"/>' +
    grid(119, 149, 4, 2, 45, 37, 24, 17, "a2") +
    '<g class="float"><path class="a" d="M324 49l7 16 17 2-13 12 4 18-15-9-15 9 4-18-13-12 17-2z"/></g>',
  interiors:
    '<rect class="l" x="65" y="66" width="270" height="177" rx="9"/>' +
    '<rect class="a2" x="90" y="87" width="84" height="61" rx="3"/><path class="bd" d="M132 87v61M90 117h84"/>' +
    '<rect class="a" x="115" y="174" width="174" height="46" rx="10"/>' +
    '<rect class="a2" x="129" y="155" width="145" height="39" rx="10"/>' +
    '<path class="st" d="M130 220v13M274 220v13M303 134v93"/><path class="t" d="M282 134l9-35h24l10 35z"/>' +
    '<g class="float"><path class="sa" d="M81 214v-33q-23-15-11-31 18 2 11 31 16-23 27-9-3 17-27 20"/></g>',
  nonprofit:
    '<path class="a" d="M200 178l-65-58c-36-38 21-84 65-37 44-47 101-1 65 37z"/>' +
    '<path class="sa" d="M76 185l48 42h58q18-1 18-17l-56-20-24-25q-23-18-36 3zM324 185l-48 42h-58q-18-1-18-17l56-20 24-25q23-18 36 3z"/>' +
    '<g class="float"><circle class="a2" cx="85" cy="83" r="14"/><circle class="a2" cx="315" cy="83" r="14"/></g>',
  retail:
    '<path class="l" d="M106 105h188l16 136H90z"/>' +
    '<path class="sa" d="M157 111V87a43 43 0 0 1 86 0v24"/>' +
    '<rect class="a2" x="116" y="145" width="169" height="68" rx="8"/>' +
    '<g class="float"><path class="a" d="M277 151l43-43 28 28-43 43z"/><circle class="w" cx="323" cy="131" r="5"/></g>',
  photography:
    '<rect class="t" x="110" y="108" width="180" height="120" rx="18"/>' +
    '<path class="t" d="M160 108l12-24h56l12 24z"/>' +
    '<circle class="l" cx="200" cy="168" r="48"/>' +
    '<circle class="a" cx="200" cy="168" r="36"/>' +
    '<circle class="l" cx="200" cy="168" r="17"/>' +
    '<circle class="w" cx="189" cy="157" r="6"/>' +
    '<rect class="a" x="250" y="121" width="26" height="14" rx="4"/>' +
    '<g class="float"><g transform="rotate(-8 75 90)"><rect class="l" x="38" y="58" width="74" height="60" rx="6"/>' +
    '<path class="a2" d="M46 110l22-28 14 16 10-10 14 22z"/></g></g>' +
    '<g class="float slow"><g transform="rotate(7 330 96)"><rect class="l" x="293" y="64" width="74" height="60" rx="6"/>' +
    '<circle class="a" cx="316" cy="86" r="7"/><path class="a2" d="M301 116l22-20 14 12 22-22v30z"/></g></g>',

  software:
    '<rect class="l" x="64" y="62" width="264" height="172" rx="14"/>' +
    '<path class="a" d="M64 76a14 14 0 0 1 14-14h236a14 14 0 0 1 14 14v20H64z"/>' +
    '<circle class="w" cx="86" cy="79" r="4.5"/><circle class="w" cx="102" cy="79" r="4.5"/><circle class="w" cx="118" cy="79" r="4.5"/>' +
    '<rect class="a" x="86" y="116" width="58" height="10" rx="5"/><rect class="t" x="152" y="116" width="96" height="10" rx="5"/>' +
    '<rect class="t" x="106" y="138" width="78" height="10" rx="5"/><rect class="a2" x="192" y="138" width="62" height="10" rx="5"/>' +
    '<rect class="m" x="106" y="160" width="112" height="10" rx="5" opacity=".6"/>' +
    '<rect class="a" x="86" y="182" width="48" height="10" rx="5"/><rect class="t" x="142" y="182" width="104" height="10" rx="5"/>' +
    '<rect class="a" x="86" y="204" width="4" height="14" rx="2"/>' +
    '<g class="float"><circle class="a" cx="340" cy="72" r="28"/>' +
    '<path class="sw" d="M331 63l-9 9 9 9M349 63l9 9-9 9"/></g>' +
    '<g class="float slow"><rect class="a2" x="30" y="190" width="56" height="40" rx="10"/>' +
    '<path class="sa" d="M44 210h28M44 220h16"/></g>',

  food:
    '<g class="float"><path class="sm" d="M168 100c-12-14 12-24 0-40M200 104c-12-14 12-24 0-40M232 100c-12-14 12-24 0-40"/></g>' +
    '<ellipse class="l" cx="200" cy="236" rx="116" ry="17"/>' +
    '<path class="a" d="M130 130h140v40a70 62 0 0 1-140 0z"/>' +
    '<path class="sa" d="M270 150h16a22 22 0 0 1 0 44h-24" stroke-width="10"/>' +
    '<ellipse class="a2" cx="200" cy="130" rx="70" ry="13"/>' +
    '<ellipse class="t" cx="200" cy="133" rx="60" ry="8" opacity=".85"/>' +
    '<circle class="a2" cx="322" cy="82" r="20"/><circle class="a2" cx="72" cy="104" r="12"/>' +
    '<path class="a" d="M60 236q20-34 40-6-10 14-40 6z" opacity=".8"/>',

  fitness:
    '<rect class="t" x="118" y="146" width="164" height="14" rx="7"/>' +
    '<rect class="a" x="92" y="108" width="28" height="90" rx="8"/><rect class="a" x="66" y="124" width="22" height="58" rx="7"/>' +
    '<rect class="a" x="280" y="108" width="28" height="90" rx="8"/><rect class="a" x="312" y="124" width="22" height="58" rx="7"/>' +
    '<path class="sa" d="M40 252h82l14-30 22 56 16-40 12 14h174" stroke-width="5"/>' +
    '<g class="float"><circle class="a2" cx="330" cy="62" r="20"/></g>' +
    '<g class="float slow"><circle class="a2" cx="70" cy="70" r="14"/></g>',

  health:
    '<circle class="l" cx="200" cy="138" r="82"/>' +
    '<rect class="a" x="182" y="96" width="36" height="84" rx="9"/><rect class="a" x="158" y="120" width="84" height="36" rx="9"/>' +
    '<path class="sa" d="M36 250h92l14-28 20 52 16-36 12 12h170" stroke-width="5"/>' +
    '<g class="float"><path class="sa" d="M320 62v28M306 76h28" stroke-width="5"/></g>' +
    '<g class="float slow"><path class="sa" d="M72 72v20M62 82h20" stroke-width="4"/></g>',

  legal:
    '<rect class="t" x="194" y="92" width="12" height="124" rx="4"/>' +
    '<rect class="t" x="146" y="212" width="108" height="14" rx="6"/>' +
    '<circle class="a" cx="200" cy="84" r="13"/>' +
    '<rect class="t" x="86" y="104" width="228" height="8" rx="4"/>' +
    '<path class="st" d="M104 112L78 174M104 112L130 174M296 112L270 174M296 112L322 174" stroke-width="3"/>' +
    '<path class="a" d="M66 174h72a36 26 0 0 1-72 0z"/>' +
    '<path class="a" d="M262 174h72a36 26 0 0 1-72 0z"/>' +
    '<g class="float"><circle class="a2" cx="342" cy="58" r="18"/></g>',

  realestate:
    '<rect class="a3" x="0" y="232" width="400" height="68"/>' +
    '<rect class="l" x="116" y="142" width="136" height="90"/>' +
    '<path class="a" d="M102 148L184 82l82 66z"/>' +
    '<rect class="a" x="168" y="184" width="32" height="48" rx="3"/>' +
    '<rect class="a2" x="130" y="160" width="28" height="24" rx="3"/><rect class="a2" x="210" y="160" width="28" height="24" rx="3"/>' +
    '<rect class="t" x="276" y="108" width="76" height="124" rx="4"/>' +
    grid(288, 122, 3, 4, 22, 26, 14, 14, "l") +
    '<circle class="a2" cx="70" cy="188" r="30"/><rect class="t" x="66" y="206" width="8" height="26"/>' +
    '<g class="float"><circle class="a" cx="332" cy="66" r="20"/></g>',

  education:
    '<g class="float"><path class="t" d="M200 36l86 34-86 34-86-34z"/>' +
    '<path class="t" d="M150 90v28c0 12 100 12 100 0V90l-50 18z"/>' +
    '<path class="sa" d="M286 72v40" stroke-width="4"/><circle class="a" cx="286" cy="116" r="7"/></g>' +
    '<path class="l" d="M200 150C170 132 124 130 90 142v82c34-12 80-10 110 10z"/>' +
    '<path class="l" d="M200 150c30-18 76-20 110-8v82c-34-12-80-10-110 10z"/>' +
    '<rect class="a" x="110" y="160" width="68" height="8" rx="4"/><rect class="a2" x="110" y="180" width="62" height="7" rx="3"/>' +
    '<rect class="a2" x="110" y="196" width="56" height="7" rx="3"/>' +
    '<rect class="a" x="224" y="160" width="68" height="8" rx="4"/><rect class="a2" x="224" y="180" width="62" height="7" rx="3"/>' +
    '<rect class="a2" x="224" y="196" width="56" height="7" rx="3"/>',

  travel:
    '<g class="float slow"><circle class="a" cx="104" cy="82" r="30"/></g>' +
    '<path class="a2" d="M70 244L178 112l126 132z"/>' +
    '<path class="a" d="M-10 244L96 140l92 104z"/>' +
    '<path class="l" d="M74 164l22-24 22 24-12-6-10 10-10-10z"/>' +
    '<rect class="a3" y="240" width="400" height="60"/>' +
    '<g class="float"><path class="t" d="M246 78L356 38l-50 92-20-34z"/>' +
    '<path class="m" d="M286 96L356 38l-54 74z" opacity=".55"/></g>' +
    '<path class="sm" d="M96 262h40M156 262h60M236 262h28" stroke-width="4" opacity=".5"/>',

  fashion:
    '<path class="st" d="M200 76c0-12 16-14 16-28 0-12-20-14-26 0" stroke-width="5"/>' +
    '<path class="st" d="M200 78L96 148q-8 10 6 10h196q14 0 6-10z" stroke-width="6"/>' +
    '<path class="a" d="M128 164l40-10q32 22 64 0l40 10 34 44-34 14-10-20v70H138v-70l-10 20-34-14z"/>' +
    '<circle class="w" cx="200" cy="186" r="4"/><circle class="w" cx="200" cy="206" r="4"/><circle class="w" cx="200" cy="226" r="4"/>' +
    '<g class="float"><circle class="a2" cx="326" cy="84" r="22"/></g>' +
    '<g class="float slow"><circle class="a2" cx="70" cy="110" r="14"/></g>',

  music:
    '<circle class="t" cx="184" cy="156" r="92"/>' +
    '<circle class="bd" cx="184" cy="156" r="76"/><circle class="bd" cx="184" cy="156" r="62"/><circle class="bd" cx="184" cy="156" r="50"/>' +
    '<circle class="a" cx="184" cy="156" r="30"/><circle class="l" cx="184" cy="156" r="6"/>' +
    '<path class="st" d="M332 50v78l-34 62" stroke-width="7"/>' +
    '<g transform="rotate(-28 296 192)"><rect class="a" x="284" y="186" width="24" height="15" rx="3"/></g>' +
    '<g class="float"><circle class="a" cx="64" cy="86" r="12"/><path class="sa" d="M75 86V42l28 8" stroke-width="5"/></g>' +
    '<g class="float slow"><circle class="a2" cx="348" cy="232" r="10"/><path class="sa" d="M357 232v-30l20 5" stroke-width="4"/></g>',

  beauty:
    '<circle class="l" cx="176" cy="126" r="74"/>' +
    '<circle class="a3" cx="176" cy="126" r="62"/>' +
    '<circle class="sa" cx="176" cy="126" r="74" stroke-width="10"/>' +
    '<path class="sa" d="M132 100a52 52 0 0 1 34-26" stroke-width="6" opacity=".7"/>' +
    '<rect class="a" x="168" y="198" width="16" height="72" rx="8"/>' +
    '<g class="float"><path class="a" d="M306 62l7 18 18 7-18 7-7 18-7-18-18-7 18-7z"/></g>' +
    '<g class="float slow"><path class="a2" d="M70 216l5 13 13 5-13 5-5 13-5-13-13-5 13-5z"/></g>' +
    '<g class="float slow"><path class="a2" d="M330 196l4 10 10 4-10 4-4 10-4-10-10-4 10-4z"/></g>',

  finance:
    '<rect class="m" x="68" y="242" width="268" height="4" rx="2" opacity=".4"/>' +
    '<rect class="a2" x="92" y="190" width="38" height="52" rx="5"/><rect class="a2" x="142" y="160" width="38" height="82" rx="5"/>' +
    '<rect class="a2" x="192" y="132" width="38" height="110" rx="5"/><rect class="a" x="242" y="96" width="38" height="146" rx="5"/>' +
    '<path class="st" d="M96 182l66-34 50 20 70-80" stroke-width="5"/>' +
    '<path class="st" d="M262 90h22v22" stroke-width="5"/>' +
    '<g class="float"><circle class="a" cx="68" cy="84" r="30"/><path class="sw" d="M77 74c-3-9-23-9-23 3s23 7 23 19-20 11-26 1M66 64v42" stroke-width="4"/></g>' +
    '<g class="float slow"><circle class="a2" cx="336" cy="214" r="18"/></g>',

  construction:
    '<path class="a" d="M108 196a92 92 0 0 1 184 0z"/>' +
    '<rect class="t" x="88" y="194" width="224" height="24" rx="12"/>' +
    '<rect class="w" x="186" y="116" width="28" height="78" rx="6" opacity=".55"/>' +
    '<path class="sa" d="M50 262l30-30 30 30 30-30 30 30 30-30 30 30 30-30 30 30 30-30 30 30" stroke-width="5"/>' +
    '<g class="float"><circle class="a2" cx="334" cy="70" r="20"/></g>' +
    '<g class="float slow"><circle class="a2" cx="66" cy="92" r="13"/></g>',

  creative:
    '<path class="l" d="M200 66C122 66 68 114 68 170c0 50 50 72 92 62 22-5 12-30 30-34 24-6 42 22 82 6 40-17 54-62 30-102C285 86 252 66 200 66z"/>' +
    '<circle class="a" cx="128" cy="134" r="18"/><circle class="t" cx="182" cy="100" r="15"/>' +
    '<circle class="a2" cx="244" cy="114" r="16"/><circle class="m" cx="100" cy="190" r="14" opacity=".7"/>' +
    '<circle class="bg" cx="262" cy="178" r="15"/>' +
    '<g class="float"><g transform="rotate(35 330 96)"><rect class="t" x="324" y="40" width="12" height="96" rx="6"/>' +
    '<rect class="a" x="322" y="130" width="16" height="34" rx="6"/></g></g>',

  writing:
    '<rect class="l" x="102" y="54" width="176" height="208" rx="12"/>' +
    '<rect class="a" x="124" y="82" width="92" height="13" rx="6"/>' +
    '<rect class="m" x="124" y="112" width="132" height="8" rx="4" opacity=".5"/>' +
    '<rect class="m" x="124" y="132" width="120" height="8" rx="4" opacity=".5"/>' +
    '<rect class="m" x="124" y="152" width="132" height="8" rx="4" opacity=".5"/>' +
    '<rect class="m" x="124" y="172" width="100" height="8" rx="4" opacity=".5"/>' +
    '<rect class="a2" x="124" y="198" width="132" height="40" rx="6"/>' +
    '<g class="float"><g transform="rotate(38 312 170)"><rect class="t" x="302" y="84" width="20" height="116" rx="6"/>' +
    '<path class="a" d="M302 200h20l-10 30z"/></g></g>',

  motorsport:
    '<rect class="a3" x="0" y="248" width="400" height="52"/>' +
    '<path class="sm" d="M20 172h46M8 196h62M28 220h40" stroke-width="5" opacity=".5"/>' +
    '<path class="t" d="M118 214C112 138 156 84 226 84c58 0 92 40 92 94v28c0 14-10 24-24 24H146c-16 0-26-8-28-16z"/>' +
    '<path class="a2" d="M150 120c20-24 52-34 84-30l-4 22c-26-4-50 4-68 22z"/>' +
    '<path class="a" d="M196 128h112c6 0 10 4 10 10v26c0 6-4 10-10 10H192c-8 0-12-6-10-14l6-26c2-4 4-6 8-6z"/>' +
    '<path class="sw" d="M212 142h54" opacity=".75"/>' +
    '<rect class="m" x="238" y="206" width="46" height="8" rx="4" opacity=".6"/>' +
    '<rect class="t" x="330" y="60" width="6" height="190" rx="3"/>' +
    '<g class="float slow"><rect class="l" x="336" y="64" width="64" height="48" rx="2"/>' +
    checker(336, 64, 4, 3, 16, "t") +
    "</g>",

  automotive:
    '<rect class="a3" x="0" y="238" width="400" height="62"/>' +
    '<path class="sm" d="M10 172h28M4 194h34" stroke-width="5" opacity=".5"/>' +
    '<path class="a" d="M52 214v-26c0-10 6-18 16-20l38-8 34-34c6-6 12-8 20-8h74c12 0 20 4 28 12l26 30 28 8c14 4 22 12 22 24v22z"/>' +
    '<path class="l" d="M118 156l26-26c4-4 8-5 14-5h34v31z"/>' +
    '<path class="l" d="M200 125h30c8 0 12 3 18 9l18 22h-66z"/>' +
    '<rect class="w" x="326" y="178" width="12" height="10" rx="3"/>' +
    '<circle class="t" cx="122" cy="216" r="30"/><circle class="l" cx="122" cy="216" r="13"/>' +
    '<circle class="t" cx="270" cy="216" r="30"/><circle class="l" cx="270" cy="216" r="13"/>' +
    '<g class="float"><circle class="a2" cx="72" cy="78" r="22"/></g>' +
    '<g class="float slow"><circle class="a2" cx="336" cy="68" r="14"/></g>',

  sports:
    '<rect class="a3" x="0" y="244" width="400" height="56"/>' +
    '<path class="a" d="M150 76h100v62a50 50 0 0 1-100 0z"/>' +
    '<path class="sa" d="M150 94h-24a26 26 0 0 0 26 48M250 94h24a26 26 0 0 1-26 48"/>' +
    '<path class="w" d="M200 96l9 20 21 2-16 14 5 21-19-11-19 11 5-21-16-14 21-2z"/>' +
    '<rect class="t" x="190" y="186" width="20" height="40"/>' +
    '<rect class="t" x="146" y="224" width="108" height="20" rx="6"/>' +
    '<g class="float"><circle class="a" cx="82" cy="92" r="14"/></g>' +
    '<g class="float slow"><rect class="a2" x="306" y="66" width="24" height="24" rx="5"/></g>' +
    '<g class="float slow"><circle class="a2" cx="330" cy="170" r="9"/></g>',

  pets:
    '<ellipse class="a" cx="120" cy="140" rx="20" ry="28"/>' +
    '<ellipse class="a" cx="170" cy="96" rx="22" ry="30"/>' +
    '<ellipse class="a" cx="232" cy="96" rx="22" ry="30"/>' +
    '<ellipse class="a" cx="282" cy="140" rx="20" ry="28"/>' +
    '<path class="a" d="M200 150c-46 0-84 40-70 78 8 22 36 14 70 14s62 8 70-14c14-38-24-78-70-78z"/>' +
    '<g class="float"><path class="a2" d="M330 70c-8-14-30-6-24 12 4 12 24 24 24 24s20-12 24-24c6-18-16-26-24-12z"/></g>' +
    '<g class="float slow"><circle class="a2" cx="66" cy="84" r="12"/></g>',

  gaming:
    '<rect class="a" x="118" y="92" width="52" height="16" rx="8"/><rect class="a" x="230" y="92" width="52" height="16" rx="8"/>' +
    '<path class="t" d="M96 150c0-28 20-44 48-44h112c28 0 48 16 48 44 0 34-8 78-30 88-18 8-30-8-46-26H172c-16 18-28 34-46 26-22-10-30-54-30-88z"/>' +
    '<rect class="w" x="130" y="146" width="40" height="12" rx="3"/><rect class="w" x="144" y="132" width="12" height="40" rx="3"/>' +
    '<circle class="a" cx="262" cy="132" r="10"/><circle class="a" cx="262" cy="172" r="10"/>' +
    '<circle class="a" cx="242" cy="152" r="10"/><circle class="a" cx="282" cy="152" r="10"/>' +
    '<circle class="m" cx="200" cy="178" r="12" opacity=".7"/>' +
    '<g class="float"><path class="a" d="M70 90l5 12 13 1-10 9 3 13-11-7-11 7 3-13-10-9 13-1z"/></g>' +
    '<g class="float slow"><circle class="a2" cx="340" cy="80" r="18"/></g>',

  floral:
    '<rect class="t" x="196" y="170" width="8" height="82" rx="4"/>' +
    '<path class="a2" d="M200 226c-42-6-58-34-54-54 32-2 54 18 54 54z"/>' +
    '<path class="a2" d="M200 204c38-4 54-30 50-50-30-2-50 14-50 50z"/>' +
    [0, 60, 120, 180, 240, 300]
      .map((deg) => `<ellipse class="a" cx="200" cy="94" rx="20" ry="32" transform="rotate(${deg} 200 130)"/>`)
      .join("") +
    '<circle class="w" cx="200" cy="130" r="20"/>' +
    '<g class="float"><circle class="a2" cx="84" cy="92" r="14"/></g>' +
    '<g class="float slow"><circle class="a2" cx="326" cy="76" r="10"/></g>',

  community:
    '<path class="a2" d="M70 236a34 34 0 0 1 68 0z"/><path class="a2" d="M262 236a34 34 0 0 1 68 0z"/>' +
    '<circle class="a2" cx="104" cy="170" r="22"/><circle class="a2" cx="296" cy="170" r="22"/>' +
    '<path class="a" d="M156 242a44 44 0 0 1 88 0z"/><circle class="a" cx="200" cy="150" r="28"/>' +
    '<rect class="t" x="40" y="242" width="320" height="6" rx="3" opacity=".5"/>' +
    '<g class="float"><path class="a2" d="M200 86c-8-14-30-6-24 12 4 12 24 24 24 24s20-12 24-24c6-18-16-26-24-12z"/></g>',

  homeservices:
    '<rect class="a3" x="0" y="238" width="400" height="62"/>' +
    '<path class="a" d="M100 152L200 74l100 78z"/>' +
    '<rect class="l" x="122" y="152" width="156" height="88"/>' +
    '<rect class="a" x="180" y="184" width="40" height="56" rx="3"/>' +
    '<rect class="a2" x="136" y="170" width="30" height="26" rx="3"/><rect class="a2" x="234" y="170" width="30" height="26" rx="3"/>' +
    '<g class="float"><path class="a" d="M330 66l7 18 18 7-18 7-7 18-7-18-18-7 18-7z"/></g>' +
    '<g class="float slow"><path class="a2" d="M72 96l5 13 13 5-13 5-5 13-5-13-13-5 13-5z"/></g>',

  business:
    '<rect class="a3" x="0" y="238" width="400" height="62"/>' +
    '<rect class="a2" x="70" y="150" width="54" height="88" rx="3"/>' +
    '<rect class="a" x="132" y="104" width="62" height="134" rx="3"/>' +
    '<rect class="m" x="202" y="160" width="50" height="78" rx="3" opacity=".55"/>' +
    '<rect class="t" x="260" y="82" width="66" height="156" rx="3" opacity=".9"/>' +
    grid(144, 118, 3, 5, 18, 24, 11, 14, "w", 2) +
    grid(272, 96, 3, 6, 19, 24, 12, 14, "l", 2) +
    '<g class="float"><circle class="a" cx="92" cy="80" r="22"/></g>',
};

/** Decorative inline SVG for an industry. Safe to embed: static, no user input. */
export function sceneSvg(industry: IndustryId): string {
  return (
    `<svg class="art" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">` +
    `${BASE}${SCENES[industry]}</svg>`
  );
}
