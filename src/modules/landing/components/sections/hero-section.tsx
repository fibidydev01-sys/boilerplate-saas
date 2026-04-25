import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { brandingConfig } from "@/config";
import { heroContent } from "../../content/hero";
import { interpolateBrand } from "../../lib";
import { AvatarStack, TrustBadge } from "../primitives";

export function HeroSection() {
  // Interpolate {appName} placeholders → brandingConfig.name
  const content = interpolateBrand(heroContent, brandingConfig.name);

  return (
    <section className="relative overflow-hidden py-20 md:py-28 lg:py-32">
      {/* Soft radial accent */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.08),_transparent_60%)]"
      />

      <div className="mx-auto max-w-5xl px-4 text-center">
        {/* Launch deal badge */}
        <Badge
          variant="secondary"
          className="mb-6 inline-flex items-center gap-1.5 px-3 py-1 text-xs"
        >
          <Sparkles className="size-3" aria-hidden />
          {content.badge}
        </Badge>

        {/* Headline */}
        <h1 className="text-balance text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
          {content.headline.prefix}{" "}
          <span className="inline-block rounded-xl bg-primary/10 px-3 py-1 text-primary">
            {content.headline.highlight}
          </span>{" "}
          {content.headline.suffix}
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mt-6 max-w-2xl text-balance text-lg leading-relaxed text-muted-foreground">
          {content.subtitle}
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href={content.primaryCta.href}>
              {content.primaryCta.label}
              <ArrowRight className="ml-2 size-4" aria-hidden />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-full sm:w-auto"
          >
            {content.secondaryCta.external ? (
              <a
                href={content.secondaryCta.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {content.secondaryCta.label}
              </a>
            ) : (
              <Link href={content.secondaryCta.href}>
                {content.secondaryCta.label}
              </Link>
            )}
          </Button>
        </div>

        {/* Social proof row */}
        <div className="mt-12 flex flex-col items-center gap-6">
          <div className="flex items-center gap-4">
            <AvatarStack avatars={content.avatars} size="md" />
            <span className="text-sm text-muted-foreground">
              Loved by indie builders
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {content.trustBadges.map((badge) => (
              <TrustBadge key={badge.label} label={badge.label} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
