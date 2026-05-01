import type { CartProfile, Persona } from "@/types";

/**
 * Cart-builder profiles keyed by persona. EA = internal Marketing Team scenario
 * (no compliance), Pharma = Dr. Patel's office (CMS Open Payments tracking).
 */
export const CART_PROFILES: Record<Persona, CartProfile> = {
  ea: {
    id: "marketing-team",
    name: "Marketing Team",
    label: "Director of Marketing",
    icon: "📋",
    headcount: 14,
    budgetPerPerson: 15,
    budgetTotal: 210,
    deliveryAddress: "100 W Washington St, Suite 1500",
    dietaryRestrictions: [
      {
        tag: "Vegetarian",
        count: 4,
        source: "told",
        individuals: ["Marcus K", "Priya R", "Jordan T", "Alex M"],
      },
      { tag: "Vegan", count: 1, source: "told", individuals: ["Maria C"] },
      { tag: "Tree nut allergy", count: 1, source: "told", individuals: ["Sarah W"] },
      { tag: "Gluten-free", count: 0, source: "learned" },
    ],
    complianceTracking: false,
    recentRestaurantsByCuisine: {
      Mediterranean: 12,
      Mexican: 4,
      Thai: 6,
    },
  },
  pharma: {
    id: "patel-cardiology",
    name: "Dr. Patel's Cardiology",
    label: "Pharma rep visit",
    icon: "🏥",
    headcount: 14,
    budgetPerPerson: 15,
    budgetTotal: 210,
    deliveryAddress: "4530 E Shea Blvd, Suite 200",
    dietaryRestrictions: [
      { tag: "Vegetarian", count: 3, source: "told" },
      { tag: "Halal", count: 2, source: "told" },
      { tag: "Gluten-free", count: 2, source: "told" },
    ],
    complianceTracking: true,
    physicians: [
      {
        name: "Dr. Patel",
        ytd: 68,
        threshold: 100,
        attending: true,
        perPersonCost: 14.5,
      },
      {
        name: "Dr. Morrison",
        ytd: 42,
        threshold: 100,
        attending: true,
        perPersonCost: 14.5,
      },
    ],
    recentRestaurantsByCuisine: {
      Mediterranean: 8,
      Italian: 3,
    },
  },
};
