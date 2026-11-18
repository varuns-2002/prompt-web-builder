import type {
  BodySectionKind,
  ContentItem,
  IndustryId,
  PaletteId,
  SectionKind,
  SectionLabel,
  SiteSpec,
  SiteType,
  ThemeMode,
} from "./types";

/**
 * Everything that makes a generated site feel written for its industry: the
 * headline and about text, what the sections are called, the sample cards,
 * reviews and posts, and sensible default sections and colors. All of it is
 * placeholder copy the user can edit.
 */
export interface IndustryPack {
  /** Fictional placeholder name. */
  brand: string;
  /** The subject, used in sentences such as "Stories and ideas about travel". */
  topic: string;
  cta: string;
  headline: string;
  tagline: string;
  about: string;
  features: ContentItem[];
  projects: ContentItem[];
  testimonials: ContentItem[];
  posts: ContentItem[];
  menu?: ContentItem[];
  plans?: ContentItem[];
  labels: Partial<Record<BodySectionKind, SectionLabel>>;
  /** Replaces the default sections for personal and business sites in this industry. */
  sections?: SectionKind[];
  palette?: PaletteId;
  mode?: ThemeMode;
  /** Keep specialist copy when the prompt asks for a product or landing page. */
  productDefaults?: boolean;
}

const i = (title: string, body: string, meta?: string): ContentItem => (meta ? { title, body, meta } : { title, body });
const L = (title: string, nav: string): SectionLabel => ({ title, nav });

export const DEFAULT_BRAND: Record<SiteType, string> = {
  portfolio: "Alex Morgan",
  business: "Northwind Co.",
  product: "Lumio",
  blog: "The Daily Notebook",
  restaurant: "Olive & Thyme",
};

