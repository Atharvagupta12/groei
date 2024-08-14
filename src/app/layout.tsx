import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ConvexClerkProvider from "./providers/ConvexClerkProvider";


const inter = Inter({ subsets: ["latin"] });

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
    <html lang="en">
      <body className={inter.className}>
        <ConvexClerkProvider>{children}</ConvexClerkProvider> 
      </body>
    </html>
  );
}
