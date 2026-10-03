import {
  ClerkProvider,
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AllFranchisis",
  description: "Explore curated collections of movies, television, and animation.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <ClerkProvider appearance={{ theme: shadcn }}>
          <header className="flex items-center justify-between border-b px-6 py-4">
            <a className="font-semibold" href="/">
              AllFranchisis
            </a>
            <nav className="flex items-center gap-4 text-sm">
              <a href="/collections">Collections</a>
              <Show when="signed-out">
                <SignInButton mode="modal">
                  <button type="button">Sign in</button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button type="button">Sign up</button>
                </SignUpButton>
              </Show>
              <Show when="signed-in">
                <a href="/dashboard">Dashboard</a>
                <UserButton />
              </Show>
            </nav>
          </header>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
