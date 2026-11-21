"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { LandingHeader } from "@/features/landing/components/landing-header";
import { SiteHeader } from "@/components/site-header";
import { SidebarProvider } from "@/components/ui/sidebar";

export function SiteShell({
  canManageCollections,
  defaultSidebarOpen,
  children,
}: {
  canManageCollections: boolean;
  defaultSidebarOpen: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();

  if (pathname === "/") {
    return (
      <>
        <LandingHeader />
        {children}
      </>
    );
  }

  return (
    <SidebarProvider defaultOpen={defaultSidebarOpen}>
      <AppSidebar canManageCollections={canManageCollections} />
      <div className="relative flex w-full flex-1 flex-col bg-background">
        <SiteHeader />
        {children}
      </div>
    </SidebarProvider>
  );
}
