/**
 * Initial order context. Populated by the user picking a profile in the
 * Profile Manager (or the chatbot on first turn). Many screens read from this.
 */

export type InitialOrderContext = {
  office: string;
  headcount: number;
  budgetPerPerson: number;
  budgetTotal: number;
  isSameDay: boolean;
  welcomeActive: boolean;
  physician: { name: string; ytd: number; threshold: number };
  recentCuisines: string[];
};

export const ORDER_CTX: InitialOrderContext = {
  office: "Dr. Patel's Cardiology",
  headcount: 14,
  budgetPerPerson: 15,
  budgetTotal: 210,
  isSameDay: false,
  welcomeActive: true,
  physician: { name: "Dr. Patel", ytd: 68, threshold: 100 },
  recentCuisines: ["Thai", "Mediterranean", "Indian"],
};

/** IRS de minimis cap for pharma rep meals to physicians. */
export const OPEN_PAYMENTS_THRESHOLD = 100;

/** Welcome bonus multiplier applied during the welcome window. */
export const WELCOME_MULTIPLIER = 2;
