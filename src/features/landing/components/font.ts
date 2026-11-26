import { Geist, Geist_Mono } from "next/font/google";

// Scoped to the landing page; the app shell keeps its own font stack.
export const landingFont = Geist({ subsets: ["latin"], display: "swap" });

// Numerals only (watch order positions, counts).
export const landingMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-landing-mono",
});
