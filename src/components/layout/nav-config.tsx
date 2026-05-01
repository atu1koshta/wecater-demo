import {
  UserSquare,
  MessageCircle,
  Sparkles,
  ShoppingBag,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  short: string;
  icon: LucideIcon;
  blurb: string;
};

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/profile",
    label: "Profile Manager",
    short: "Profiles",
    icon: UserSquare,
    blurb: "Office CRM, dietary memory, compliance",
  },
  {
    href: "/chat",
    label: "Chat Concierge",
    short: "Chat",
    icon: MessageCircle,
    blurb: "AI assistant with live context cards",
  },
  {
    href: "/optimizer",
    label: "Bites Optimizer",
    short: "Optimize",
    icon: Sparkles,
    blurb: "Rank restaurants by Smart / Max Bites",
  },
  {
    href: "/cart",
    label: "Cart Builder",
    short: "Cart",
    icon: ShoppingBag,
    blurb: "Compose orders, NL edits, per-person mods",
  },
  {
    href: "/wallet",
    label: "Bites Wallet",
    short: "Wallet",
    icon: Wallet,
    blurb: "Earn, redeem, track loyalty rewards",
  },
];
