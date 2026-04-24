import Link from "next/link";
import { brandingConfig } from "@/config";
import { Separator } from "@/components/ui/separator";
import { footerContent } from "../../content/layout";

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-10 md:grid-cols-4">
          {/* Brand column */}
          <div className="md:col-span-1">
            <Link
              href="/"
              className="flex items-center gap-2 text-lg font-bold"
            >
              <span className="inline-flex size-8 items-center justify-center rounded-lg bg-foreground text-background">
                <span className="text-sm">
                  {brandingConfig.name.charAt(0).toUpperCase()}
                </span>
              </span>
              <span className="tracking-tight">{brandingConfig.name}</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {footerContent.tagline}
            </p>
          </div>

          {/* Link columns */}
          {footerContent.columns.map((col) => (
            <div key={col.title}>
              <h4 className="mb-4 text-sm font-semibold tracking-wide text-foreground">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-10" />

        <div className="flex flex-col items-center justify-between gap-4 text-xs text-muted-foreground sm:flex-row">
          <p>
            © {footerContent.copyrightYear} {brandingConfig.name}. All rights
            reserved.
          </p>
          <div className="flex items-center gap-5">
            {footerContent.legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
