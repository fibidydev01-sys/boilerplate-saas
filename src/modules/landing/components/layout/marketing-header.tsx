"use client";

import { useState } from "react";
import Link from "next/link";
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

export function MarketingHeader() {
  const { user, isLoading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const cta = user ? headerContent.ctaLoggedIn : headerContent.ctaLoggedOut;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-lg font-bold">
          <span className="inline-flex size-8 items-center justify-center rounded-lg bg-foreground text-background">
            <span className="text-sm">
              {brandingConfig.name.charAt(0).toUpperCase()}
            </span>
          </span>
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
              <SheetTitle>{brandingConfig.name}</SheetTitle>
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
