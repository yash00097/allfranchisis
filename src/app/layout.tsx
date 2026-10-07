import {
  ClerkProvider,
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { shadcn } from "@clerk/ui/themes";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";
import { isCollectionManager } from "@/lib/auth/collection-manager";
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
  description:
    "Explore curated collections of movies, television, and animation.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { userId } = await auth();
  const canManageCollections = userId ? await isCollectionManager() : false;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <ClerkProvider appearance={{ theme: shadcn }}>
          <header className="relative z-20 flex items-center justify-between px-6 py-4">
            <a className="flex items-center gap-2 font-semibold" href="/collections">
              <Image
                src="/logo.svg"
                alt=""
                aria-hidden="true"
                width={28}
                height={28}
              />
              <span className="inline-flex">
                <span className="text-primary">All</span>
                <span>Franchisis</span>
              </span>
            </a>
            <nav className="flex items-center gap-4 text-sm">
              <a href="/collections">Collections</a>
              <ThemeToggle />
              <Show when="signed-out">
                <SignInButton mode="modal">
                  <button type="button">Sign in</button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button type="button">Sign up</button>
                </SignUpButton>
              </Show>
              <Show when="signed-in">
                {canManageCollections ? <a href="/dashboard">Dashboard</a> : null}
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
