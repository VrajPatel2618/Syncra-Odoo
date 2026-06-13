import type { Metadata, Viewport } from "next";
import { DM_Sans, Libre_Baskerville } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm" });
const libre = Libre_Baskerville({ subsets: ["latin"], weight: "700", variable: "--font-libre" });

export const metadata: Metadata = {
  title: "Syncra ERP | Universal Systems Inc.",
  description: "Inventory + Manufacturing ERP built for Universal Systems Inc. — Hackathon 2026",
};

export const viewport: Viewport = {
  themeColor: "#9a3412",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${libre.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
