import { singularCandidates } from "./fuzzy";
import type { IndustryId } from "./types";

const RAW_KEYWORDS: Record<Exclude<IndustryId, "business">, string[]> = {
  dental: ["dental", "dentist", "dentistry", "orthodontist", "orthodontics", "endodontist"],
  cleaning: ["cleaning", "cleaner", "maid", "janitorial", "housekeeping"],
  logistics: ["logistics", "courier", "freight", "shipping", "haulage", "warehousing", "dispatch"],
  agriculture: ["agriculture", "agricultural", "farm", "farmer", "farming", "agribusiness", "agronomy", "harvest", "crops"],
  aitools: ["ai", "chatbot", "llm", "generative"],
  cybersecurity: ["cybersecurity", "infosec", "pentesting", "ransomware"],
  fintech: ["fintech", "neobank", "neobanking"],
  onlinecourses: ["elearning", "lms", "courseware"],
  schools: ["school", "kindergarten", "preschool", "campus", "admissions"],
  travelbooking: ["itinerary", "itineraries"],
  bakery: ["bakery", "baker", "bakers", "bread", "sourdough", "patisserie", "pastry", "pastries", "cupcake", "croissant", "cakes"],
  consulting: ["consultant", "consultants", "consulting", "consultancy", "advisory"],
  recruitment: ["recruiter", "recruiters", "recruitment", "recruiting", "staffing", "headhunter", "hiring"],
  marketing: ["marketing", "branding", "advertising", "seo", "copywriting", "advertiser"],
  events: ["event", "events", "celebration", "celebrations"],
  interiors: ["interior", "interiors", "decor", "decorator", "decorating", "furnishing", "furnishings"],
  nonprofit: ["nonprofit", "ngo", "charity", "charities", "fundraiser", "fundraising", "nonprofits"],
  retail: ["ecommerce", "retail", "retailer", "storefront", "webshop"],
  motorsport: [
    "f1", "formula", "racing", "racer", "racers", "motorsport", "motorsports", "nascar", "motogp",
    "karting", "kart", "rally", "speedway", "prix", "grandprix", "indycar", "drifting",
  ],
  automotive: [
    "car", "cars", "auto", "autos", "automotive", "garage", "garages", "mechanic", "mechanics", "dealership",
    "dealerships", "dealer", "vehicle", "vehicles", "tyres", "tires", "carwash", "detailing", "motorcycle",
    "motorbike", "truck", "trucks", "taxi", "bodyshop", "scooter", "chauffeur",
  ],
  sports: [
    "athlete", "athletes", "sport", "sports", "football", "footballer", "soccer", "cricket",
    "cricketer", "basketball", "tennis", "golf", "boxing", "boxer", "swimmer", "swimming", "runner",
    "marathon", "olympic", "olympian", "wrestler", "hockey", "rugby", "badminton", "baseball",
    "cyclist", "cycling", "volleyball", "athletics", "tournament", "skater", "skiing", "surfer",
  ],
  pets: [
    "pet", "pets", "dog", "dogs", "cat", "cats", "puppy", "puppies", "kitten", "kittens", "vet",
    "veterinary", "grooming", "groomer", "kennel", "petshop", "horse", "horses", "equestrian",
    "aquarium", "parrot", "hamster", "rabbit", "petcare", "animal", "animals",
  ],
  gaming: [
    "gamer", "gamers", "gaming", "game", "games", "esports", "streamer", "twitch", "console", "minecraft",
    "playstation", "xbox", "nintendo", "fortnite", "roblox", "valorant", "gamedev",
  ],
  floral: [
    "florist", "florists", "flower", "flowers", "floral", "bouquet", "bouquets", "blooms", "petals",
    "botanical", "greenhouse", "succulents", "plants", "wreath", "wreaths",
  ],
  community: [
    "club", "clubs", "society", "volunteer", "volunteers",
    "church", "temple", "mosque", "association", "chess", "meetup", "meetups", "hobby", "hobbies", "scouts",
    "alumni", "congregation", "parish",
  ],
  homeservices: [
    "movers", "removals", "locksmith", "handyman",
    "gardener", "gardening", "landscaping", "landscaper", "lawn", "pest", "carpet", "upholstery", "hvac",
    "appliance", "laundry", "decluttering",
  ],
  photography: [
    "photographer", "photographers", "photography", "photo", "photos", "camera", "wedding", "videographer",
    "filmmaker", "cinematography", "photoshoot", "portraits",
  ],
  software: [
    "developer", "developers", "programmer", "software", "saas", "app", "apps", "tech",
    "technology", "coding", "code", "engineer", "react", "startup", "cloud",
    "devops", "frontend", "backend", "fullstack", "python", "javascript", "blockchain", "analytics", "robotics",
  ],
  food: [
    "restaurant", "cafe", "café", "coffee", "food", "bistro", "pizzeria", "pizza",
    "diner", "chef", "catering", "kitchen", "bar", "brewery", "barista", "cafeteria", "eatery", "bbq",
    "burger", "burgers", "sushi", "tacos", "dessert", "desserts",
    "tavern", "pub", "caterer", "takeaway", "smoothie", "vegan", "donut", "icecream",
  ],
  fitness: [
    "gym", "fitness", "yoga", "trainer", "workout", "crossfit", "pilates", "bodybuilding", "zumba",
    "karate", "taekwondo", "judo", "kickboxing", "nutritionist", "dietitian", "gymnasium", "calisthenics",
  ],
  health: [
    "doctor", "clinic", "hospital", "health", "medical", "healthcare",
    "therapy", "therapist", "pharmacy", "wellness", "nurse", "physio", "physiotherapy", "physiotherapist",
    "chiropractor", "optician", "optometrist", "pediatrician", "dermatologist", "psychologist", "counselling",
    "counseling", "surgeon", "midwife",
  ],
  legal: ["lawyer", "lawyers", "law", "attorney", "legal", "notary", "solicitor", "barrister", "paralegal", "litigation"],
  realestate: [
    "realtor", "property", "properties", "apartment", "apartments", "house", "houses", "homes", "realty",
    "landlord", "lettings", "rental", "rentals", "condo", "condos", "estate",
  ],
  education: [
    "education", "teacher", "course", "courses", "tutor", "tutoring", "tutors",
    "university", "academy", "learning", "coaching", "college", "bootcamp",
    "homeschool", "mentoring", "ielts", "daycare",
  ],
  travel: [
    "travel", "trip", "trips", "tour", "tours", "hotel", "resort", "vacation", "holiday", "tourism",
    "adventure", "airline", "flights", "cruise", "hostel", "backpacking", "safari", "trekking", "camping", "airbnb",
  ],
  fashion: [
    "fashion", "clothing", "boutique", "apparel", "clothes", "jewelry", "jewellery", "tailor", "tailoring",
    "dress", "dresses", "shoes", "sneakers", "handbag", "handbags", "streetwear", "couture", "lingerie",
  ],
  music: [
    "music", "musician", "band", "singer", "dj", "concert", "guitarist", "producer", "orchestra", "choir",
    "guitar", "piano", "drummer", "violin", "songwriter", "vocalist", "nightclub", "album", "bands",
  ],
  beauty: [
    "salon", "beauty", "makeup", "spa", "barber", "hair", "cosmetics", "nails", "barbershop", "hairdresser",
    "hairstylist", "stylist", "lashes", "skincare", "massage", "tattoo", "waxing", "esthetician", "manicure",
  ],
  finance: [
    "finance", "financial", "accounting", "accountant", "bank", "banking", "investment",
    "insurance", "crypto", "bookkeeping", "tax", "taxes", "loan", "loans", "mortgage", "wealth",
    "pension", "payroll", "auditor", "trading", "forex",
  ],
  construction: [
    "construction", "builder", "builders", "plumber", "plumbing", "electrician", "contractor",
    "roofing", "renovation", "carpentry", "architect", "architecture", "repair", "carpenter", "welder",
    "welding", "bricklayer", "roofer", "plasterer", "tiler", "scaffolding", "joiner",
  ],
  creative: [
    "designer", "artist", "illustrator", "art", "creative", "design", "graphic", "animation", "painter",
    "sculptor", "calligraphy", "ceramics", "pottery", "handmade", "artisan", "animator", "illustration",
  ],
  // Format words, not topics, so they count for much less than a real subject.
  writing: [
    "blog", "writer", "writers", "journal", "magazine", "article", "articles", "news", "author", "poet",
    "poetry", "novelist", "novel", "journalist", "copywriter", "podcast", "newsletter", "editor",
  ],
};

