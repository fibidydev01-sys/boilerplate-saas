"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/core/auth/hooks";
import { brandingConfig } from "@/config";
import { cn } from "@/core/lib/utils";
import { headerContent } from "../../content/layout";

/**
 * Marketing header.
 *
 * Locale switcher intentionally NOT mounted here — the landing surface
 * (hero, features, pricing, FAQ, legal pages) is authored in English
 * and not wired to the i18n dictionary. Showing a language toggle that
 * doesn't actually translate the page is a worse UX than not showing
 * one at all.
 *
 * The switcher lives in two places where i18n IS wired:
 *   - Auth layout  (login, register, forgot/reset password)
 *   - Dashboard layout (post-auth app surface)
 *
 * If you decide to translate marketing later, add the switcher back
 * here AND register marketing copy in src/core/i18n/locales/.
 */
export function MarketingHeader() {
  const { user, isLoading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const cta = user ? headerContent.ctaLoggedIn : headerContent.ctaLoggedOut;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo — match dashboard header pattern (w-8 h-8 logoSmall + name) */}
        <Link href="/" className="flex items-center gap-2 text-lg font-bold">
          <div className="relative w-8 h-8">
            <Image
              src={brandingConfig.assets.logoSmall}
              alt={brandingConfig.shortName}
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="tracking-tight">{brandingConfig.name}</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {headerContent.navItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-3 md:flex">
          <Button
            asChild
            variant={user ? "default" : "outline"}
            size="sm"
            disabled={isLoading}
          >
            <Link href={cta.href}>{cta.label}</Link>
          </Button>
          {!user ? (
            <Button asChild size="sm">
              <Link href="/pricing">Get {brandingConfig.shortName}</Link>
            </Button>
          ) : null}
        </div>

        {/* Mobile toggle */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-sm">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <div className="relative w-6 h-6">
                  <Image
                    src={brandingConfig.assets.logoSmall}
                    alt={brandingConfig.shortName}
                    fill
                    className="object-contain"
                  />
                </div>
                <span>{brandingConfig.name}</span>
              </SheetTitle>
            </SheetHeader>
            <nav className="mt-8 flex flex-col gap-1">
              {headerContent.navItems.map((item) => (
                <MobileNavLink
                  key={item.href}
                  item={item}
                  onClick={() => setMobileOpen(false)}
                />
              ))}
              <div className="mt-6 flex flex-col gap-2 border-t border-border pt-6">
                <Button asChild variant="outline" className="w-full">
                  <Link href={cta.href} onClick={() => setMobileOpen(false)}>
                    {cta.label}
                  </Link>
                </Button>
                {!user ? (
                  <Button asChild className="w-full">
                    <Link href="/pricing" onClick={() => setMobileOpen(false)}>
                      Get {brandingConfig.shortName}
                    </Link>
                  </Button>
                ) : null}
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

function NavLink({
  item,
}: {
  item: (typeof headerContent.navItems)[number];
}) {
  const className = cn(
    "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
  );

  if (item.external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {item.label}
      </a>
    );
  }

  return (
    <Link href={item.href} className={className}>
      {item.label}
    </Link>
  );
}

function MobileNavLink({
  item,
  onClick,
}: {
  item: (typeof headerContent.navItems)[number];
  onClick: () => void;
}) {
  const className = cn(
    "rounded-md px-3 py-2 text-base font-medium text-foreground transition-colors hover:bg-muted",
  );

  if (item.external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
        className={className}
      >
        {item.label}
      </a>
    );
  }

  return (
    <Link href={item.href} onClick={onClick} className={className}>
      {item.label}
    </Link>
  );
}
