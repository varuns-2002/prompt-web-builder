import type { IndustryId } from "./types";

interface TemplateStarter {
  industry: IndustryId;
  label: string;
  prompt: string;
}

interface TemplateGroup {
  label: string;
  starters: TemplateStarter[];
}

export const TEMPLATE_GROUPS: TemplateGroup[] = [
  {
    label: "Local businesses",
    starters: [
      { industry: "realestate", label: "Real estate", prompt: "A modern real estate agency website with property projects and a contact form" },
      { industry: "bakery", label: "Bakery", prompt: "An elegant bakery website with a menu, gallery and order enquiries" },
      { industry: "beauty", label: "Salon", prompt: "An elegant hair salon website with services, a gallery and a contact form" },
      { industry: "fitness", label: "Gym", prompt: "A bold gym website with classes, membership pricing and contact" },
      { industry: "homeservices", label: "Home repairs", prompt: "A handyman and appliance repair business website with services and contact" },
      { industry: "cleaning", label: "Cleaning services", prompt: "A modern cleaning company website with home and office services, reviews and quote enquiries" },
      { industry: "construction", label: "Construction", prompt: "A bold construction company website with services, completed projects and contact" },
    ],
  },
  {
    label: "Professional services",
    starters: [
      { industry: "consulting", label: "Consulting", prompt: "A modern consulting firm website with services, case studies and contact" },
      { industry: "finance", label: "Accounting", prompt: "A professional accounting firm website with tax services and contact" },
      { industry: "recruitment", label: "Recruitment", prompt: "A recruitment agency website with hiring services, roles and contact" },
      { industry: "marketing", label: "Marketing", prompt: "A bold marketing agency website with services, campaigns and contact" },
      { industry: "legal", label: "Law firm", prompt: "An elegant law firm website with legal services, an about section and consultation enquiries" },
    ],
  },
  {
    label: "Healthcare and education",
    starters: [
      { industry: "health", label: "Healthcare clinic", prompt: "A modern healthcare clinic website with medical services, an about section and contact enquiries" },
      { industry: "dental", label: "Dental practice", prompt: "A clean dental clinic website with dental services, reviews and appointment enquiries" },
      { industry: "education", label: "Tutoring", prompt: "A friendly tutoring website with subjects, teaching services and contact" },
      { industry: "schools", label: "School", prompt: "A welcoming primary school website with programmes, a gallery and admissions enquiries" },
      { industry: "onlinecourses", label: "Online courses", prompt: "A modern online course platform landing page with sample courses, learning features and course enquiries" },
    ],
  },
  {
    label: "Travel, logistics and agriculture",
    starters: [
      { industry: "travel", label: "Travel agency", prompt: "An elegant travel agency website with tours, a gallery and travel enquiries" },
      { industry: "travelbooking", label: "Travel booking showcase", prompt: "A modern travel booking platform landing page with sample itineraries and booking enquiries" },
      { industry: "logistics", label: "Logistics and delivery", prompt: "A professional logistics company website with freight services, delivery projects and quote enquiries" },
      { industry: "agriculture", label: "Agriculture and farming", prompt: "A green organic farm website with seasonal produce, farming services, a gallery and contact" },
    ],
  },
  {
    label: "Digital businesses",
    starters: [
      { industry: "software", label: "Software company", prompt: "A modern software company website with development services, projects and contact" },
      { industry: "aitools", label: "AI tool showcase", prompt: "A bold AI assistant tool landing page with sample workflows, features and demo enquiries" },
      { industry: "cybersecurity", label: "Cybersecurity", prompt: "A dark cybersecurity company website with security services, example projects and contact" },
      { industry: "fintech", label: "Fintech showcase", prompt: "A modern fintech digital wallet landing page with product features, example use cases and demo enquiries" },
    ],
  },
  {
    label: "More industries",
    starters: [
      { industry: "events", label: "Event planning", prompt: "An elegant wedding planner website with services, a gallery and contact" },
      { industry: "interiors", label: "Interior design", prompt: "An elegant interior designer website with projects, a gallery and contact" },
      { industry: "nonprofit", label: "Nonprofit", prompt: "A welcoming nonprofit charity website with programmes, volunteering and contact" },
      { industry: "retail", label: "Online shop showcase", prompt: "A modern online shop website with a product collection, gallery and enquiries" },
    ],
  },
];