/**
 * Words that tell us what a website is about. The interpreter matches a prompt
 * against these after fixing typos and plurals. To teach it something new, add the
 * word to an industry above. Plurals are understood automatically ("florists" is
 * read as "florist"), so only the singular is kept when both are listed. Fewer
 * entries also means fewer ordinary words sitting one letter away from a keyword.
 */
function withoutPlurals(words: string[]): string[] {
  const all = new Set(words);
  return words.filter((word) => !singularCandidates(word).some((s) => all.has(s)));
}

export const INDUSTRY_KEYWORDS = Object.fromEntries(
  Object.entries(RAW_KEYWORDS).map(([industry, words]) => [industry, withoutPlurals(words)]),
) as Record<Exclude<IndustryId, "business">, string[]>;

/** Unmistakable words. Each one counts double, so "f1 car driver" is racing, not a garage. */
export const STRONG_KEYWORDS = new Set([
  "f1", "formula", "racing", "motorsport", "nascar", "motogp", "karting", "grandprix", "indycar",
  "florist", "bouquet", "locksmith", "chess",
  "bakery", "consultant", "consulting", "recruiter", "recruitment", "marketing",
  "interior", "interiors", "nonprofit", "charity", "ecommerce",
  "dental", "dentist", "cleaning", "logistics", "courier", "freight", "agriculture", "farming",
  "ai", "chatbot", "cybersecurity", "infosec", "fintech", "elearning", "lms", "school",
]);

