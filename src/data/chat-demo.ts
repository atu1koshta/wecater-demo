import type { ChatMessage } from "@/types";

/**
 * Scripted demo conversation for the Chatbot Context Panel screen.
 * Each turn carries an optional `contextUpdate` patch that gets merged into
 * the running OrderContext as messages stream in.
 */
export const CHAT_DEMO: ChatMessage[] = [
  {
    role: "user",
    text: "Order for Dr. Patel's office — Tuesday lunch, 14 people",
    contextUpdate: {
      activeProfile: {
        name: "Dr. Patel's Cardiology Office",
        type: "pharma",
        icon: "🫀",
        headcount: 14,
        address: "4530 E Shea Blvd, Suite 220, Phoenix AZ 85028",
        contactPerson: "Maria — Office Manager",
        contactPhone: "(602) 555-0142",
        lastOrder: "Apr 18 — Thai from Bangkok Garden",
        orderFrequency: "2× monthly",
      },
      dietary: {
        vegetarian: 3,
        vegan: 1,
        glutenFree: 2,
        nutAllergy: 1,
        total: 14,
        flags: ["Dr. Patel — strict vegetarian", "Nurse Kim — celiac"],
      },
      budget: {
        perPerson: 15,
        total: 210,
        compliance: {
          physician: "Dr. Patel",
          ytdSpend: 68,
          threshold: 100,
          thisOrder: null,
        },
      },
      relationshipNotes: [
        {
          note: "Always call Maria before placing the order — she approves all rep lunches",
          date: "Mar 12",
          priority: "high",
        },
        {
          note: "Office prefers pickup over delivery. Parking lot entrance at rear.",
          date: "Feb 28",
          priority: "medium",
        },
        {
          note: "Dr. Patel likes variety — don't repeat within 3 weeks",
          date: "Jan 15",
          priority: "low",
        },
      ],
      recentOrders: [
        { date: "Apr 18", restaurant: "Bangkok Garden", cuisine: "Thai",          amount: "$198" },
        { date: "Apr 4",  restaurant: "Pita Jungle",    cuisine: "Mediterranean", amount: "$215" },
        { date: "Mar 21", restaurant: "Curry Corner",   cuisine: "Indian",        amount: "$204" },
      ],
      rewards: {
        balance: 12750,
        thisOrderEstimate: null,
        tier: "Gold",
        welcomeActive: true,
        welcomeDaysLeft: 18,
      },
    },
  },
  {
    role: "assistant",
    text: "Loading Dr. Patel's office profile…\n\n⚠️ **Heads up — call Maria at (602) 555-0142 first** — she approves all rep lunches.\n\nHere's what I know:\n• 14 people, $15/person budget ($210 total)\n• Dietary: 3 vegetarian, 1 vegan, 2 GF, 1 nut allergy\n• Recent: Thai (Apr 18), Mediterranean (Apr 4), Indian (Mar 21)\n\nAvoiding those three cuisines for variety. Let me find options…",
    contextUpdate: {
      variety: {
        avoid: ["Thai", "Mediterranean", "Indian"],
        suggested: ["BBQ", "Mexican", "American", "Japanese"],
        reason: "All three used within last 30 days",
      },
    },
  },
  {
    role: "user",
    text: "Also the Pfizer rep brought sushi last week. Something different and impressive.",
    contextUpdate: {
      competitorIntel: [
        { competitor: "Pfizer rep", brought: "Sushi", when: "Last week", office: "Dr. Patel's" },
      ],
      variety: {
        avoid: ["Thai", "Mediterranean", "Indian", "Sushi/Japanese"],
        suggested: ["BBQ", "Mexican", "American", "Farm-to-table"],
        reason: "Competitor brought sushi + 3 recent cuisines excluded",
      },
    },
  },
  {
    role: "assistant",
    text: "Got it — sushi is off the table too. That rules out Thai, Mediterranean, Indian, and Japanese.\n\nHere are 3 options that'll stand out:\n\n**🔥 Option 1: Flower Child** — Healthy bowls & salads\n$18.50/person · $259 total · 7X base = **3,626 Bites** with Welcome 2X (≈$36.26)\nDietary coverage: ✅ all 7 restrictions met\n⚠️ $1.50 over budget/head — want me to trim?\n\n**🌮 Option 2: Barrio Queen** — Upscale Mexican\n$14.80/person · $207 total · 6X base = **2,484 Bites** with Welcome 2X (≈$24.84)\nDietary coverage: ✅ all met\n✅ Under budget\n\n**🥩 Option 3: Bobby Q** — BBQ Platters\n$15.00/person · $210 total · 5X base = **2,100 Bites** with Welcome 2X (≈$21.00)\nDietary coverage: ⚠️ vegan option limited (1 side only)\n✅ On budget\n\nWhich one, or want me to adjust?",
    contextUpdate: {
      budget: {
        perPerson: 15,
        total: 210,
        compliance: {
          physician: "Dr. Patel",
          ytdSpend: 68,
          threshold: 100,
          thisOrder: 14.86,
          projected: 82.86,
        },
      },
      rewards: {
        balance: 12750,
        thisOrderEstimate: 2484,
        tier: "Gold",
        welcomeActive: true,
        welcomeDaysLeft: 18,
      },
      cartOptions: [
        { name: "Flower Child", pp: 18.5, total: 259, baseRate: 7, bites: 3626, dietary: "✅ Full",            overBudget: true  },
        { name: "Barrio Queen", pp: 14.8, total: 207, baseRate: 6, bites: 2484, dietary: "✅ Full",            overBudget: false },
        { name: "Bobby Q",      pp: 15.0, total: 210, baseRate: 5, bites: 2100, dietary: "⚠️ Limited vegan", overBudget: false },
      ],
    },
  },
  {
    role: "user",
    text: "Go with option 2. And add a note that Maria said the office loves churros.",
    contextUpdate: {
      selectedOption: "Barrio Queen",
      relationshipNotes: [
        {
          note: "Always call Maria before placing the order — she approves all rep lunches",
          date: "Mar 12",
          priority: "high",
        },
        {
          note: "Office loves churros — add as dessert when available",
          date: "Apr 27",
          priority: "medium",
        },
        {
          note: "Office prefers pickup over delivery. Parking lot entrance at rear.",
          date: "Feb 28",
          priority: "medium",
        },
        {
          note: "Dr. Patel likes variety — don't repeat within 3 weeks",
          date: "Jan 15",
          priority: "low",
        },
      ],
      budget: {
        perPerson: 14.8,
        total: 207,
        compliance: {
          physician: "Dr. Patel",
          ytdSpend: 68,
          threshold: 100,
          thisOrder: 14.79,
          projected: 82.79,
        },
      },
    },
  },
  {
    role: "assistant",
    text: "Done! Here's your order summary:\n\n**Barrio Queen — Upscale Mexican**\n14 people · $207 total ($14.80/pp)\nPickup at 4530 E Shea Blvd\n\n📋 Compliance: Dr. Patel's per-physician cost is $14.79. YTD total moves to $82.79 — safely under the $100 threshold.\n\n🎁 You'll earn **2,484 Bites** (≈$24.84 value) — base 6X doubled by your active Welcome 2X. Redeem to Amazon, restaurant credit at 1.4X, or future WeCater orders at 1.2X.\n\n📝 Note saved: \"Office loves churros\" added to Dr. Patel's profile.\n\nShall I finalize and route to Barrio Queen?",
    contextUpdate: {
      orderStatus: "ready_to_confirm",
    },
  },
];

export const CHAT_SUGGESTED_PROMPTS = [
  "Order for Dr. Patel's office",
  "Tuesday lunch, 20 people",
  "/weekly-standup",
  "What haven't we tried?",
];
