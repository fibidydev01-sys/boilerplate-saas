"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/core/lib/utils";
import { legalPageOrder, legalPages } from "../../content/legal";

export function LegalSidebar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Legal documents"
      className="sticky top-24 space-y-1 text-sm"
    >
      <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Legal
      </p>
      {legalPageOrder.map((slug) => {
        const page = legalPages[slug];
        if (!page) return null;

        const href = `/legal/${slug}`;
        const isActive = pathname === href;

        return (
          <Link
            key={slug}
            href={href}
            className={cn(
              "block rounded-md px-3 py-2 transition-colors",
              isActive
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
            )}
          >
            {page.title}
          </Link>
        );
      })}
    </nav>
  );
}
