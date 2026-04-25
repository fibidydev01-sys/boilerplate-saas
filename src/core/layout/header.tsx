"use client";

import Link from "next/link";
import Image from "next/image";
import { UserMenu } from "./user-menu";
import { ROUTES } from "@/core/constants";
import { brandingConfig } from "@/config";

/**
 * Header — dipakai sebagai standalone header component.
 * Note: DashboardLayout punya inline header sendiri untuk kontrol yang lebih
 * fine-grained. Ini dipake untuk halaman di luar dashboard yang butuh header generic.
 *
 * Brand label uses `brandingConfig.name` (full) for visual consistency with
 * marketing/landing surfaces. PWA short_name remains controlled separately
 * via `brandingConfig.shortName` for install prompts.
 */
export function Header() {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4">
      <Link
        href={ROUTES.DASHBOARD}
        className="flex items-center gap-2 min-w-0"
      >
        <div className="relative w-8 h-8 flex-shrink-0">
          <Image
            src={brandingConfig.assets.logoSmall}
            alt={brandingConfig.name}
            fill
            className="object-contain"
          />
        </div>
        <span className="font-semibold text-sm md:text-base truncate">
          {brandingConfig.name}
        </span>
      </Link>

      <div className="flex-1" />

      <UserMenu />
    </header>
  );
}
