import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Elite Football — Draft & Domineer",
  description:
    "Draai aan het rad, draft je droomelftal uit echte historische squads en kijk of je het seizoen ongeslagen door komt: 38-0-0.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#eafaf1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body className="min-h-full text-slate-800 antialiased">{children}</body>
    </html>
  );
}
