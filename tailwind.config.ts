import type { Config } from "tailwindcss";
import { T } from "./src/design/tokens";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: T.brand.DEFAULT,
          dark: T.brand.dark,
          light: T.brand.light,
        },
        surface: {
          DEFAULT: T.surface.base,
          raised: T.surface.raised,
          sunken: T.surface.sunken,
          border: T.surface.border,
          "border-light": T.surface.borderLight,
          "border-strong": T.surface.borderStrong,
        },
        ink: {
          DEFAULT: T.text.primary,
          secondary: T.text.secondary,
          tertiary: T.text.tertiary,
          inverse: T.text.inverse,
        },
        success: { DEFAULT: T.status.success, light: T.status.successLight },
        warning: { DEFAULT: T.status.warning, light: T.status.warningLight },
        danger:  { DEFAULT: T.status.danger,  light: T.status.dangerLight  },
        info:    { DEFAULT: T.status.info,    light: T.status.infoLight    },
        accent: {
          purple: T.accent.purple,
          "purple-light": T.accent.purpleLight,
          teal: T.accent.teal,
          pink: T.accent.pink,
        },
        lane: {
          company: T.lane.company,
          "company-bg": T.lane.companyBg,
        },
      },
      fontFamily: {
        display: ['"Outfit"', "system-ui", "sans-serif"],
        body: ['"DM Sans"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      borderRadius: {
        sm: T.radius.sm,
        md: T.radius.md,
        lg: T.radius.lg,
        xl: T.radius.xl,
        "2xl": T.radius["2xl"],
      },
      boxShadow: {
        xs: T.shadow.xs,
        sm: T.shadow.sm,
        md: T.shadow.md,
        lg: T.shadow.lg,
        brand: T.shadow.brandGlow,
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(12px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        cardIn: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        chipIn: {
          "0%": { opacity: "0", transform: "translateY(6px) scale(0.95)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(232, 106, 26, 0.4)" },
          "50%": { boxShadow: "0 0 0 8px rgba(232, 106, 26, 0)" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.25s ease-out",
        fadeInUp: "fadeInUp 0.35s ease-out",
        slideUp: "slideUp 0.3s ease-out",
        scaleIn: "scaleIn 0.25s ease-out",
        slideInRight: "slideInRight 0.4s ease-out",
        cardIn: "cardIn 0.4s ease-out backwards",
        chipIn: "chipIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) backwards",
        shimmer: "shimmer 1.6s linear infinite",
        pulseGlow: "pulseGlow 2s ease-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
