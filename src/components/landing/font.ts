import { Geist } from "next/font/google";

// Scoped to the landing page; the app shell keeps its own font stack.
export const landingFont = Geist({ subsets: ["latin"], display: "swap" });
