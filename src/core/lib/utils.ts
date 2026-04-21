import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(name: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * NOTE: `isAdminRole` TIDAK ada di sini.
 * Import dari `@/config` — satu source of truth (config-driven).
 *
 *   import { isAdminRole } from "@/config";
 */
