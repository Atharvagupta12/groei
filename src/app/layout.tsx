import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import ConvexClerkProvider from "./providers/ConvexClerkProvider";
import AudioProvider from "./providers/AudioProvider";


const manrope = Manrope({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Groei",
  description: "Generate your own Podcasts",
  icons: {
    icon: "icons/Logo.jpeg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
        <ConvexClerkProvider>
    <html lang="en">
      <AudioProvider>
         
      <body className={manrope.className}>
      {children}
      </body>
      </AudioProvider>
    </html>
    </ConvexClerkProvider> 
  );
}