export const INDUSTRY_PHRASES: Partial<Record<IndustryId, string[]>> = {
  realestate: ["real estate"],
  events: ["event planner", "event planning", "wedding planner", "wedding planning"],
  interiors: ["interior design", "interior designer"],
  nonprofit: ["non profit", "not for profit"],
  retail: ["online shop", "online store", "e commerce"],
  dental: ["dental clinic", "dental practice", "oral care"],
  cleaning: ["cleaning service", "cleaning company", "office cleaning", "house cleaning"],
  logistics: ["supply chain", "delivery service", "delivery company", "freight forwarding"],
  agriculture: ["organic farm", "crop farming", "farm produce"],
  aitools: ["ai tool", "ai tools", "ai assistant", "artificial intelligence", "machine learning"],
  cybersecurity: ["cyber security", "information security", "penetration testing", "security audit"],
  fintech: ["digital banking", "payment platform", "payments platform", "digital wallet", "financial technology"],
  onlinecourses: ["online course", "online courses", "online school", "online learning", "e learning", "course platform"],
  schools: ["primary school", "secondary school", "high school", "nursery school"],
  travelbooking: ["travel booking", "tour booking", "hotel booking", "flight booking", "booking platform", "booking agency"],
};

/** Section words a prompt may use, so a misspelled "gallary" or "testamonials" is still understood. */
export const SECTION_WORDS = [
  "gallery", "testimonial", "review", "pricing", "project", "feature", "service", "contact", "photo",
  "picture", "image", "article", "benefit", "offering",
];
