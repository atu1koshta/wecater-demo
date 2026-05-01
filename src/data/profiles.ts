import type { Profile } from "@/types";

export const PROFILES: Profile[] = [
  {
    id: "patel",
    name: "Dr. Patel's Cardiology",
    icon: "🫀",
    headcount: 14,
    physicians: [
      { name: "Dr. Anika Patel", npi: "1234567890", ytd: 68.0, threshold: 100 },
    ],
    address: "4530 E Shea Blvd, Suite 220, Phoenix AZ",
    contact: {
      name: "Maria Espinoza",
      role: "Office Manager",
      phone: "(602) 555-0142",
    },
    frequency: "2× monthly",
    lastOrder: {
      date: "Apr 18",
      restaurant: "Bangkok Garden",
      cuisine: "Thai",
      amount: 198,
    },
    nextScheduled: "Tue Apr 29 — 12:00pm",
    dietary: {
      total: 14,
      breakdown: { vegetarian: 3, vegan: 1, glutenFree: 2, nutAllergy: 1 },
      people: [
        {
          name: "Dr. Patel",
          restriction: "Strict vegetarian",
          source: "explicit",
          priority: "high",
          learned: "Mar 12",
        },
        {
          name: "Nurse Kim",
          restriction: "Celiac — strict GF",
          source: "explicit",
          priority: "high",
          learned: "Feb 4",
        },
        {
          name: "James (PA)",
          restriction: "Vegan",
          source: "explicit",
          priority: "medium",
          learned: "Jan 22",
        },
        {
          name: "Office staff",
          restriction: "1 nut allergy (unconfirmed who)",
          source: "implicit",
          priority: "high",
          learned: "Apr 4",
        },
      ],
    },
    notes: [
      {
        text: "Always call Maria at (602) 555-0142 before placing the order — she approves all rep lunches",
        date: "Mar 12",
        priority: "high",
        pinned: true,
      },
      {
        text: "Office loves churros — add as dessert when available",
        date: "Apr 27",
        priority: "medium",
      },
      {
        text: "Office prefers pickup over delivery. Parking lot entrance at rear.",
        date: "Feb 28",
        priority: "medium",
      },
      {
        text: "Dr. Patel likes variety — don't repeat within 3 weeks",
        date: "Jan 15",
        priority: "low",
      },
    ],
    history: [
      { date: "Apr 18", restaurant: "Bangkok Garden", cuisine: "Thai", amount: 198, perPp: 14.14 },
      { date: "Apr 4",  restaurant: "Pita Jungle",     cuisine: "Mediterranean", amount: 215, perPp: 15.36 },
      { date: "Mar 21", restaurant: "Curry Corner",    cuisine: "Indian", amount: 204, perPp: 14.57 },
      { date: "Mar 7",  restaurant: "Flower Child",    cuisine: "Healthy bowls", amount: 230, perPp: 16.43 },
      { date: "Feb 21", restaurant: "Bobby Q",         cuisine: "BBQ", amount: 195, perPp: 13.93 },
    ],
    competitors: [
      { rep: "Pfizer rep", brought: "Sushi platter", date: "Apr 22" },
      { rep: "Merck rep",  brought: "Italian",       date: "Apr 9" },
    ],
    flags: ["compliance_safe", "active_relationship"],
  },
  {
    id: "morrison",
    name: "Dr. Morrison's Internal Med",
    icon: "🩺",
    headcount: 8,
    physicians: [
      { name: "Dr. Lisa Morrison", npi: "9876543210", ytd: 84.25, threshold: 100 },
      { name: "Dr. James Chen",    npi: "5678901234", ytd: 42.0,  threshold: 100 },
    ],
    address: "1212 N Central Ave, Phoenix AZ",
    contact: { name: "Brenda Walsh", role: "Practice Admin", phone: "(602) 555-0287" },
    frequency: "3× monthly",
    lastOrder: { date: "Apr 24", restaurant: "Pita Jungle", cuisine: "Mediterranean", amount: 142 },
    nextScheduled: "Wed Apr 30 — 11:30am",
    dietary: {
      total: 8,
      breakdown: { vegetarian: 1, vegan: 0, glutenFree: 1, nutAllergy: 0 },
      people: [
        {
          name: "Dr. Morrison",
          restriction: "Pescatarian",
          source: "explicit",
          priority: "medium",
          learned: "Feb 11",
        },
        {
          name: "Office mgr Brenda",
          restriction: "Gluten-free preference",
          source: "implicit",
          priority: "low",
          learned: "Mar 3",
        },
      ],
    },
    notes: [
      {
        text: "Approaching $100 de minimis — only $15.75 remaining for Dr. Morrison this year",
        date: "Apr 24",
        priority: "high",
        pinned: true,
      },
      {
        text: "Brenda confirms orders by text faster than email",
        date: "Mar 18",
        priority: "medium",
      },
    ],
    history: [
      { date: "Apr 24", restaurant: "Pita Jungle",  cuisine: "Mediterranean", amount: 142, perPp: 17.75 },
      { date: "Apr 10", restaurant: "Flower Child", cuisine: "Healthy bowls", amount: 156, perPp: 19.5 },
    ],
    competitors: [],
    flags: ["compliance_warning"],
  },
  {
    id: "chen",
    name: "Dr. Chen's Pediatrics",
    icon: "👶",
    headcount: 22,
    physicians: [
      { name: "Dr. Wei Chen", npi: "2345678901", ytd: 32.5, threshold: 100 },
      { name: "Dr. Sarah Lee", npi: "3456789012", ytd: 28.0, threshold: 100 },
    ],
    address: "8800 N Scottsdale Rd, Suite 100, Scottsdale AZ",
    contact: { name: "Jenna Tom", role: "Lead RN", phone: "(480) 555-0399" },
    frequency: "monthly",
    lastOrder: { date: "Apr 11", restaurant: "Oregano's Pizza", cuisine: "Italian", amount: 285 },
    nextScheduled: "Mon May 12 — 12:00pm",
    dietary: {
      total: 22,
      breakdown: { vegetarian: 4, vegan: 1, glutenFree: 3, nutAllergy: 2 },
      people: [
        {
          name: "Dr. Lee",
          restriction: "Severe peanut allergy — separate prep required",
          source: "explicit",
          priority: "high",
          learned: "Jan 8",
        },
        {
          name: "Multiple staff",
          restriction: "Family-friendly variety preferred",
          source: "implicit",
          priority: "low",
          learned: "Mar 21",
        },
      ],
    },
    notes: [
      {
        text: "Large team — kid-friendly options score better. Staff often eats leftovers next day.",
        date: "Mar 21",
        priority: "medium",
      },
    ],
    history: [
      { date: "Apr 11", restaurant: "Oregano's Pizza", cuisine: "Italian", amount: 285, perPp: 12.95 },
      { date: "Mar 14", restaurant: "Barrio Queen",   cuisine: "Mexican",  amount: 308, perPp: 14.0 },
    ],
    competitors: [],
    flags: ["large_team"],
  },
  {
    id: "westside",
    name: "Westside Oncology Center",
    icon: "🏥",
    headcount: 35,
    physicians: [
      { name: "Dr. Marcus Webb", npi: "4567890123", ytd: 51.0, threshold: 100 },
      { name: "Dr. Priya Shah",  npi: "5678901234", ytd: 47.5, threshold: 100 },
      { name: "Dr. Elena Ruiz",  npi: "6789012345", ytd: 38.0, threshold: 100 },
    ],
    address: "10210 W Indian School Rd, Phoenix AZ",
    contact: { name: "Rachel Brown", role: "Clinic Manager", phone: "(623) 555-0671" },
    frequency: "2× monthly",
    lastOrder: { date: "Apr 16", restaurant: "Flower Child", cuisine: "Healthy bowls", amount: 595 },
    nextScheduled: "Thu May 1 — 11:30am",
    dietary: {
      total: 35,
      breakdown: { vegetarian: 7, vegan: 3, glutenFree: 4, nutAllergy: 1 },
      people: [
        {
          name: "Dr. Shah",
          restriction: "Halal only",
          source: "explicit",
          priority: "high",
          learned: "Feb 1",
        },
        {
          name: "Dr. Ruiz",
          restriction: "Low-sodium for cardiac patient lunch hours",
          source: "explicit",
          priority: "medium",
          learned: "Mar 5",
        },
      ],
    },
    notes: [
      {
        text: "High-volume clinic — order needs to feed 35 reliably; under-portioning damages relationship",
        date: "Mar 5",
        priority: "high",
        pinned: true,
      },
    ],
    history: [
      { date: "Apr 16", restaurant: "Flower Child", cuisine: "Healthy bowls", amount: 595, perPp: 17.0 },
      { date: "Apr 2",  restaurant: "Curry Corner", cuisine: "Indian",        amount: 525, perPp: 15.0 },
    ],
    competitors: [
      { rep: "Bristol Myers", brought: "Mediterranean", date: "Apr 19" },
    ],
    flags: ["high_volume"],
  },
  {
    id: "phx-heart",
    name: "Phoenix Heart Specialists",
    icon: "❤️",
    headcount: 12,
    physicians: [
      { name: "Dr. Robert Kim", npi: "7890123456", ytd: 12.0, threshold: 100 },
    ],
    address: "5601 N 16th St, Phoenix AZ",
    contact: { name: "Tina Rodriguez", role: "Front Desk Lead", phone: "(602) 555-0844" },
    frequency: "first visit",
    lastOrder: null,
    nextScheduled: "Mon May 5 — 12:30pm",
    dietary: {
      total: 12,
      breakdown: { vegetarian: 0, vegan: 0, glutenFree: 0, nutAllergy: 0 },
      people: [],
    },
    notes: [
      {
        text: "First visit. Confirmed lunch slot for May 5. No dietary info gathered yet — ask Tina at check-in.",
        date: "Apr 25",
        priority: "high",
        pinned: true,
      },
    ],
    history: [],
    competitors: [],
    flags: ["new_relationship", "incomplete_profile"],
  },
  {
    id: "sun-valley",
    name: "Sun Valley Family Practice",
    icon: "🌵",
    headcount: 6,
    physicians: [
      { name: "Dr. Mark Sullivan", npi: "8901234567", ytd: 22.0, threshold: 100 },
    ],
    address: "12424 N Tatum Blvd, Phoenix AZ",
    contact: { name: "Carla Diaz", role: "Office Mgr", phone: "(602) 555-0915" },
    frequency: "monthly",
    lastOrder: { date: "Mar 28", restaurant: "Bobby Q", cuisine: "BBQ", amount: 88 },
    nextScheduled: null,
    dietary: {
      total: 6,
      breakdown: { vegetarian: 0, vegan: 0, glutenFree: 1, nutAllergy: 0 },
      people: [
        {
          name: "Dr. Sullivan",
          restriction: "GF preferred not strict",
          source: "implicit",
          priority: "low",
          learned: "Mar 28",
        },
      ],
    },
    notes: [],
    history: [
      { date: "Mar 28", restaurant: "Bobby Q", cuisine: "BBQ", amount: 88, perPp: 14.67 },
    ],
    competitors: [],
    flags: ["dormant"],
  },
];

export const DEFAULT_PROFILE_ID = "patel";
