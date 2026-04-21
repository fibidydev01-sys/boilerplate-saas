import {
  LayoutDashboard,
  BarChart3,
  User,
  Settings,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { ROUTES } from "@/core/constants";
import { t, type TranslationKey } from "@/core/i18n";

/**
 * NavItem config — titleKey adalah i18n key, bukan literal.
 * Label di-resolve saat render via `t(item.titleKey)`.
 */
export interface NavItem {
  titleKey: TranslationKey;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

export interface NavSection {
  titleKey?: TranslationKey;
  items: NavItem[];
}

export const mainNavItems: NavItem[] = [
  {
    titleKey: "navigation.dashboard",
    href: ROUTES.DASHBOARD,
    icon: LayoutDashboard,
  },
  {
    titleKey: "navigation.overview",
    href: ROUTES.OVERVIEW,
    icon: BarChart3,
  },
  {
    titleKey: "navigation.profile",
    href: ROUTES.PROFILE,
    icon: User,
  },
  {
    titleKey: "navigation.settings",
    href: ROUTES.SETTINGS,
    icon: Settings,
  },
];

export const adminNavItems: NavItem[] = [
  {
    titleKey: "navigation.admin",
    href: ROUTES.ADMIN,
    icon: ShieldCheck,
    adminOnly: true,
  },
];

export function getNavItems(isAdmin: boolean): NavSection[] {
  if (isAdmin) {
    return [
      { titleKey: "navigation.menu", items: mainNavItems },
      { titleKey: "navigation.administration", items: adminNavItems },
    ];
  }

  return [{ items: mainNavItems }];
}

export function getAllNavItems(isAdmin: boolean): NavItem[] {
  if (isAdmin) {
    return [...mainNavItems, ...adminNavItems];
  }
  return mainNavItems;
}

/**
 * Helper kalau butuh resolved label (misal untuk page title dinamis).
 */
export function getNavItemLabel(item: NavItem): string {
  return t(item.titleKey);
}
