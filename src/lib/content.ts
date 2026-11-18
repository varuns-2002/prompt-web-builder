import { packFor, usesIndustryDefaults } from "./industry-content";
import type { ContentItem, SiteContent, SiteSpec, SiteType } from "./types";

type Copy = Omit<SiteContent, "brand" | "ctaLabel" | "gallery" | "aboutImage" | "labels">;

const COPY: Record<SiteType, (audience: string) => Copy & { cta: string }> = {
  portfolio: (who) => ({
    cta: "View my work",
    headline: `Thoughtful work from a ${who}`,
    tagline:
      "I design and build clear, reliable things that people enjoy using. Take a look at a few recent projects.",
    about: `I'm a ${who} focused on quality, communication and getting details right. I enjoy turning rough ideas into finished work.`,
    features: [
      { title: "Strategy", body: "Understanding goals before choosing tools." },
      { title: "Craft", body: "Careful, well-tested and maintainable work." },
      { title: "Collaboration", body: "Clear updates and fast feedback loops." },
    ],
    projects: [
      { title: "Project Atlas", body: "A planning dashboard for distributed teams.", meta: "2025" },
      { title: "Harbor", body: "A booking experience for small venues.", meta: "2024" },
      { title: "Field Notes", body: "A lightweight note-taking companion.", meta: "2023" },
    ],
    menu: [],
    posts: [],
    plans: [],
    testimonials: [],
  }),
  business: (who) => ({
    cta: "Book a consultation",
    headline: `Reliable services for ${who}`,
    tagline:
      "We help teams plan, launch and grow with practical advice and dependable delivery.",
    about:
      "We are a small, experienced team that values transparency, measurable results and long-term relationships.",
    features: [
      { title: "Advisory", body: "Clear direction backed by experience." },
      { title: "Delivery", body: "Projects shipped on time and on budget." },
      { title: "Support", body: "Responsive help after launch." },
    ],
    projects: [],
    menu: [],
    posts: [],
    plans: [],
    testimonials: [],
  }),
  product: (who) => ({
    cta: "Get started free",
    headline: `The simpler way to work, built for ${who}`,
    tagline:
      "Everything you need in one place. Set up in minutes, no training required.",
    about: "Built by a team that believes good tools should get out of your way.",
    features: [
      { title: "Fast setup", body: "Be productive within minutes." },
      { title: "Works everywhere", body: "Desktop, tablet and phone." },
      { title: "Private by default", body: "Your data stays yours." },
    ],
    projects: [],
    menu: [],
    posts: [],
    plans: [
      { title: "Starter", body: "For individuals getting going.", meta: "$0" },
      { title: "Team", body: "Collaboration for growing teams.", meta: "$12" },
      { title: "Scale", body: "Advanced controls and support.", meta: "$39" },
    ],
    testimonials: [],
  }),
  blog: (who) => ({
    cta: "Read the latest",
    headline: `Notes and ideas for ${who}`,
    tagline: "Short, honest writing on the things worth paying attention to.",
    about: "A small publication run by people who like to explain things clearly.",
    features: [],
    projects: [],
    menu: [],
    posts: [
      { title: "Starting small", body: "Why the first version should be modest.", meta: "5 min read" },
      { title: "Making time to think", body: "A practical routine for deeper work.", meta: "7 min read" },
      { title: "What we learned this year", body: "Lessons, mistakes and next steps.", meta: "4 min read" },
    ],
    plans: [],
    testimonials: [],
  }),
  restaurant: (who) => ({
    cta: "Reserve a table",
    headline: `Seasonal food, made fresh for ${who}`,
    tagline: "Relaxed, welcoming and cooked from scratch every day.",
    about:
      "We work with local growers and bakers to build a short menu that changes with the seasons.",
    features: [],
    projects: [],
    menu: [
      { title: "Roasted tomato soup", body: "Basil oil, toasted sourdough.", meta: "$9" },
      { title: "Wild mushroom pasta", body: "Thyme, parmesan, brown butter.", meta: "$18" },
      { title: "Lemon olive-oil cake", body: "Whipped cream, seasonal fruit.", meta: "$8" },
    ],
    posts: [],
    plans: [],
    testimonials: [],
  }),
};

const SHARED_TESTIMONIALS = [
  { title: "Jordan P.", body: "Clear, friendly and genuinely helpful from the start." },
  { title: "Sam R.", body: "Exactly what we needed, delivered without the fuss." },
  { title: "Priya K.", body: "I would recommend them without hesitation." },
];

type ListKey = "features" | "projects" | "menu" | "posts" | "plans" | "testimonials";

function firstFilled(...lists: Array<ContentItem[] | undefined>): ContentItem[] {
  return lists.find((list) => list && list.length > 0) ?? [];
}

/**
 * Builds placeholder copy from the spec. Users edit it afterwards.
 *
 * Personal and business sites take their wording from the industry pack, so a
 * racing driver's site talks about race results and a clinic's about care.
 * Software product pages keep their own copy; specialised product industries
 * use their packs for relevant showcase copy rather than generic SaaS claims.
 * Blogs keep a blog's voice but write
 * about the industry's topic. Any list the pack does not cover falls back to
 * generic copy, so every section a user turns on still has sensible content.
 */
export function buildContent(spec: SiteSpec): SiteContent {
  const who = spec.audience ?? defaultAudience(spec.type);
  const { cta, ...base } = COPY[spec.type](who);
  const pack = packFor(spec.industry);

  const lead = pack && usesIndustryDefaults(spec.type, spec.industry) ? pack : null;
  const topicBlog = pack && spec.type === "blog" && spec.industry !== "writing" ? pack : null;
  const primary = lead ?? topicBlog;

  const list = (key: ListKey, ...fallbacks: ContentItem[][]): ContentItem[] =>
    firstFilled(primary?.[key], base[key], pack?.[key], ...fallbacks);

  return {
    brand: spec.brand,
    ctaLabel: lead?.cta ?? cta,
    headline: lead?.headline ?? (topicBlog ? `Stories and ideas about ${topicBlog.topic}` : base.headline),
    tagline: lead?.tagline ?? base.tagline,
    about: lead?.about ?? base.about,
    features: list("features", COPY.business(who).features),
    projects: list("projects", COPY.portfolio(who).projects),
    menu: list("menu", COPY.restaurant(who).menu),
    posts: list("posts", COPY.blog(who).posts),
    plans: list("plans", COPY.product(who).plans),
    testimonials: list("testimonials", SHARED_TESTIMONIALS),
    gallery: [],
    labels: lead?.labels,
  };
}

function defaultAudience(type: SiteType): string {
  switch (type) {
    case "portfolio":
      return "creative professional";
    case "restaurant":
      return "neighbours and visitors";
    case "blog":
      return "curious readers";
    case "product":
      return "busy teams";
    default:
      return "growing teams";
  }
}
