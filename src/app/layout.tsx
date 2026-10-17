import { ClerkProvider } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { shadcn } from "@clerk/ui/themes";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { SiteShell } from "@/components/site-shell";
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
  const cookieStore = await cookies();
  const defaultSidebarOpen =
    cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <ClerkProvider appearance={{ theme: shadcn }}>
          <SiteShell
            canManageCollections={canManageCollections}
            defaultSidebarOpen={defaultSidebarOpen}
          >
            {children}
          </SiteShell>
        </ClerkProvider>
      </body>
    </html>
  );
}
