import type { Priority } from "./common";

export type ChatRole = "user" | "assistant";

export type ContextActiveProfile = {
  name: string;
  type: "pharma" | "ea";
  icon: string;
  headcount: number;
  address: string;
  contactPerson: string;
  contactPhone: string;
  lastOrder: string;
  orderFrequency: string;
};

export type ContextDietary = {
  vegetarian: number;
  vegan: number;
  glutenFree: number;
  nutAllergy: number;
  total: number;
  flags: string[];
};

export type ContextCompliance = {
  physician: string;
  ytdSpend: number;
  threshold: number;
  thisOrder: number | null;
  projected?: number;
};

export type ContextBudget = {
  perPerson: number;
  total: number;
  compliance: ContextCompliance;
};

export type ContextRewards = {
  balance: number;
  thisOrderEstimate: number | null;
  tier: string;
  welcomeActive: boolean;
  welcomeDaysLeft: number;
};

export type ContextVariety = {
  avoid: string[];
  suggested: string[];
  reason: string;
};

export type ContextRelationshipNote = {
  note: string;
  date: string;
  priority: Priority;
};

export type ContextRecentOrder = {
  date: string;
  restaurant: string;
  cuisine: string;
  amount: string;
};

export type ContextCompetitorIntel = {
  competitor: string;
  brought: string;
  when: string;
  office: string;
};

export type ContextCartOption = {
  name: string;
  pp: number;
  total: number;
  baseRate: number;
  bites: number;
  dietary: string;
  overBudget: boolean;
};

export type OrderStatus = "ready_to_confirm" | "placed" | null;

/** The aggregate "context" that grows as the chatbot conversation progresses. */
export type OrderContext = {
  activeProfile?: ContextActiveProfile;
  dietary?: ContextDietary;
  budget?: ContextBudget;
  rewards?: ContextRewards;
  variety?: ContextVariety;
  competitorIntel?: ContextCompetitorIntel[];
  relationshipNotes?: ContextRelationshipNote[];
  recentOrders?: ContextRecentOrder[];
  cartOptions?: ContextCartOption[];
  selectedOption?: string;
  orderStatus?: OrderStatus;
};

export type ChatMessage = {
  role: ChatRole;
  text: string;
  /** Partial context patch applied to OrderContext when this message lands. */
  contextUpdate?: Partial<OrderContext>;
};
