import type { Priority } from "./common";

export type ProfileFlag =
  | "compliance_safe"
  | "compliance_warning"
  | "active_relationship"
  | "large_team"
  | "high_volume"
  | "new_relationship"
  | "incomplete_profile"
  | "dormant";

export type DietarySource = "explicit" | "implicit";

export type Physician = {
  name: string;
  npi: string;
  ytd: number;
  threshold: number;
};

export type ProfileContact = {
  name: string;
  role: string;
  phone: string;
};

export type DietaryPerson = {
  name: string;
  restriction: string;
  source: DietarySource;
  priority: Priority;
  learned: string;
};

export type DietaryBreakdown = {
  vegetarian: number;
  vegan: number;
  glutenFree: number;
  nutAllergy: number;
};

export type ProfileDietary = {
  total: number;
  breakdown: DietaryBreakdown;
  people: DietaryPerson[];
};

export type ProfileNote = {
  text: string;
  date: string;
  priority: Priority;
  pinned?: boolean;
};

export type LastOrder = {
  date: string;
  restaurant: string;
  cuisine: string;
  amount: number;
};

export type OrderHistoryItem = {
  date: string;
  restaurant: string;
  cuisine: string;
  amount: number;
  perPp: number;
};

export type CompetitorActivity = {
  rep: string;
  brought: string;
  date: string;
};

export type Profile = {
  id: string;
  name: string;
  icon: string;
  headcount: number;
  physicians: Physician[];
  address: string;
  contact: ProfileContact;
  frequency: string;
  lastOrder: LastOrder | null;
  nextScheduled: string | null;
  dietary: ProfileDietary;
  notes: ProfileNote[];
  history: OrderHistoryItem[];
  competitors: CompetitorActivity[];
  flags: ProfileFlag[];
};
