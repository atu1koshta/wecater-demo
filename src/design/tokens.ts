/**
 * weCater design tokens
 * Single source of truth — extracted from prototype JSX files in /jsx.
 * Tailwind theme (tailwind.config.ts) is generated from this object,
 * and any inline-style edge cases can import T directly.
 */

export const T = {
  brand: {
    DEFAULT: "#E86A1A",
    dark: "#C4540F",
    light: "#FEF3EB",
    glow: "rgba(232, 106, 26, 0.18)",
  },

  surface: {
    base: "#FAFAF8",
    raised: "#FFFFFF",
    sunken: "#F4EFE8",
    border: "#EDE8E1",
    borderLight: "#F5F1EC",
    borderStrong: "#DDD6CB",
    overlay: "rgba(26, 23, 20, 0.55)",
  },

  text: {
    primary: "#1A1714",
    secondary: "#6B6560",
    tertiary: "#9C958E",
    inverse: "#FFFFFF",
  },

  status: {
    success: "#1B874B",
    successLight: "#EDFCF2",
    warning: "#D97B0B",
    warningLight: "#FFF8ED",
    danger: "#D1342F",
    dangerLight: "#FEF0F0",
    info: "#2563EB",
    infoLight: "#EFF5FF",
  },

  accent: {
    purple: "#7C3AED",
    purpleLight: "#F5F0FF",
    teal: "#0F766E",
    pink: "#DB2777",
  },

  // "Two lanes" framing on the wallet — desaturated grey for the company-pays
  // lane keeps it visually distinct from the brand-orange Bites lane.
  lane: {
    company: "#54595F",
    companyBg: "#F4F4F2",
  },

  // Restaurant brand colors used in cart-builder hero
  restaurants: {
    pitaJungle: "#1B3A2E",
    barrioQueen: "#7A1F2B",
    trueFood: "#3D5A2C",
    lalibela: "#5C2D2D",
  },

  font: {
    display: '"Outfit", system-ui, sans-serif',
    body: '"DM Sans", system-ui, sans-serif',
    mono: '"JetBrains Mono", ui-monospace, monospace',
  },

  radius: {
    sm: "6px",
    md: "8px",
    lg: "12px",
    xl: "14px",
    "2xl": "20px",
    pill: "999px",
  },

  shadow: {
    xs: "0 1px 2px rgba(26, 23, 20, 0.04)",
    sm: "0 1px 3px rgba(26, 23, 20, 0.06)",
    md: "0 4px 16px rgba(26, 23, 20, 0.08)",
    lg: "0 8px 28px rgba(26, 23, 20, 0.10)",
    brandGlow: "0 4px 20px rgba(232, 106, 26, 0.25)",
  },

  motion: {
    fast: "0.15s ease-out",
    base: "0.25s ease-out",
    slow: "0.4s ease-out",
  },
} as const;

export type Tokens = typeof T;
