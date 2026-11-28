"use client";

import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
  useAuth,
} from "@clerk/nextjs";
import { Info, LogIn, PanelLeft, PanelLeftOpen, UserPlus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { isNavItemActive, visibleNavGroups } from "@/components/site-nav";

// Styles Clerk's trigger like a size="lg" SidebarMenuButton: avatar first, name truncated, icon-only when collapsed.
const USER_BUTTON_ELEMENTS = {
  rootBox: "min-w-0 flex-1 group-data-[collapsible=icon]:flex-none",
  userButtonTrigger:
    "h-12! w-full! justify-start! rounded-none! p-2! text-sidebar-foreground! transition-colors hover:bg-sidebar-accent! focus-visible:ring-2! focus-visible:ring-sidebar-ring! group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:justify-center! group-data-[collapsible=icon]:p-0!",
  userButtonBox: "w-full! flex-row-reverse! justify-end! gap-2!",
  userButtonOuterIdentifier:
    "truncate p-0! text-sm! font-medium! text-sidebar-foreground! group-data-[collapsible=icon]:hidden",
  avatarBox: "size-7! rounded-none!",
};

export function AppSidebar({
  canManageCollections,
}: {
  canManageCollections: boolean;
}) {
  const pathname = usePathname();
  const { isSignedIn } = useAuth();
  const { isMobile, setOpenMobile, toggleSidebar } = useSidebar();
  const groups = visibleNavGroups({
    signedIn: Boolean(isSignedIn),
    canManage: canManageCollections,
  });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-1">
          <SidebarMenu className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                tooltip="AllFranchisis"
                render={<Link href="/collections" prefetch />}
                onClick={() => {
                  if (isMobile) setOpenMobile(false);
                }}
              >
                <Image
                  src="/logo.svg"
                  alt=""
                  aria-hidden="true"
                  width={28}
                  height={28}
                  className="size-7 shrink-0"
                />
                <span className="inline-flex font-semibold">
                  <span className="text-primary">All</span>
                  <span>Franchisis</span>
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Collapse sidebar"
            onClick={toggleSidebar}
            className="shrink-0 group-data-[collapsible=icon]:hidden"
          >
            <PanelLeft />
          </Button>
          <button
            type="button"
            aria-label="Expand sidebar"
            onClick={toggleSidebar}
            className="group/collapse relative hidden size-8 shrink-0 items-center justify-center text-sidebar-foreground ring-sidebar-ring outline-hidden transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 group-data-[collapsible=icon]:flex"
          >
            <Image
              src="/logo.svg"
              alt=""
              aria-hidden="true"
              width={28}
              height={28}
              className="absolute inset-0 m-auto size-7 transition-opacity duration-200 group-hover/collapse:opacity-0 group-focus-visible/collapse:opacity-0"
            />
            <PanelLeftOpen className="absolute inset-0 m-auto size-4 opacity-0 transition-opacity duration-200 group-hover/collapse:opacity-100 group-focus-visible/collapse:opacity-100" />
          </button>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.label} className="not-first:pt-4">
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {group.items.map(({ href, label, icon: Icon, beta }) => {
                  const active = isNavItemActive(pathname, href);
                  return (
                    <SidebarMenuItem key={href}>
                      <SidebarMenuButton
                        isActive={active}
                        aria-current={active ? "page" : undefined}
                        tooltip={label}
                        render={<Link href={href} prefetch />}
                        onClick={() => {
                          if (isMobile) setOpenMobile(false);
                        }}
                      >
                        <Icon />
                        <span>{label}</span>
                        {beta ? (
                          <Badge
                            variant="outline"
                            className="ml-auto group-data-[collapsible=icon]:hidden"
                          >
                            Beta
                          </Badge>
                        ) : null}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="sm"
              isActive={isNavItemActive(pathname, "/about")}
              tooltip="About & Credits"
              className="text-sidebar-foreground/70"
              render={<Link href="/about" />}
              onClick={() => {
                if (isMobile) setOpenMobile(false);
              }}
            >
              <Info />
              <span>About & Credits</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <Show when="signed-in">
          <div className="flex items-center gap-1 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-0">
            {/* Clerk's popover carries "Manage account" and "Sign out". */}
            <UserButton
              showName
              appearance={{ elements: USER_BUTTON_ELEMENTS }}
            />
            <ThemeToggle />
          </div>
        </Show>
        <Show when="signed-out">
          <div className="flex flex-col gap-2 group-data-[collapsible=icon]:hidden">
            <SignInButton mode="modal">
              <Button type="button" variant="outline">
                Sign in
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button type="button">Sign up</Button>
            </SignUpButton>
          </div>
          <SidebarMenu className="hidden group-data-[collapsible=icon]:flex">
            <SidebarMenuItem>
              <SignInButton mode="modal">
                <SidebarMenuButton tooltip="Sign in">
                  <LogIn />
                  <span>Sign in</span>
                </SidebarMenuButton>
              </SignInButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SignUpButton mode="modal">
                <SidebarMenuButton tooltip="Sign up">
                  <UserPlus />
                  <span>Sign up</span>
                </SidebarMenuButton>
              </SignUpButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <div className="flex justify-end px-1 pb-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
            <ThemeToggle />
          </div>
        </Show>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