export const INDUSTRY_PACKS: Record<Exclude<IndustryId, "business">, IndustryPack> = {
  dental: {
    brand: "Willow Dental",
    topic: "dental care",
    cta: "Ask about an appointment",
    headline: "A welcoming place to talk about your smile",
    tagline: "Clear explanations and thoughtful dental care for every stage of life.",
    about: "Our fictional practice puts conversation first, with time to discuss your questions and explain care options. Use this website to introduce your team and receive appointment enquiries; it does not schedule appointments or provide medical advice.",
    features: [
      i("Routine visits", "Learn about check-ups and discuss your questions with the practice."),
      i("Family dentistry", "A friendly introduction to dental visits for families."),
      i("Care conversations", "Discuss treatment options and next steps with a qualified dentist."),
    ],
    projects: [
      i("Meet the practice", "A sample introduction to our reception and treatment spaces.", "Practice tour"),
      i("Your first visit", "What to ask when arranging an initial consultation.", "Visitor guide"),
      i("Our approach", "Time for questions, clear explanations and considered decisions.", "Patient experience"),
    ],
    testimonials: [
      i("Jamie L.", "The team gave me time to ask my questions."),
      i("Morgan S.", "A friendly welcome and clear explanations."),
      i("Ari K.", "It was easy to ask about arranging a visit."),
    ],
    posts: [
      i("Preparing for a visit", "Questions and information to bring to your dental appointment.", "3 min read"),
      i("Getting to know the team", "Who you may meet at the practice.", "4 min read"),
      i("Discussing care options", "Make a list of questions for your qualified dental professional.", "3 min read"),
    ],
    labels: { features: L("Dental services", "Services"), projects: L("Explore the practice", "Practice"), testimonials: L("Sample patient comments", "Comments"), contact: L("Appointment enquiries", "Enquiries") },
    sections: ["hero", "about", "features", "projects", "testimonials", "contact"],
    palette: "sky",
    productDefaults: true,
  },
  cleaning: {
    brand: "Brightnest Cleaning",
    topic: "home and office cleaning",
    cta: "Request a cleaning quote",
    headline: "A fresher space, with the details taken care of",
    tagline: "Home and office cleaning planned around your space and priorities.",
    about: "We begin with your checklist, agree on the scope and arrange a cleaning visit that suits the space. This sample business offers home, office and move-out cleaning with straightforward quote enquiries.",
    features: [
      i("Home cleaning", "Plan regular or one-off cleaning for the rooms you use most."),
      i("Office cleaning", "Agree on a checklist for shared workspaces and meeting rooms."),
      i("Move-out cleaning", "Discuss an end-of-tenancy clean with a clear scope."),
    ],
    projects: [
      i("Apartment refresh", "A sample room-by-room clean before new tenants arrive.", "Residential"),
      i("Workspace reset", "A sample evening cleaning checklist for a small office.", "Commercial"),
      i("Seasonal deep clean", "An example plan for overlooked corners and high-use spaces.", "One-off"),
    ],
    testimonials: [
      i("Casey D.", "The checklist matched exactly what we discussed."),
      i("Taylor M.", "It was straightforward to arrange a quote."),
      i("Robin A.", "Clear updates before and after the visit."),
    ],
    posts: [
      i("Building your cleaning checklist", "Choose priorities before requesting a quote.", "4 min read"),
      i("Preparing for a cleaning visit", "A few details that help the team plan the work.", "3 min read"),
      i("One-off or regular cleaning?", "Compare the scope of different cleaning visits.", "3 min read"),
    ],
    labels: { features: L("Cleaning services", "Services"), projects: L("Example cleaning plans", "Our work"), testimonials: L("Sample client comments", "Comments"), contact: L("Tell us about your space", "Get a quote") },
    sections: ["hero", "about", "features", "projects", "testimonials", "contact"],
    palette: "emerald",
    productDefaults: true,
  },
  logistics: {
    brand: "Waypoint Logistics",
    topic: "freight and logistics",
    cta: "Discuss your shipment",
    headline: "Keep your next shipment moving with a clear plan",
    tagline: "Freight coordination, warehousing and delivery enquiries in one place.",
    about: "We help businesses plan the movement of goods with clear requirements, agreed handovers and regular communication. Routes and projects shown here are fictional examples; this showcase does not offer live tracking or instant shipping rates.",
    features: [
      i("Freight coordination", "Discuss shipment size, route requirements and handling needs."),
      i("Warehouse support", "Plan storage, picking and dispatch arrangements."),
      i("Delivery planning", "Coordinate collection windows and destination requirements."),
    ],
    projects: [
      i("Regional distribution", "An example delivery plan connecting a warehouse and local stores.", "Road freight"),
      i("Seasonal stock movement", "A sample staging plan for a retailer's busy period.", "Warehousing"),
      i("Business delivery route", "An example collection and handover schedule.", "Distribution"),
    ],
    testimonials: [
      i("Sam P.", "We knew which details to provide before collection."),
      i("Lee W.", "Clear communication around the proposed route."),
      i("Drew C.", "The team helped us organise our shipment brief."),
    ],
    posts: [
      i("Preparing a shipment brief", "Dimensions, destinations and handling requirements to include.", "4 min read"),
      i("Understanding handovers", "Agree on responsibilities before goods begin their journey.", "5 min read"),
      i("Planning seasonal capacity", "Start conversations about storage and dispatch early.", "3 min read"),
    ],
    labels: { features: L("Logistics services", "Services"), projects: L("Example delivery projects", "Projects"), contact: L("Shipment and route enquiries", "Enquiries") },
    sections: ["hero", "about", "features", "projects", "testimonials", "contact"],
    palette: "sky",
    productDefaults: true,
  },
  agriculture: {
    brand: "Meadowline Farm",
    topic: "agriculture and seasonal growing",
    cta: "Enquire about our produce",
    headline: "Rooted in the land, growing with the seasons",
    tagline: "Meet the growers, explore seasonal produce and start a farm enquiry.",
    about: "Our fictional family farm shares the story behind its fields and the people who tend them. Explore sample produce, growing projects and supplier enquiries. Crop availability and farm visits must be confirmed with the team.",
    features: [
      i("Seasonal produce", "Ask about vegetables, grains and what is currently available."),
      i("Grower partnerships", "Discuss supply needs with the people planning the harvest."),
      i("Farm enquiries", "Contact the team about produce collections and farm visits."),
    ],
    projects: [
      i("Kitchen garden", "An example rotation of seasonal vegetables for local buyers.", "Vegetables"),
      i("Orchard season", "A sample harvest story from the fruit-growing rows.", "Fruit"),
      i("Field-to-market", "An example collaboration with a neighbourhood market.", "Local supply"),
    ],
    testimonials: [
      i("Harper B.", "We enjoyed learning where the produce comes from."),
      i("Alex N.", "The growers helped us understand seasonal availability."),
      i("Charlie F.", "A thoughtful conversation about our supply needs."),
    ],
    posts: [
      i("What is in season?", "A look at how the farm plans its produce calendar.", "4 min read"),
      i("Meet the growers", "The people behind our sample farm story.", "3 min read"),
      i("Planning a produce enquiry", "Quantities, timing and collection details to discuss.", "3 min read"),
    ],
    labels: { features: L("From our farm", "Produce"), projects: L("Growing projects", "The farm"), gallery: L("Life on the farm", "Gallery"), contact: L("Produce and partnership enquiries", "Enquiries") },
    sections: ["hero", "about", "features", "projects", "gallery", "testimonials", "contact"],
    palette: "emerald",
    productDefaults: true,
  },
  aitools: {
    brand: "Threadlight AI",
    topic: "AI-assisted workflows",
    cta: "Ask for a product demo",
    headline: "Explore a more thoughtful AI workflow",
    tagline: "Showcase how an assistant could support drafting, research and everyday tasks.",
    about: "Threadlight AI is a fictional product concept for teams exploring AI-assisted work. The workflows on this website are examples, not a connected AI service. Ask about a demo and discuss review, privacy and integration requirements before adopting a tool.",
    features: [
      i("Drafting workflows", "Illustrate how a team could prepare drafts for human review."),
      i("Research organisation", "Show an example workspace for source notes and open questions."),
      i("Review checkpoints", "Explain where people verify outputs and make the final decision."),
    ],
    projects: [
      i("Content planning", "A sample brief-to-draft workflow with editorial review.", "Example workflow"),
      i("Meeting preparation", "A concept for organising agenda notes and discussion points.", "Product concept"),
      i("Support knowledge", "An example handover from a suggested draft to a human reviewer.", "Human review"),
    ],
    plans: [
      i("Individual concept", "Discuss a proposed workflow for one person.", "Enquire"),
      i("Team concept", "Explore review steps and collaboration needs.", "Request a demo"),
      i("Custom concept", "Discuss integration scope and data requirements.", "Contact us"),
    ],
    testimonials: [
      i("A product reviewer", "The example clearly showed where human review fits."),
      i("A team lead", "A helpful starting point for our workflow discussion."),
      i("A design partner", "The concept made our integration questions concrete."),
    ],
    posts: [
      i("Start with a workflow", "Define the task before selecting an AI tool.", "4 min read"),
      i("Reviewing generated drafts", "Plan human checks rather than assuming outputs are correct.", "5 min read"),
      i("Questions about data", "Discuss retention, access and privacy before an integration.", "4 min read"),
    ],
    labels: { features: L("Explore the concept", "Features"), projects: L("Sample AI workflows", "Workflows"), pricing: L("Discuss a demo", "Demo options"), testimonials: L("Sample concept feedback", "Feedback"), contact: L("Product demo enquiries", "Request a demo") },
    sections: ["hero", "about", "features", "projects", "testimonials", "contact"],
    palette: "violet",
    productDefaults: true,
  },
  cybersecurity: {
    brand: "Bastion Security",
    topic: "cybersecurity planning",
    cta: "Discuss a security review",
    headline: "Understand your risks. Plan your next steps.",
    tagline: "Security reviews, practical recommendations and awareness programmes.",
    about: "Our fictional consultancy helps teams scope authorised security reviews and prioritise follow-up work. Sample engagements are illustrative, not evidence of certification or a guarantee of protection. Do not send passwords, secrets or incident evidence through this enquiry form.",
    features: [
      i("Authorised reviews", "Agree on the systems, scope and permissions before an assessment."),
      i("Risk prioritisation", "Translate review observations into a practical follow-up plan."),
      i("Team awareness", "Discuss training needs and clearer day-to-day security practices."),
    ],
    projects: [
      i("Application review", "An example scoped assessment for a business application.", "Authorised scope"),
      i("Access review", "A sample inventory of account ownership and review responsibilities.", "Access planning"),
      i("Awareness workshop", "An example programme for recognising and reporting concerns.", "Team education"),
    ],
    plans: [
      i("Initial discussion", "Outline your environment and review goals.", "Enquire"),
      i("Scoped assessment", "Agree on permissions, deliverables and review boundaries.", "Request a scope"),
      i("Ongoing advisory", "Discuss a schedule for reviewing priorities.", "Contact us"),
    ],
    testimonials: [
      i("A project owner", "The proposed scope and responsibilities were clear."),
      i("An operations lead", "We left with a practical list of questions to address."),
      i("A workshop participant", "The session made reporting responsibilities easier to understand."),
    ],
    posts: [
      i("Scoping a security review", "Define permissions, contacts and boundaries before work begins.", "5 min read"),
      i("Keeping an asset inventory", "Understand which systems your team is responsible for.", "4 min read"),
      i("Planning review follow-up", "Assign owners and revisit agreed actions.", "3 min read"),
    ],
    labels: { features: L("Security services", "Services"), projects: L("Sample engagements", "Engagements"), pricing: L("Engagement options", "Options"), testimonials: L("Sample client comments", "Comments"), contact: L("Security review enquiries", "Enquiries") },
    sections: ["hero", "about", "features", "projects", "testimonials", "contact"],
    palette: "indigo",
    mode: "dark",
    productDefaults: true,
  },
  fintech: {
    brand: "Ledgerlane",
    topic: "financial technology",
    cta: "Discuss a product demo",
    headline: "Make your financial product easier to understand",
    tagline: "A clear introduction to a digital wallet and finance workflow concept.",
    about: "Ledgerlane is a fictional fintech showcase, not a bank or a live financial service. Screens and use cases are illustrative; this website does not open accounts, move money or provide financial advice. Do not send account numbers, card details or other sensitive financial information.",
    features: [
      i("Wallet concept", "Present an example way to organise balances and activity."),
      i("Expense workflows", "Explore a concept for reviewing business expense information."),
      i("Team visibility", "Explain proposed access roles and review responsibilities."),
    ],
    projects: [
      i("Personal overview", "An illustrative wallet dashboard with fictional activity.", "Concept screen"),
      i("Expense review", "A sample approval flow using demonstration data.", "Example workflow"),
      i("Business reporting", "An example summary for a product discovery discussion.", "Product concept"),
    ],
    plans: [
      i("Product walkthrough", "Explore the proposed experience and its intended audience.", "Request a demo"),
      i("Team discovery", "Discuss business workflows and permission requirements.", "Enquire"),
      i("Integration discussion", "Outline proposed technical and compliance requirements.", "Contact us"),
    ],
    testimonials: [
      i("A design partner", "The sample screens helped us discuss the concept."),
      i("A finance team lead", "The walkthrough made our workflow questions clearer."),
      i("A product reviewer", "The presentation separated proposals from live functionality."),
    ],
    posts: [
      i("Explaining a wallet concept", "Communicate product scope without implying live financial services.", "4 min read"),
      i("Using demonstration data", "Keep real account information out of a product showcase.", "3 min read"),
      i("Planning product discovery", "Discuss users, requirements and review responsibilities.", "5 min read"),
    ],
    labels: { features: L("Product concept", "Features"), projects: L("Example finance workflows", "Use cases"), pricing: L("Explore a demonstration", "Demo options"), testimonials: L("Sample concept feedback", "Feedback"), contact: L("Fintech demo enquiries", "Request a demo") },
    sections: ["hero", "about", "features", "projects", "testimonials", "contact"],
    palette: "emerald",
    productDefaults: true,
  },
  onlinecourses: {
    brand: "Openpath Learning",
    topic: "online courses",
    cta: "Ask about a course",
    headline: "Find a learning path that fits your next step",
    tagline: "Explore sample online programmes, practical topics and guided learning plans.",
    about: "Our fictional learning studio introduces courses through clear outlines and sample projects. This website is a course showcase, not a learning management system: it does not provide enrolment, lesson access, payments or certificates. Contact the team to discuss course interest.",
    features: [
      i("Clear course outlines", "Compare example topics, intended audiences and prerequisites."),
      i("Practical projects", "Explore sample exercises that connect ideas to everyday tasks."),
      i("Learning enquiries", "Ask about course format, support and proposed schedules."),
    ],
    projects: [
      i("Design foundations", "An example introduction to layout, colour and visual hierarchy.", "Sample course"),
      i("Working with data", "A sample outline covering spreadsheets and simple visualisation.", "Sample course"),
      i("Project planning basics", "An example programme on briefs, milestones and handovers.", "Sample course"),
    ],
    plans: [
      i("Explore a topic", "Ask about an individual course outline.", "Course enquiry"),
      i("Team learning", "Discuss a proposed programme for your team.", "Request details"),
      i("Custom workshop", "Share your learning goals and preferred format.", "Contact us"),
    ],
    testimonials: [
      i("A prospective learner", "The course outline made the intended level easy to understand."),
      i("A team coordinator", "It was easy to explain our learning goals."),
      i("A programme reviewer", "The sample projects showed how the topics connect."),
    ],
    posts: [
      i("Choosing a course", "Compare prerequisites and outlines with your learning goals.", "4 min read"),
      i("Making time for practice", "Plan a realistic routine alongside other commitments.", "3 min read"),
      i("Questions before joining", "Discuss format, support and access with the provider.", "3 min read"),
    ],
    labels: { features: L("How learning is planned", "Learning"), projects: L("Sample course catalogue", "Courses"), pricing: L("Course enquiry options", "Enquiries"), testimonials: L("Sample programme comments", "Comments"), contact: L("Course interest and questions", "Ask about a course") },
    sections: ["hero", "about", "features", "projects", "testimonials", "contact"],
    palette: "violet",
    productDefaults: true,
  },
  schools: {
    brand: "Cedar Grove School",
    topic: "school life and education",
    cta: "Ask about admissions",
    headline: "A place to learn, belong and discover",
    tagline: "Meet our school community and explore a day of learning.",
    about: "Our fictional school brings classroom learning, creative activities and a welcoming community together. Programmes and school stories are sample content. Admissions enquiries are not applications; please do not include children's personal details in the contact form.",
    features: [
      i("Classroom learning", "Explore an example curriculum and the subjects pupils discover."),
      i("Creative activities", "Introduce art, music and clubs beyond the classroom."),
      i("Family conversations", "Ask about school visits, admissions information and term dates."),
    ],
    projects: [
      i("Reading together", "A sample classroom story celebrating books and discussion.", "Classroom life"),
      i("School garden", "An example project connecting nature and observation.", "Learning outdoors"),
      i("Creative afternoon", "A sample exhibition of art and collaborative activities.", "Arts and clubs"),
    ],
    testimonials: [
      i("A visiting family", "The introduction helped us prepare our questions."),
      i("A community member", "The school story felt welcoming and easy to explore."),
      i("A parent representative", "The programme information was clearly organised."),
    ],
    posts: [
      i("Preparing for a school visit", "Topics families may want to discuss with the school.", "3 min read"),
      i("A week of discovery", "An illustrative look at lessons, clubs and creative work.", "4 min read"),
      i("Keeping families informed", "How to find confirmed dates and school information.", "3 min read"),
    ],
    labels: { features: L("Learning at our school", "Learning"), projects: L("Stories from school", "School life"), gallery: L("Around the school", "Gallery"), contact: L("School and admissions enquiries", "Admissions") },
    sections: ["hero", "about", "features", "projects", "gallery", "testimonials", "contact"],
    palette: "amber",
    productDefaults: true,
  },
  travelbooking: {
    brand: "Roamwell Journeys",
    topic: "travel planning and itineraries",
    cta: "Enquire about a journey",
    headline: "Your next journey starts with a little inspiration",
    tagline: "Explore sample itineraries and tell us what your ideal trip looks like.",
    about: "Our fictional travel studio showcases ideas for city breaks, coastlines and slower adventures. Itineraries are examples, not live offers. This website does not check availability, reserve rooms, issue tickets or take payments; send an enquiry to discuss a trip.",
    features: [
      i("Itinerary inspiration", "Compare sample routes, travel styles and places to explore."),
      i("Trip planning enquiries", "Share preferred dates and the kind of journey you have in mind."),
      i("Clear next steps", "Discuss availability and booking terms directly with a provider."),
    ],
    projects: [
      i("Coastal weekend", "An illustrative short break with seaside walks and local stops.", "Sample itinerary"),
      i("City discovery", "A sample route through neighbourhoods, museums and markets.", "Sample itinerary"),
      i("Mountain escape", "An example slower-paced journey with time outdoors.", "Sample itinerary"),
    ],
    plans: [
      i("Short break", "Discuss a proposed weekend itinerary.", "Enquire"),
      i("Multi-stop journey", "Explore a longer route and your travel preferences.", "Request details"),
      i("Group itinerary", "Share an outline for a proposed group trip.", "Contact us"),
    ],
    testimonials: [
      i("A travel planner", "The sample itineraries helped us explain our preferences."),
      i("A prospective guest", "We understood what to ask before making a booking."),
      i("A group organiser", "A useful starting point for our trip discussion."),
    ],
    posts: [
      i("Starting a travel enquiry", "Share the dates, group size and preferences that shape a trip.", "4 min read"),
      i("Comparing itinerary ideas", "Leave room for travel time and your own pace.", "3 min read"),
      i("Before confirming a booking", "Check availability, terms and details with your travel provider.", "4 min read"),
    ],
    labels: { features: L("Plan your journey", "Planning"), projects: L("Sample travel itineraries", "Itineraries"), pricing: L("Explore trip options", "Trip options"), testimonials: L("Sample planning comments", "Comments"), contact: L("Travel and booking enquiries", "Enquire") },
    sections: ["hero", "about", "features", "projects", "testimonials", "contact"],
    palette: "sky",
    productDefaults: true,
  },
  bakery: {
    brand: "Golden Crumb Bakery",
    topic: "artisan baking",
    cta: "Ask about an order",
    headline: "Fresh from our oven, made for your day",
    tagline: "Slow-fermented bread, buttery pastries and cakes worth celebrating.",
    about: "We bake in small batches with seasonal ingredients and patient hands. Visit for your morning loaf or speak to our bakers about a special occasion.",
    features: [
      i("Daily bread", "Sourdough and sandwich loaves baked fresh each morning."),
      i("Weekend pastries", "Flaky croissants, fruit buns and rotating seasonal treats."),
      i("Celebration cakes", "Made-to-order cakes with flavours and finishes chosen together."),
    ],
    projects: [
      i("Morning bake", "A selection of our daily loaves and pastries."),
      i("Birthday table", "A seasonal cake finished with fresh fruit."),
      i("Community brunch", "Bread and pastries shared around the table."),
    ],
    menu: [
      i("Country sourdough", "A crisp crust and soft, slowly fermented centre.", "$7"),
      i("Butter croissant", "Layered by hand and baked until golden.", "$4"),
      i("Seasonal cake slice", "Ask about today's flavour.", "$6"),
    ],
    testimonials: [
      i("Jamie R.", "The bread is a highlight of our weekend."),
      i("Ari W.", "The team helped us choose a lovely celebration cake."),
      i("Nora S.", "A welcoming stop for a morning pastry."),
    ],
    posts: [
      i("Behind the morning bake", "How time and temperature shape a loaf.", "4 min read"),
      i("Choosing a celebration cake", "Flavours, portions and planning ahead.", "3 min read"),
      i("Keeping bread fresh", "Storage ideas for your next loaf.", "3 min read"),
    ],
    labels: { features: L("What we bake", "Our baking"), projects: L("Baking stories", "Stories"), menu: L("From the oven", "Bakes"), gallery: L("A taste of our bakery", "Gallery"), contact: L("Orders and enquiries", "Contact") },
    sections: ["hero", "about", "menu", "gallery", "testimonials", "contact"],
    palette: "amber",
  },
  consulting: {
    brand: "Clearpath Advisory",
    topic: "business consulting",
    cta: "Discuss your challenge",
    headline: "Clear thinking for your next business decision",
    tagline: "Practical strategy, focused delivery and a plan your team can use.",
    about: "We work alongside business owners to understand the real problem before recommending a solution. Each engagement has a clear scope, shared milestones and an actionable handover.",
    features: [
      i("Business strategy", "Set priorities and map the decisions that matter."),
      i("Operations review", "Find bottlenecks and simplify everyday processes."),
      i("Change support", "Help teams put new ways of working into practice."),
    ],
    projects: [
      i("Growth roadmap", "A staged launch plan for an independent business.", "Strategy"),
      i("Process redesign", "A clearer handover between sales and delivery.", "Operations"),
      i("Team workshop", "A shared set of priorities for a growing team.", "Facilitation"),
    ],
    testimonials: [
      i("Morgan L.", "We finished with a practical plan, not just a presentation."),
      i("Dev R.", "The workshops helped our team agree on the next step."),
      i("Quinn A.", "Clear communication from the brief to the handover."),
    ],
    posts: [
      i("Choosing the next priority", "A simple framework for competing business goals.", "5 min read"),
      i("Mapping a process", "Start by understanding how work moves today.", "4 min read"),
      i("Making change stick", "Small habits that support a new plan.", "3 min read"),
    ],
    labels: { features: L("How we help", "Services"), projects: L("Example engagements", "Work"), contact: L("Start a conversation", "Contact") },
    sections: ["hero", "about", "features", "projects", "testimonials", "contact"],
    palette: "sky",
  },
  recruitment: {
    brand: "Bridge Talent",
    topic: "recruitment",
    cta: "Talk to our recruiters",
    headline: "Good people. The right next opportunity.",
    tagline: "Thoughtful recruitment for employers and candidates.",
    about: "We take time to understand the role, the team and the person behind each application. Clear expectations and regular communication guide every search.",
    features: [
      i("For employers", "Define your brief and build a focused shortlist."),
      i("For candidates", "Explore roles that fit your experience and ambitions."),
      i("Hiring support", "Coordinate interviews, feedback and offer discussions."),
    ],
    projects: [
      i("Operations coordinator", "Example role for an organised team player.", "Full-time"),
      i("Customer success specialist", "Example role supporting long-term customer relationships.", "Hybrid"),
      i("Finance assistant", "Example role for detail-focused early-career applicants.", "Full-time"),
    ],
    testimonials: [
      i("Taylor S.", "I always knew where I stood throughout the process."),
      i("Cameron B.", "The shortlist reflected the role we actually needed."),
      i("Riley J.", "Helpful feedback and straightforward communication."),
    ],
    posts: [
      i("Preparing for an interview", "Useful questions for candidates and hiring managers.", "4 min read"),
      i("Writing a clear role brief", "Explain the work before listing requirements.", "4 min read"),
      i("Giving useful feedback", "Keep candidates informed at every stage.", "3 min read"),
    ],
    labels: { features: L("Recruitment services", "Services"), projects: L("Sample opportunities", "Roles"), contact: L("Hiring or job enquiries", "Contact") },
    sections: ["hero", "about", "features", "projects", "testimonials", "contact"],
    palette: "emerald",
  },
  marketing: {
    brand: "Signal & Story",
    topic: "marketing",
    cta: "Plan your next campaign",
    headline: "Make your message matter",
    tagline: "Brand strategy, thoughtful content and campaigns with a clear purpose.",
    about: "We help businesses communicate what makes them different. Research, creative work and regular measurement keep campaigns connected to real goals.",
    features: [
      i("Brand positioning", "Find a clear voice and a message that fits your audience."),
      i("Content and social", "Build an editorial plan with useful, consistent content."),
      i("Search and campaigns", "Improve discoverability and test focused campaign ideas."),
    ],
    projects: [
      i("Local launch", "A coordinated brand and content rollout.", "Launch campaign"),
      i("A clearer story", "Updated messaging and visual direction for a service business.", "Brand strategy"),
      i("Search foundations", "A practical content structure for an established website.", "SEO"),
    ],
    testimonials: [
      i("Alex D.", "Our message finally sounds like us."),
      i("Jules K.", "A creative team that took time to understand our audience."),
      i("Charlie R.", "The campaign plan was clear and easy to put into action."),
    ],
    posts: [
      i("A campaign starts with a question", "How to turn a broad goal into a useful brief.", "5 min read"),
      i("Finding your brand voice", "Build consistency without losing personality.", "4 min read"),
      i("Reviewing a campaign", "Look at the questions behind the numbers.", "4 min read"),
    ],
    labels: { features: L("What we do", "Services"), projects: L("Campaign stories", "Work"), contact: L("Tell us your goals", "Contact") },
    sections: ["hero", "features", "projects", "about", "testimonials", "contact"],
    palette: "violet",
    mode: "dark",
  },
  events: {
    brand: "Gather & Glow Events",
    topic: "event planning",
    cta: "Tell us about your event",
    headline: "Your occasion, thoughtfully brought together",
    tagline: "Celebrations, weddings and gatherings planned with care.",
    about: "From the first idea to the final guest departure, we coordinate the details so you can enjoy the occasion. We build each plan around your priorities, venue and budget.",
    features: [
      i("Full event planning", "Timelines, suppliers and logistics from start to finish."),
      i("Wedding coordination", "A considered plan for your ceremony and celebration."),
      i("On-the-day support", "A calm point of contact for guests and suppliers."),
    ],
    projects: [
      i("Garden celebration", "An intimate gathering with a relaxed outdoor setting.", "Private event"),
      i("City wedding", "A warm evening reception with thoughtful personal details.", "Wedding"),
      i("Team gathering", "A programme balancing conversation and celebration.", "Corporate event"),
    ],
    testimonials: [
      i("Sam and Lee", "We could enjoy the day knowing the details were looked after."),
      i("Maya T.", "The timeline made it easy to coordinate our suppliers."),
      i("Jordan F.", "Thoughtful details and calm support throughout the event."),
    ],
    posts: [
      i("Your first event checklist", "The early decisions that make the rest easier.", "4 min read"),
      i("Choosing a venue", "Questions to ask before you book.", "4 min read"),
      i("Planning for the unexpected", "Build a little flexibility into the day.", "3 min read"),
    ],
    labels: { features: L("Planning services", "Services"), projects: L("Celebrations we imagine", "Events"), gallery: L("Little details, lasting memories", "Gallery"), contact: L("Plan an occasion", "Contact") },
    sections: ["hero", "about", "features", "projects", "gallery", "testimonials", "contact"],
    palette: "rose",
  },
  interiors: {
    brand: "Stillroom Interiors",
    topic: "interior design",
    cta: "Discuss your space",
    headline: "Spaces that feel like you",
    tagline: "Considered interiors shaped around the way you live and work.",
    about: "We combine practical layouts, tactile materials and thoughtful lighting to create comfortable spaces. Every project begins with listening and a clear understanding of the brief.",
    features: [
      i("Design consultation", "Explore your needs, style and priorities together."),
      i("Space planning", "Make better use of each room with a considered layout."),
      i("Materials and styling", "Bring finishes, furnishings and lighting into harmony."),
    ],
    projects: [
      i("Quiet living room", "Natural textures and flexible seating for everyday life.", "Residential"),
      i("Welcoming workspace", "A small studio balancing focus and collaboration.", "Commercial"),
      i("Compact kitchen", "Storage and lighting improvements in a modest footprint.", "Residential"),
    ],
    testimonials: [
      i("Casey P.", "The space feels both practical and personal."),
      i("Drew M.", "We now have a layout that works for the whole family."),
      i("Harper L.", "The material choices brought everything together."),
    ],
    posts: [
      i("Start with how a room is used", "A practical first step before choosing colours.", "4 min read"),
      i("Layering light", "Combine task and ambient lighting thoughtfully.", "3 min read"),
      i("Choosing lasting materials", "Balance texture, care and everyday use.", "4 min read"),
    ],
    labels: { features: L("Design services", "Services"), projects: L("Spaces and concepts", "Projects"), gallery: L("Materials and details", "Gallery"), contact: L("Your next space", "Contact") },
    sections: ["hero", "projects", "about", "features", "gallery", "testimonials", "contact"],
    palette: "amber",
  },
  nonprofit: {
    brand: "Neighbourhood Hope",
    topic: "community support",
    cta: "Ask how to get involved",
    headline: "Small acts. Stronger communities.",
    tagline: "Working together to make practical support easier to reach.",
    about: "We bring volunteers and local partners together around community-led projects. Our focus is listening, working transparently and helping neighbours support one another.",
    features: [
      i("Community programmes", "Practical activities designed with local residents."),
      i("Volunteer opportunities", "Give your time and skills where they can help."),
      i("Local partnerships", "Work with organisations that share a community focus."),
    ],
    projects: [
      i("Neighbourhood pantry", "A sample project connecting surplus food with local needs.", "Community support"),
      i("Skills exchange", "A sample workshop where neighbours share practical knowledge.", "Learning"),
      i("Shared green space", "A sample volunteer day caring for a local gathering place.", "Environment"),
    ],
    testimonials: [
      i("A community volunteer", "A welcoming way to contribute and meet my neighbours."),
      i("A local partner", "The team listened to what our community needed."),
      i("A project participant", "It was easy to ask questions and get involved."),
    ],
    posts: [
      i("Getting involved locally", "Find an opportunity that fits your time and skills.", "3 min read"),
      i("Building local partnerships", "Start with a shared purpose and clear responsibilities.", "4 min read"),
      i("Sharing project updates", "Keep supporters informed with honest progress reports.", "3 min read"),
    ],
    labels: { about: L("Our mission", "Mission"), features: L("Our programmes", "Programmes"), projects: L("Community projects", "Projects"), contact: L("Volunteer and partnership enquiries", "Get involved") },
    sections: ["hero", "about", "features", "projects", "testimonials", "contact"],
    palette: "emerald",
  },
  retail: {
    brand: "Everyday Goods",
    topic: "independent retail",
    cta: "Enquire about a product",
    headline: "Thoughtfully chosen for everyday living",
    tagline: "Explore a considered collection of useful, well-made goods.",
    about: "We select products for their everyday usefulness and thoughtful details. Browse our sample collection and contact us about availability, delivery or a product question.",
    features: [
      i("Considered selection", "A focused range of useful everyday essentials."),
      i("Product guidance", "Ask us about materials, sizing and care."),
      i("Order enquiries", "Contact us to discuss availability and delivery options."),
    ],
    projects: [
      i("Canvas carryall", "A roomy everyday bag with reinforced handles.", "$28"),
      i("Stoneware cup", "A simple ceramic cup with a comfortable handle.", "$18"),
      i("Desk notebook", "A practical notebook for plans and everyday ideas.", "$12"),
    ],
    testimonials: [
      i("Robin M.", "A lovely selection and helpful answers to my questions."),
      i("Elliot S.", "The product details helped me choose a thoughtful gift."),
      i("Frankie W.", "Useful everyday pieces with lovely finishing touches."),
    ],
    posts: [
      i("Looking after everyday goods", "Simple care habits that help your favourites last.", "3 min read"),
      i("Choosing a useful gift", "Start with the recipient's everyday routines.", "3 min read"),
      i("Inside the collection", "A closer look at materials and details.", "4 min read"),
    ],
    labels: { projects: L("Sample collection", "Collection"), features: L("Shopping with us", "Our approach"), gallery: L("Details up close", "Gallery"), contact: L("Product and order enquiries", "Enquiries") },
    sections: ["hero", "projects", "features", "about", "testimonials", "contact"],
    palette: "rose",
  },
  motorsport: {
    brand: "Leo Marchetti",
    topic: "motorsport",
    cta: "Become a partner",
    headline: "Racing at the limit, every lap",
    tagline: "Follow the season, the results and the story behind the wheel.",
    about:
      "A competitive driver who came up through karting and single-seater racing. Qualifying pace, race craft and fitness drive every weekend, with a team that shares the same hunger to win.",
    features: [
      i("Podium finishes", "Consistent results across the season, from qualifying pace to race craft.", "12 podiums"),
      i("Pole positions", "Strong one-lap pace when it matters most.", "8 poles"),
      i("Fastest laps", "Pushing the car to its limit through every race stint.", "15 fastest laps"),
    ],
    projects: [
      i("Season opener", "Qualified on the front row and led the opening laps.", "P3"),
      i("Night race", "Held off the pack under the lights for a hard-fought win.", "P1"),
      i("Home grand prix", "A fast, clean race in front of the home crowd.", "P2"),
    ],
    testimonials: [
      i("Team principal", "Calm under pressure and brilliant with the engineers."),
      i("Race engineer", "Gives precise feedback that makes the car faster every session."),
      i("A loyal fan", "Every race weekend is worth watching. Thank you for the thrill!"),
    ],
    posts: [
      i("Race weekend recap", "Qualifying, the start and the strategy calls that decided the race.", "5 min read"),
      i("Inside the cockpit", "What it takes to stay sharp for two hours at full speed.", "6 min read"),
      i("Training for the new season", "Fitness, simulator work and the plan for the year ahead.", "4 min read"),
    ],
    labels: {
      about: L("Meet the driver", "About"),
      features: L("Career highlights", "Highlights"),
      projects: L("Race results", "Results"),
      gallery: L("On track", "Gallery"),
      testimonials: L("Fans and team", "Fans"),
      contact: L("Sponsors and media", "Contact"),
    },
    sections: ["hero", "about", "features", "projects", "gallery", "testimonials", "contact"],
    palette: "rose",
    mode: "dark",
  },

  automotive: {
    brand: "Redline Auto",
    topic: "cars",
    cta: "Book a service",
    headline: "Cars that run right, looked after by people who care",
    tagline: "Honest advice, fair prices and quality work on every vehicle.",
    about:
      "A trusted local garage and showroom. Certified technicians, genuine parts and clear quotes keep you safely on the road.",
    features: [
      i("Servicing and repairs", "From routine checks to complete engine work."),
      i("Tyres and brakes", "Fitted, balanced and tested for safe handling."),
      i("Diagnostics", "Modern tools to find faults quickly and accurately."),
    ],
    projects: [
      i("Full restoration", "A classic coupe brought back to showroom condition.", "6 weeks"),
      i("Performance tune", "Smoother power and better economy.", "1 day"),
      i("Fleet maintenance", "Keeping a delivery fleet moving with minimal downtime.", "Ongoing"),
    ],
    testimonials: [
      i("Daniel M.", "Fast, honest and fairly priced. My car has never run better."),
      i("Priya S.", "They explained every repair before starting any work."),
      i("Tom W.", "Booked online and the car was ready the same day."),
    ],
    posts: [
      i("Five checks before a long drive", "Simple checks that prevent breakdowns.", "4 min read"),
      i("When to change your tyres", "Signs of wear and how to measure tread.", "3 min read"),
      i("Understanding warning lights", "What each dashboard symbol means.", "5 min read"),
    ],
    labels: {
      features: L("Our services", "Services"),
      projects: L("Recent work", "Work"),
      gallery: L("In the workshop", "Gallery"),
      testimonials: L("Customer reviews", "Reviews"),
      contact: L("Book a service", "Contact"),
    },
    sections: ["hero", "about", "features", "gallery", "testimonials", "contact"],
    palette: "sky",
  },

  sports: {
    brand: "Jordan Hayes",
    topic: "sport",
    cta: "Follow the journey",
    headline: "Training hard. Playing harder.",
    tagline: "Results, highlights and the work behind every performance.",
    about:
      "A dedicated athlete committed to improving every day. Discipline, teamwork and a love of competition shape each season.",
    features: [
      i("Championship wins", "Titles earned through consistency and team spirit.", "3 titles"),
      i("Personal bests", "Records broken through focused training.", "12 PBs"),
      i("Team honours", "Recognised for leadership on and off the field.", "Captain"),
    ],
    projects: [
      i("Season final", "A decisive performance when the pressure was highest.", "Won"),
      i("Derby day", "A hard-fought match settled in the closing minutes.", "Draw"),
      i("Regional cup", "A strong run all the way to the semi-finals.", "Semi-final"),
    ],
    testimonials: [
      i("Head coach", "Hard-working, coachable and a natural leader."),
      i("Teammate", "Lifts everyone around them in training and on match day."),
      i("Supporter", "Every game is exciting to watch."),
    ],
    posts: [
      i("Match day routine", "How to prepare in the 24 hours before a game.", "4 min read"),
      i("Recovering smarter", "Sleep, nutrition and rest that keep you on the pitch.", "5 min read"),
      i("Goals for the new season", "What is being worked on and why.", "3 min read"),
    ],
    labels: {
      about: L("About the athlete", "About"),
      features: L("Career highlights", "Highlights"),
      projects: L("Recent matches", "Matches"),
      gallery: L("In action", "Gallery"),
      contact: L("Sponsors and media", "Contact"),
    },
    sections: ["hero", "about", "features", "projects", "gallery", "testimonials", "contact"],
    palette: "emerald",
  },

  pets: {
    brand: "Happy Paws",
    topic: "pets",
    cta: "Book a visit",
    headline: "Happy, healthy pets start here",
    tagline: "Gentle care, grooming and advice for dogs, cats and the people who love them.",
    about:
      "A friendly team of animal lovers. We treat every pet like family, with patient handling, clear communication and plenty of treats.",
    features: [
      i("Grooming", "Baths, trims and styling in a calm, stress-free space."),
      i("Daycare and boarding", "Safe play, walks and cosy rest while you are away."),
      i("Training and advice", "Positive training that builds good habits."),
    ],
    projects: [
      i("Makeover day", "A shaggy rescue pup, ready for a new home."),
      i("Puppy school", "Six weeks from nervous to confident.", "6 weeks"),
      i("Senior care plan", "Comfort and gentle exercise for an older companion."),
    ],
    testimonials: [
      i("Emma R.", "My dog actually loves going. They are patient and kind."),
      i("Chris L.", "Daily updates and photos made boarding stress-free."),
      i("Maya T.", "The best grooming my cat has ever had."),
    ],
    posts: [
      i("First week with a new puppy", "Routines, sleep and gentle training.", "5 min read"),
      i("Keeping pets cool in summer", "Simple ways to prevent overheating.", "3 min read"),
      i("Choosing the right food", "What to look for on the label.", "4 min read"),
    ],
    labels: {
      features: L("Our services", "Services"),
      projects: L("Success stories", "Stories"),
      gallery: L("Our furry friends", "Gallery"),
      testimonials: L("Happy owners", "Reviews"),
      contact: L("Book a visit", "Contact"),
    },
    sections: ["hero", "about", "features", "gallery", "testimonials", "contact"],
    palette: "amber",
  },

  gaming: {
    brand: "Pixel Forge",
    topic: "gaming",
    cta: "Join the community",
    headline: "Level up your game",
    tagline: "Streams, guides and the best moments from the community.",
    about:
      "Built by gamers, for gamers. We share tips, tournaments and honest reviews so you can play better and have more fun.",
    features: [
      i("Live streams", "Weekly sessions with chat, giveaways and community games."),
      i("Guides and tips", "Step-by-step breakdowns for tough bosses and ranked play."),
      i("Tournaments", "Friendly competitions with prizes and bragging rights."),
    ],
    projects: [
      i("Ranked climb", "From bronze to diamond in a single season.", "Diamond"),
      i("Speedrun record", "A clean run with a new personal best.", "New PB"),
      i("Charity stream", "Raising money for a good cause together.", "Community"),
    ],
    testimonials: [
      i("Alex", "The best community around. Super helpful and friendly."),
      i("Sam", "Their guides took me from stuck to winning."),
      i("Riley", "Never miss a stream. It is always entertaining."),
    ],
    posts: [
      i("Five settings to change today", "Quick tweaks for smoother gameplay.", "4 min read"),
      i("A beginner's guide to ranked", "Know the basics before you queue.", "6 min read"),
      i("This month's tournament recap", "Highlights and final standings.", "3 min read"),
    ],
    labels: {
      features: L("What we do", "Features"),
      projects: L("Top plays", "Plays"),
      gallery: L("Screenshots", "Gallery"),
      testimonials: L("Community", "Community"),
      contact: L("Join us", "Contact"),
    },
    sections: ["hero", "about", "features", "projects", "gallery", "testimonials", "contact"],
    palette: "violet",
    mode: "dark",
  },

  floral: {
    brand: "Petal & Stem",
    topic: "flowers",
    cta: "Order flowers",
    headline: "Fresh flowers, beautifully arranged",
    tagline: "Seasonal bouquets, weddings and same-day delivery from your local florist.",
    about:
      "A neighbourhood florist who loves seasonal blooms. Every arrangement is hand-tied with care and delivered fresh.",
    features: [
      i("Everyday bouquets", "Hand-tied flowers for birthdays, thank-yous and just because."),
      i("Weddings and events", "Bridal bouquets, arches and table flowers designed with you."),
      i("Same-day delivery", "Order by midday and we deliver the same afternoon."),
    ],
    projects: [
      i("Spring tulip bundle", "Bright, fresh tulips wrapped in kraft paper.", "Seasonal"),
      i("Garden rose bouquet", "Soft, fragrant roses with eucalyptus.", "Best seller"),
      i("Wedding arch", "A full floral arch in white and green.", "Weddings"),
    ],
    testimonials: [
      i("Emily R.", "The bouquet was gorgeous and arrived right on time."),
      i("Jamal K.", "Perfect flowers for our wedding. Everyone asked who did them."),
      i("Sofia L.", "Fresh, fragrant and lasted nearly two weeks."),
    ],
    posts: [
      i("Caring for cut flowers", "Simple steps to make blooms last longer.", "3 min read"),
      i("Choosing your wedding flowers", "Colours, seasons and budget.", "5 min read"),
      i("What is in season this month", "The freshest flowers right now.", "2 min read"),
    ],
    labels: {
      features: L("Our flowers", "Flowers"),
      projects: L("Recent arrangements", "Arrangements"),
      gallery: L("In bloom", "Gallery"),
      testimonials: L("Happy customers", "Reviews"),
      contact: L("Order flowers", "Order"),
    },
    sections: ["hero", "about", "features", "projects", "gallery", "testimonials", "contact"],
    palette: "rose",
  },

  community: {
    brand: "Riverside Community Club",
    topic: "community",
    cta: "Join us",
    headline: "A welcoming place to meet, play and belong",
    tagline: "Regular meetups, events and friendly faces for everyone.",
    about:
      "A friendly, volunteer-run group open to all ages and abilities. Come along, meet new people and enjoy doing what we love together.",
    features: [
      i("Weekly meetups", "Relaxed sessions every week, with tea and good company."),
      i("Beginners welcome", "No experience needed. Someone will always show you the ropes."),
      i("Events and tournaments", "Friendly competitions and socials throughout the year."),
    ],
    projects: [
      i("Spring open day", "Bring a friend and try everything for free.", "April"),
      i("Friendly tournament", "A relaxed day of games with prizes.", "May"),
      i("Summer social", "Food, music and an evening to meet everyone.", "June"),
    ],
    testimonials: [
      i("A new member", "I walked in not knowing anyone and left with new friends."),
      i("A parent", "My daughter looks forward to every session."),
      i("A long-time volunteer", "A wonderful group that genuinely cares."),
    ],
    posts: [
      i("Meet the committee", "The people who keep everything running.", "3 min read"),
      i("Our year in review", "Highlights, numbers and thank-yous.", "5 min read"),
      i("How to get started", "Everything a newcomer needs to know.", "2 min read"),
    ],
    labels: {
      features: L("What we do", "Activities"),
      projects: L("Upcoming events", "Events"),
      gallery: L("Photos", "Gallery"),
      testimonials: L("What members say", "Members"),
      contact: L("Join us", "Join"),
    },
    sections: ["hero", "about", "features", "projects", "gallery", "testimonials", "contact"],
    palette: "emerald",
  },

  homeservices: {
    brand: "Bright Home Services",
    topic: "home services",
    cta: "Get a free quote",
    headline: "Reliable help for your home",
    tagline: "Friendly, insured professionals for cleaning, moving, gardening and repairs.",
    about:
      "A local team that treats your home like their own. Fair prices, on-time arrival and every job guaranteed.",
    features: [
      i("Cleaning", "Regular, deep and move-out cleans with eco-friendly products."),
      i("Moving and removals", "Careful packing, loading and delivery."),
      i("Garden and outdoor", "Lawn care, tidying and seasonal planting."),
    ],
    projects: [
      i("Deep clean", "A busy family home, spotless in one day.", "1 day"),
      i("Garden makeover", "An overgrown garden turned into a place to relax.", "2 days"),
      i("Apartment move", "A two-bedroom move with no damage and no stress.", "Same day"),
    ],
    testimonials: [
      i("Karen T.", "On time, polite and the house has never looked better."),
      i("Omar S.", "Fair price and genuinely careful with our furniture."),
      i("Lucy M.", "Booked online and they were here the next morning."),
    ],
    posts: [
      i("A simple spring-cleaning checklist", "Room by room, without the overwhelm.", "4 min read"),
      i("How to prepare for moving day", "Pack smart and stay calm.", "5 min read"),
      i("Easy garden jobs for autumn", "Small tasks that pay off in spring.", "3 min read"),
    ],
    labels: {
      features: L("Our services", "Services"),
      projects: L("Recent jobs", "Jobs"),
      gallery: L("Our work", "Gallery"),
      testimonials: L("Customer reviews", "Reviews"),
      contact: L("Get a free quote", "Contact"),
    },
    palette: "sky",
  },

  photography: {
    brand: "Aria Lane",
    topic: "photography",
    cta: "Book a session",
    headline: "Moments worth keeping",
    tagline: "Natural, honest photography for weddings, portraits and the stories in between.",
    about:
      "A photographer who loves light, emotion and unscripted moments. Every session is relaxed, collaborative and delivered with care.",
    features: [
      i("Weddings", "Full-day coverage from preparation to the last dance."),
      i("Portraits", "Relaxed sessions for individuals, couples and families."),
      i("Events", "Candid coverage that captures the atmosphere."),
    ],
    projects: [
      i("Coastal wedding", "Golden light, sea air and unscripted joy.", "2025"),
      i("Golden-hour portraits", "A relaxed family session in the park.", "2025"),
      i("City engagement", "Street scenes and quiet moments in between.", "2024"),
    ],
    testimonials: [
      i("Hannah and Luke", "We cried looking at our photos. Absolutely perfect."),
      i("Priya", "Made us feel completely at ease in front of the camera."),
      i("Marcus", "Fast delivery and beautiful edits."),
    ],
    posts: [
      i("Choosing your wedding photographer", "What to look for and what to ask.", "5 min read"),
      i("The best light for portraits", "Why golden hour works so well.", "4 min read"),
      i("Preparing for your session", "What to wear and how to relax.", "3 min read"),
    ],
    labels: {
      features: L("Services", "Services"),
      projects: L("Featured shoots", "Work"),
      gallery: L("Gallery", "Gallery"),
      contact: L("Book a session", "Contact"),
    },
    palette: "violet",
  },

  software: {
    brand: "Noah Kim",
    topic: "software",
    cta: "Start a project",
    headline: "Software built to last",
    tagline: "Clean code, thoughtful design and reliable delivery from idea to launch.",
    about:
      "Experienced engineers who care about performance, accessibility and maintainability. Projects are planned clearly, built iteratively and shipped with tests.",
    features: [
      i("Web applications", "Fast, accessible interfaces that scale with your users."),
      i("APIs and backend", "Secure, well-documented services and data models."),
      i("Cloud and DevOps", "Automated deployments, monitoring and reliability."),
    ],
    projects: [
      i("Analytics dashboard", "Real-time charts for a logistics team.", "2025"),
      i("Booking platform", "Scheduling and payments for a growing studio.", "2024"),
      i("Mobile companion app", "Offline-first notes that sync everywhere.", "2023"),
    ],
    testimonials: [
      i("A product manager", "Communicates clearly and ships on the date promised."),
      i("A startup founder", "Turned our rough idea into a polished product."),
      i("An engineering lead", "Clean, well-tested code that was easy to take over."),
    ],
    posts: [
      i("Why tests make you faster", "Confidence to change code without fear.", "5 min read"),
      i("Choosing the right database", "Questions to ask before you commit.", "6 min read"),
      i("Shipping small, shipping often", "Why small releases reduce risk.", "4 min read"),
    ],
    labels: {
      features: L("What I build", "Services"),
      projects: L("Selected projects", "Projects"),
      contact: L("Let's talk", "Contact"),
    },
    palette: "violet",
  },

  food: {
    brand: "Olive & Thyme",
    topic: "food",
    cta: "Reserve a table",
    headline: "Seasonal food, made fresh every day",
    tagline: "Relaxed, welcoming and cooked from scratch.",
    about:
      "We work with local growers and bakers to build a short menu that changes with the seasons. Everything is made in our kitchen, from the bread to the desserts.",
    features: [
      i("Local ingredients", "Sourced from growers and bakers nearby."),
      i("Made from scratch", "Sauces, breads and desserts prepared in house each day."),
      i("A warm welcome", "Relaxed service for families, friends and celebrations."),
    ],
    projects: [
      i("Spring pea risotto", "Creamy, bright and finished with fresh mint.", "Spring"),
      i("Charred peach salad", "Burrata, basil and toasted almonds.", "Summer"),
      i("Slow-cooked lamb", "Rosemary, garlic and roasted root vegetables.", "Autumn"),
    ],
    menu: [
      i("Roasted tomato soup", "Basil oil, toasted sourdough.", "$9"),
      i("Wild mushroom pasta", "Thyme, parmesan, brown butter.", "$18"),
      i("Lemon olive-oil cake", "Whipped cream, seasonal fruit.", "$8"),
    ],
    testimonials: [
      i("Jordan P.", "The best meal we have had all year."),
      i("Sofia R.", "Lovely food and such friendly staff."),
      i("Ben and Aisha", "We celebrated our anniversary here and it was perfect."),
    ],
    posts: [
      i("Meet our farmers", "The people behind the produce on your plate.", "4 min read"),
      i("Our bread, step by step", "From starter to oven.", "5 min read"),
      i("Seasonal menu launch", "What is new this month.", "2 min read"),
    ],
    labels: {
      features: L("Why dine with us", "Why us"),
      projects: L("Seasonal specials", "Specials"),
      gallery: L("From the kitchen", "Gallery"),
      testimonials: L("Guest reviews", "Reviews"),
      contact: L("Reserve a table", "Reserve"),
    },
    palette: "amber",
  },

  fitness: {
    brand: "Peak Fitness",
    topic: "fitness",
    cta: "Start your free week",
    headline: "Stronger every single day",
    tagline: "Coaching, classes and a community that keeps you moving.",
    about:
      "A welcoming gym and coaching team for every level. Expert trainers, flexible classes and programmes designed around your goals.",
    features: [
      i("Strength training", "Coached sessions that build confidence with every lift."),
      i("Group classes", "High-energy workouts from yoga to HIIT."),
      i("Personal coaching", "A plan and accountability built around you."),
    ],
    projects: [
      i("The 12-week reset", "A member's first steps back into training.", "12 weeks"),
      i("First marathon", "From the couch to the finish line.", "26.2 miles"),
      i("Back to strength", "Rebuilding after injury, one session at a time.", "Recovery"),
    ],
    testimonials: [
      i("Aisha K.", "The coaches genuinely care. I look forward to every class."),
      i("Ben D.", "Best decision I made this year. I feel stronger than ever."),
      i("Chloe M.", "Friendly, motivating and never intimidating."),
    ],
    posts: [
      i("A beginner's guide to lifting", "Form first, then weight.", "5 min read"),
      i("How much protein do you need?", "A simple, practical answer.", "4 min read"),
      i("Stretches that actually help", "Five minutes after every workout.", "3 min read"),
    ],
    plans: [
      i("Starter", "Gym access and an intro session.", "$19"),
      i("Core", "Unlimited classes and coaching tips.", "$39"),
      i("Elite", "Personal training and a nutrition plan.", "$89"),
    ],
    labels: {
      features: L("Programmes", "Programmes"),
      projects: L("Member stories", "Stories"),
      pricing: L("Memberships", "Pricing"),
      contact: L("Join today", "Contact"),
    },
    palette: "rose",
  },

  health: {
    brand: "Greenleaf Clinic",
    topic: "health",
    cta: "Book an appointment",
    headline: "Caring for you and your family",
    tagline: "Experienced clinicians, clear advice and appointments that fit your life.",
    about:
      "A friendly practice built on trust. Our qualified team takes time to listen, explain and plan care that works for you.",
    features: [
      i("General check-ups", "Thorough, unhurried appointments for every age."),
      i("Preventive care", "Screening and advice to keep you well."),
      i("Specialist referrals", "Joined-up care with trusted specialists."),
    ],
    projects: [
      i("Family check-ups", "One visit for the whole household.", "All ages"),
      i("Diagnostics", "Fast tests with clear explanations.", "Same week"),
      i("Ongoing care plans", "Support tailored to long-term needs.", "Tailored"),
    ],
    testimonials: [
      i("Rachel T.", "Warm, professional and never rushed."),
      i("Imran S.", "Easy to book and very thorough."),
      i("Linda P.", "They explained everything clearly and kindly."),
    ],
    posts: [
      i("Seasonal health tips", "Simple habits for the months ahead.", "4 min read"),
      i("What to expect at a check-up", "How to prepare and what to ask.", "3 min read"),
      i("Sleep and wellbeing", "Small changes that make a difference.", "5 min read"),
    ],
    labels: {
      features: L("Our services", "Services"),
      projects: L("How we help", "Care"),
      contact: L("Book an appointment", "Contact"),
    },
    palette: "emerald",
  },

  legal: {
    brand: "Hartwell Law",
    topic: "law",
    cta: "Book a consultation",
    headline: "Clear legal advice you can trust",
    tagline: "Practical guidance and strong representation, from first call to final outcome.",
    about:
      "A client-focused law practice. We explain your options in plain language, keep you informed and work hard for the result you need.",
    features: [
      i("Family law", "Sensitive, practical support through difficult changes."),
      i("Property and contracts", "Careful drafting and review that protects you."),
      i("Business advice", "Clear guidance from start-up to growth."),
    ],
    projects: [
      i("Contract dispute", "Resolved through negotiation without court.", "Settled"),
      i("Property purchase", "Smooth completion for a first-time buyer.", "Completed"),
      i("Estate planning", "Wills and trusts arranged with care.", "Ongoing"),
    ],
    testimonials: [
      i("A client, family matter", "Professional, compassionate and always available."),
      i("A business owner", "Clear advice that saved us time and money."),
      i("A first-time buyer", "They made a stressful process simple."),
    ],
    posts: [
      i("What to bring to a first meeting", "Documents that help us help you.", "3 min read"),
      i("Understanding your contract", "Clauses worth checking twice.", "5 min read"),
      i("Mediation or court?", "How to choose the right route.", "6 min read"),
    ],
    labels: {
      features: L("Practice areas", "Areas"),
      projects: L("Case experience", "Experience"),
      contact: L("Book a consultation", "Contact"),
    },
    palette: "sky",
  },

  realestate: {
    brand: "Cedar & Key Realty",
    topic: "property",
    cta: "Arrange a viewing",
    headline: "Find the place you'll love to call home",
    tagline: "Local expertise for buying, selling and renting, with honest advice at every step.",
    about:
      "A local property team who know every street. We value homes accurately, market them well and guide you smoothly to completion.",
    features: [
      i("Buying", "Search, viewings and negotiation handled with care."),
      i("Selling", "Accurate valuations and marketing that gets noticed."),
      i("Lettings", "Reliable tenants and hassle-free management."),
    ],
    projects: [
      i("Garden townhouse", "Three bedrooms, open plan and a private garden.", "$425,000"),
      i("City apartment", "Two bedrooms with a balcony close to transport.", "$310,000"),
      i("Family home", "Four bedrooms on a quiet street near great schools.", "$560,000"),
    ],
    testimonials: [
      i("Sarah and Tom", "Found us our dream home within a month."),
      i("Mr Alvarez", "Sold above asking price with no stress."),
      i("Natalie B.", "Honest advice and quick replies every time."),
    ],
    posts: [
      i("Getting your home ready to sell", "Simple jobs that add value.", "5 min read"),
      i("A first-time buyer checklist", "From deposit to keys.", "6 min read"),
      i("Understanding mortgage options", "Fixed, variable and everything between.", "5 min read"),
    ],
    labels: {
      features: L("How we help", "Services"),
      projects: L("Featured properties", "Properties"),
      contact: L("Arrange a viewing", "Contact"),
    },
    palette: "emerald",
  },

  education: {
    brand: "Bright Path Academy",
    topic: "learning",
    cta: "Enrol today",
    headline: "Learn skills that open doors",
    tagline: "Expert teachers, flexible courses and support at every step.",
    about:
      "A learning community for curious people. Courses are practical, taught in small groups and designed to build real confidence.",
    features: [
      i("Expert teachers", "Experienced practitioners who love to teach."),
      i("Flexible schedules", "Evening, weekend and self-paced options."),
      i("Practical projects", "Learn by making things you can show."),
    ],
    projects: [
      i("Foundations", "Start from zero with clear weekly lessons.", "6 weeks"),
      i("Skills workshop", "Hands-on sessions with real projects.", "4 weeks"),
      i("Advanced studio", "A deep dive with feedback from mentors.", "8 weeks"),
    ],
    testimonials: [
      i("Leila", "I finally understood it. The teachers are brilliant."),
      i("Marco", "Practical, friendly and well organised."),
      i("Jess", "I got a new job within three months of finishing."),
    ],
    posts: [
      i("How to build a study routine", "Habits that actually stick.", "5 min read"),
      i("Learning in short bursts", "Why little and often works.", "4 min read"),
      i("Choosing the right course", "Questions to ask before you enrol.", "4 min read"),
    ],
    plans: [
      i("Single course", "Lifetime access to one course.", "$99"),
      i("Annual", "All courses for a full year.", "$249"),
      i("Team", "Seats for your whole team.", "$599"),
    ],
    labels: {
      features: L("Why learn with us", "Why us"),
      projects: L("Popular courses", "Courses"),
      pricing: L("Fees", "Pricing"),
      contact: L("Enrol today", "Contact"),
    },
    palette: "indigo",
  },

  travel: {
    brand: "Wander & Roam",
    topic: "travel",
    cta: "Plan my trip",
    headline: "Journeys worth remembering",
    tagline: "Handpicked trips, local guides and the freedom to explore at your own pace.",
    about:
      "A small travel team obsessed with great experiences. We design trips around you, with trusted local partners and support all along the way.",
    features: [
      i("Handpicked stays", "Places with character, chosen by people who have been."),
      i("Local guides", "Insider knowledge and stories you will not find online."),
      i("24/7 support", "Help on the ground whenever you need it."),
    ],
    projects: [
      i("Coastal escape", "Seven days of beaches, seafood and sunsets.", "7 days"),
      i("Mountain trek", "Guided hikes and cosy lodges.", "5 days"),
      i("City break", "Food, culture and hidden corners.", "3 days"),
    ],
    testimonials: [
      i("The Carter family", "The best holiday we have ever had. Everything was organised."),
      i("Anika", "Perfect balance of adventure and rest."),
      i("Luis and Marta", "Our guide made the trip unforgettable."),
    ],
    posts: [
      i("Packing light for any trip", "Less luggage, more freedom.", "4 min read"),
      i("The best time to visit the coast", "Weather, crowds and prices.", "5 min read"),
      i("How to travel slowly", "Staying longer and seeing more.", "6 min read"),
    ],
    labels: {
      features: L("Why travel with us", "Why us"),
      projects: L("Popular trips", "Trips"),
      gallery: L("Travel moments", "Gallery"),
      contact: L("Plan my trip", "Contact"),
    },
    palette: "sky",
  },

  fashion: {
    brand: "Atelier Rose",
    topic: "fashion",
    cta: "Visit the boutique",
    headline: "Style that feels like you",
    tagline: "Thoughtfully made pieces for every day and every occasion.",
    about:
      "An independent label focused on quality fabrics, timeless cuts and considered design. Every piece is made to be worn and loved for years.",
    features: [
      i("Quality fabrics", "Natural materials that feel as good as they look."),
      i("Timeless design", "Clean lines that never go out of style."),
      i("Made responsibly", "Small runs, fair work and less waste."),
    ],
    projects: [
      i("The linen edit", "Light layers for warm days.", "New"),
      i("Evening line", "Statement pieces for special nights.", "Limited"),
      i("Everyday basics", "Soft essentials that go with everything.", "Best seller"),
    ],
    testimonials: [
      i("Olivia", "The quality is wonderful and the fit is perfect."),
      i("Hannah", "I get compliments every time I wear it."),
      i("Grace", "Beautiful pieces and lovely service."),
    ],
    posts: [
      i("How to build a capsule wardrobe", "Fewer pieces, more outfits.", "5 min read"),
      i("Caring for natural fabrics", "Wash, dry and store with care.", "4 min read"),
      i("One jacket, five ways", "Styling ideas from day to night.", "3 min read"),
    ],
    labels: {
      features: L("Why choose us", "Why us"),
      projects: L("Latest collection", "Collection"),
      gallery: L("Lookbook", "Lookbook"),
      contact: L("Visit the boutique", "Contact"),
    },
    palette: "rose",
  },

  music: {
    brand: "Nova Echo",
    topic: "music",
    cta: "Book a show",
    headline: "Music that moves the room",
    tagline: "Live shows, new releases and the stories behind the songs.",
    about:
      "A musician driven by melody and live energy. From intimate sets to festival stages, every performance is built to connect.",
    features: [
      i("Live performances", "Energetic sets for venues, festivals and private events."),
      i("Original releases", "Songs written, recorded and produced with care."),
      i("Collaborations", "Open to features, sessions and co-writes."),
    ],
    projects: [
      i("First Light", "A debut single with soaring hooks.", "Single"),
      i("Night Drive", "A moody, synth-led EP.", "EP"),
      i("Live Sessions", "Stripped-back versions recorded live.", "Live"),
    ],
    testimonials: [
      i("A festival booker", "Brought the whole crowd to its feet."),
      i("A fan", "Every show is better than the last."),
      i("A fellow musician", "Generous, creative and effortless to work with."),
    ],
    posts: [
      i("Writing the new record", "Where the songs came from.", "5 min read"),
      i("Behind the studio door", "A day of recording.", "4 min read"),
      i("Tour diary", "Notes from the road.", "6 min read"),
    ],
    labels: {
      features: L("Live and studio", "Live"),
      projects: L("Latest releases", "Music"),
      gallery: L("Photos", "Gallery"),
      contact: L("Book a show", "Contact"),
    },
    palette: "violet",
  },

  beauty: {
    brand: "Luna Beauty Studio",
    topic: "beauty",
    cta: "Book an appointment",
    headline: "Look good. Feel wonderful.",
    tagline: "Expert hair, skin and beauty treatments in a relaxing studio.",
    about:
      "A welcoming studio where care and craft come together. Our stylists and therapists tailor every treatment to you.",
    features: [
      i("Hair styling", "Cuts, colour and finishing by experienced stylists."),
      i("Skin care", "Facials and treatments for healthy, glowing skin."),
      i("Nails and brows", "Precise, polished results every time."),
    ],
    projects: [
      i("Soft balayage", "Natural, sun-kissed colour.", "Hair"),
      i("Bridal glow", "Skin prep and makeup for the big day.", "Bridal"),
      i("Classic cut and colour", "A fresh look with easy upkeep.", "Hair"),
    ],
    menu: [
      i("Cut and style", "Consultation, wash and finish.", "$55"),
      i("Signature facial", "Cleanse, exfoliate and hydrate.", "$75"),
      i("Manicure", "Shape, care and polish.", "$35"),
    ],
    testimonials: [
      i("Zoe", "My hair has never looked better. So friendly too."),
      i("Priya", "The most relaxing facial I have ever had."),
      i("Natasha", "They took the stress out of my wedding morning."),
    ],
    posts: [
      i("Caring for coloured hair", "Keep your colour vibrant for longer.", "4 min read"),
      i("Skin routine basics", "Three steps that make a difference.", "3 min read"),
      i("Bridal beauty timeline", "What to book and when.", "5 min read"),
    ],
    labels: {
      features: L("Our treatments", "Treatments"),
      projects: L("Recent work", "Work"),
      menu: L("Price list", "Prices"),
      gallery: L("Our studio", "Gallery"),
      contact: L("Book an appointment", "Contact"),
    },
    palette: "rose",
  },

  finance: {
    brand: "Clearview Advisory",
    topic: "finance",
    cta: "Book a free consultation",
    headline: "Clear numbers. Confident decisions.",
    tagline: "Accounting, tax and planning advice for people and growing businesses.",
    about:
      "A small, qualified team that makes finance simple. We keep you compliant, save you time and help you plan with confidence.",
    features: [
      i("Accounting and bookkeeping", "Accurate records, filed on time."),
      i("Tax planning", "Make the most of every allowance."),
      i("Business advice", "Forecasts and guidance for your next step."),
    ],
    projects: [
      i("Start-up set-up", "Books, payroll and tax in place from day one.", "Small business"),
      i("Year-end clean-up", "Accounts filed accurately and on time.", "Compliance"),
      i("Growth plan", "Forecasts to guide your next big decision.", "Planning"),
    ],
    testimonials: [
      i("Owner, local bakery", "They made tax time stress-free for the first time."),
      i("A freelance designer", "Clear advice in plain English."),
      i("Director, a tech start-up", "Responsive, accurate and great value."),
    ],
    posts: [
      i("A simple tax calendar", "Deadlines to put in your diary.", "4 min read"),
      i("Bookkeeping habits that save money", "Ten minutes a week.", "5 min read"),
      i("Planning for your first hire", "What it really costs.", "6 min read"),
    ],
    labels: {
      features: L("Our services", "Services"),
      projects: L("How we help", "Results"),
      contact: L("Free consultation", "Contact"),
    },
    palette: "sky",
  },

  construction: {
    brand: "Ironwood Builders",
    topic: "construction",
    cta: "Get a free quote",
    headline: "Built right. Finished on time.",
    tagline: "Reliable building, repair and renovation work you can depend on.",
    about:
      "A licensed, insured team with years of hands-on experience. Clear quotes, tidy work and honest timelines on every job.",
    features: [
      i("Renovations", "Kitchens, bathrooms and whole-home updates."),
      i("Extensions and new builds", "Extra space designed and built to last."),
      i("Repairs and maintenance", "Fast, dependable fixes for urgent problems."),
    ],
    projects: [
      i("Kitchen renovation", "Open-plan living with new cabinetry and lighting.", "2025"),
      i("Rear extension", "Extra living space with large glass doors.", "2024"),
      i("Bathroom refit", "Waterproofing, tiling and new fixtures.", "2024"),
    ],
    testimonials: [
      i("Karen H.", "Tidy, on time and exactly on budget."),
      i("Dev P.", "They solved problems before we even noticed them."),
      i("Luis R.", "Honest quote and beautiful workmanship."),
    ],
    posts: [
      i("Planning a renovation budget", "Where the money really goes.", "5 min read"),
      i("What to ask a contractor", "Questions before you sign.", "4 min read"),
      i("Spotting damp early", "Signs to look for.", "3 min read"),
    ],
    labels: {
      features: L("Our services", "Services"),
      projects: L("Recent projects", "Projects"),
      gallery: L("Our work", "Gallery"),
      contact: L("Get a free quote", "Contact"),
    },
    palette: "amber",
  },

  creative: {
    brand: "Alex Morgan",
    topic: "design",
    cta: "View my work",
    headline: "Thoughtful design with a clear point of view",
    tagline: "Brand, illustration and visual work that helps ideas stand out.",
    about:
      "A creative with a love for simple, memorable ideas. Projects begin with listening and end with work that feels unmistakably yours.",
    features: [
      i("Branding", "Logos and identities with a clear personality."),
      i("Illustration", "Custom artwork for print and screen."),
      i("Layout and print", "Editorial design with care for detail."),
    ],
    projects: [
      i("Harbor identity", "Logo and brand system for a coastal cafe.", "2025"),
      i("Field Notes", "An editorial illustration series.", "2024"),
      i("Atlas poster set", "Typographic prints for an arts festival.", "2023"),
    ],
    testimonials: [
      i("An art director", "Original ideas and a joy to collaborate with."),
      i("A small business owner", "Captured our brand perfectly."),
      i("A festival organiser", "Delivered beautiful work, right on time."),
    ],
    posts: [
      i("How I start a brand project", "From first call to first sketch.", "5 min read"),
      i("Choosing colours that last", "Palettes that age well.", "4 min read"),
      i("Sketching before screens", "Why paper still wins.", "3 min read"),
    ],
    labels: {
      features: L("What I do", "Services"),
      projects: L("Selected work", "Work"),
      gallery: L("Portfolio", "Gallery"),
      contact: L("Let's work together", "Contact"),
    },
    palette: "indigo",
  },

  writing: {
    brand: "Jamie Hart",
    topic: "writing",
    cta: "Read my work",
    headline: "Words that get read",
    tagline: "Essays, stories and copy written with clarity and care.",
    about:
      "A writer who believes good ideas deserve clear language. Work spans features, essays and brand copy, always researched and carefully edited.",
    features: [
      i("Features and essays", "Long-form pieces with a clear voice."),
      i("Brand and web copy", "Words that sound like you and sell."),
      i("Newsletters", "Regular, readable updates for your audience."),
    ],
    projects: [
      i("The long way home", "A personal essay about moving cities.", "2025"),
      i("Small shops, big stories", "A series on local businesses.", "2024"),
      i("Voice and tone guide", "A copy system for a growing brand.", "2023"),
    ],
    testimonials: [
      i("An editor", "Clean copy, delivered early."),
      i("A client", "Understood our audience immediately."),
      i("A reader", "I read every word. Wonderful writing."),
    ],
    posts: [
      i("Writing every day", "A small habit with big returns.", "4 min read"),
      i("Editing your own work", "Cut, then cut again.", "5 min read"),
      i("Finding a story worth telling", "Where ideas come from.", "6 min read"),
    ],
    labels: {
      features: L("What I write", "Writing"),
      projects: L("Published work", "Work"),
      contact: L("Commission a piece", "Contact"),
    },
    palette: "rose",
  },
};

/** The pack for an industry, or null for the generic "business" fallback. */
export function packFor(industry: IndustryId): IndustryPack | null {
  return industry === "business" ? null : INDUSTRY_PACKS[industry];
}

export function usesIndustryDefaults(type: SiteType, industry: IndustryId): boolean {
  return type === "portfolio" || type === "business" || type === "restaurant" ||
    (type === "product" && (industry === "retail" || packFor(industry)?.productDefaults === true));
}

/** Placeholder brand name for a site using industry-specific copy. */
export function defaultBrand(type: SiteType, industry: IndustryId): string {
  const pack = packFor(industry);
  return pack && usesIndustryDefaults(type, industry) ? pack.brand : DEFAULT_BRAND[type];
}

/**
 * Moves a spec to another industry, replacing the placeholder brand name when
 * it was only a default (a name given in the prompt is kept).
 */
export function retargetIndustry(spec: SiteSpec, industry: IndustryId): SiteSpec {
  const brandWasDefault = spec.brand === defaultBrand(spec.type, spec.industry);
  return { ...spec, industry, brand: brandWasDefault ? defaultBrand(spec.type, industry) : spec.brand };
}
