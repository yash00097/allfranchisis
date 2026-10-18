"use client";

import {
  Show,
  SignInButton,
  SignUpButton,
  useAuth,
  useClerk,
  useUser,
} from "@clerk/nextjs";
import { LogIn, PanelLeft, PanelLeftOpen, UserPlus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
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

export function AppSidebar({
  canManageCollections,
}: {
  canManageCollections: boolean;
}) {
  const pathname = usePathname();
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { openUserProfile } = useClerk();
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
                render={<Link href="/collections" />}
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
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map(({ href, label, icon: Icon }) => {
                  const active = isNavItemActive(pathname, href);
                  return (
                    <SidebarMenuItem key={href}>
                      <SidebarMenuButton
                        isActive={active}
                        aria-current={active ? "page" : undefined}
                        tooltip={label}
                        render={<Link href={href} />}
                        onClick={() => {
                          if (isMobile) setOpenMobile(false);
                        }}
                      >
                        <Icon />
                        <span>{label}</span>
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
        <Show when="signed-in">
          <div className="flex items-center gap-1 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-0">
            <SidebarMenu className="min-w-0 flex-1">
              <SidebarMenuItem>
                <SidebarMenuButton
                  size="lg"
                  tooltip="Open profile"
                  onClick={() => openUserProfile()}
                >
                  {user?.imageUrl ? (
                    <img
                      src={user.imageUrl}
                      alt=""
                      aria-hidden="true"
                      width={28}
                      height={28}
                      className="size-7 shrink-0 rounded-none bg-muted object-cover"
                    />
                  ) : (
                    <span className="size-7 shrink-0 rounded-none bg-muted" />
                  )}
                  <span className="truncate font-medium group-data-[collapsible=icon]:hidden">
                    {user?.fullName ??
                      user?.username ??
                      user?.firstName ??
                      "Account"}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
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
