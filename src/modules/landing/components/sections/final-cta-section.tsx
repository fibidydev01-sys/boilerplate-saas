import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { brandingConfig } from "@/config";
import { finalCtaContent } from "../../content/layout";

export function FinalCtaSection() {
  return (
    <section className="relative overflow-hidden border-t border-border py-20 md:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom,_hsl(var(--primary)/0.1),_transparent_65%)]"
      />
      <div className="mx-auto max-w-3xl px-4 text-center">
        <div className="mb-6 inline-flex size-14 items-center justify-center rounded-2xl bg-foreground text-background">
          <span className="text-2xl font-bold">
            {brandingConfig.name.charAt(0).toUpperCase()}
          </span>
        </div>

        <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          {finalCtaContent.heading}
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-balance text-base leading-relaxed text-muted-foreground">
          {finalCtaContent.subtitle}
        </p>

        <div className="mt-10">
          <Button asChild size="lg">
            {finalCtaContent.cta.external ? (
              <a
                href={finalCtaContent.cta.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {finalCtaContent.cta.label}
                <ArrowRight className="ml-2 size-4" aria-hidden />
              </a>
            ) : (
              <Link href={finalCtaContent.cta.href}>
                {finalCtaContent.cta.label}
                <ArrowRight className="ml-2 size-4" aria-hidden />
              </Link>
            )}
          </Button>
        </div>
      </div>
    </section>
  );
}
