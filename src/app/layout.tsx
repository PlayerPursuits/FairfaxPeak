import type { Metadata } from "next";
import { Inter, Marcellus } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { EditModeBar } from "@/components/EditModeBar";
import { SITE_NAME } from "@/lib/constants";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const marcellus = Marcellus({ subsets: ["latin"], weight: "400", variable: "--font-marcellus", display: "swap" });

export const metadata: Metadata = {
  title: { default: `${SITE_NAME} — Local businesses, offers & community`, template: `%s · ${SITE_NAME}` },
  description: `Find and review local businesses, unlock special offers, and discover community events in ${SITE_NAME}.`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${marcellus.variable}`}>
      <body className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <EditModeBar />
      </body>
    </html>
  );
}
