import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "weCater — Catering Rewards Demo",
  description:
    "B2B catering marketplace where reps earn personal Bites rewards while their company pays. Demo prototype.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#E86A1A",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-body bg-surface text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
