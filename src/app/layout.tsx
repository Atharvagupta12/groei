import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";

import "./globals.css";
import ConvexClerkProvider from "@/providers/ConvexClerkProvider";
import AudioProvider from "@/providers/AudioProvider";
import { Toaster } from "@/components/ui/toaster";

const manrope = Manrope({ subsets: ["latin"], display: "swap" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Groei · Create AI podcasts in minutes",
    template: "%s · Groei",
  },
  description:
    "Groei turns your ideas into podcasts. Write or generate a script with AI, pick a voice, create cover art, and publish. Free.",
  applicationName: "Groei",
  keywords: ["AI podcast", "text to speech", "podcast generator", "AI voice", "Next.js", "Convex"],
  icons: { icon: "/icons/Logo.jpeg", apple: "/icons/Logo.jpeg" },
  openGraph: {
    type: "website",
    siteName: "Groei",
    title: "Groei · Create AI podcasts in minutes",
    description: "Turn ideas into podcasts with AI voices, AI-written scripts and AI cover art.",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#101114",
  colorScheme: "dark",
  viewportFit: "cover", // lets the mobile tab bar respect the iPhone home indicator

};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={manrope.className}>
        <ConvexClerkProvider>
          <AudioProvider>
            {children}
            <Toaster />
          </AudioProvider>
        </ConvexClerkProvider>
      </body>
    </html>
  );
}
