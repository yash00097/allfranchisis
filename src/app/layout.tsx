import { ClerkProvider } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { shadcn } from "@clerk/ui/themes";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { SiteShell } from "@/components/site-shell";
import { isCollectionManager } from "@/lib/auth/collection-manager";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { userId } = await auth();
  const canManageCollections = userId ? await isCollectionManager() : false;
  const cookieStore = await cookies();
  const defaultSidebarOpen =
    cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <html lang="en" className="h-full antialiased">
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
