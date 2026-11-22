import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import localFont from "next/font/local";
import { Toaster } from "@/components/ui/Toast";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const symbols = localFont({
  src: "./fonts/material-symbols-outlined.woff2",
  variable: "--font-symbols",
  display: "block",
  weight: "300 700",
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: "La Dentelle · Gastronomie & Street Food Algérienne",
    template: "%s · La Dentelle Alger",
  },
  description:
    "Haute gastronomie algérienne livrée à Alger : rechta, couscous constantinois, tajines, matlouh artisanal et pâtisseries de la Casbah. Paiement en espèces à la livraison.",
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  themeColor: "#f3fbf8",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${jakarta.variable} ${symbols.variable} scroll-smooth`} data-scroll-behavior="smooth">
      <body className="flex min-h-dvh flex-col">
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-on-primary"
        >
          Aller au contenu
        </a>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
