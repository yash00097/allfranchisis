import {
  CheckCircle2,
  Clapperboard,
  Heart,
  LayoutDashboard,
  PlayCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavIcon = LucideIcon;

export interface NavItem {
  href: string;
  label: string;
  icon: NavIcon;
  requiresAuth: boolean;
  requiresManager: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Browse",
    items: [
      {
        href: "/collections",
        label: "Collections",
        icon: Clapperboard,
        requiresAuth: false,
        requiresManager: false,
      },
    ],
  },
  {
    label: "Your library",
    items: [
      {
        href: "/watching",
        label: "In Progress",
        icon: PlayCircle,
        requiresAuth: true,
        requiresManager: false,
      },
      {
        href: "/watched",
        label: "Completed",
        icon: CheckCircle2,
        requiresAuth: true,
        requiresManager: false,
      },
      {
        href: "/favorites",
        label: "Favorites",
        icon: Heart,
        requiresAuth: true,
        requiresManager: false,
      },
    ],
  },
  {
    label: "Manage",
    items: [
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        requiresAuth: true,
        requiresManager: true,
      },
    ],
  },
];

export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function visibleNavGroups({
  signedIn,
  canManage,
}: {
  signedIn: boolean;
  canManage: boolean;
}): NavGroup[] {
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) =>
        (!item.requiresAuth || signedIn) &&
        (!item.requiresManager || canManage),
    ),
  })).filter((group) => group.items.length > 0);
}
