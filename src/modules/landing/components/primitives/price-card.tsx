import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/core/lib/utils";
import { formatPrice } from "../../lib";
import type { PricingTier } from "../../types";
import { CheckItem } from "./check-item";

type PriceCardProps = {
  tier: PricingTier;
};

export function PriceCard({ tier }: PriceCardProps) {
  const isHighlighted = tier.highlighted;

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border bg-card p-8 transition-shadow",
        isHighlighted
          ? "border-primary shadow-lg ring-1 ring-primary/20"
          : "border-border shadow-sm",
      )}
    >
      {tier.badge ? (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge
            variant={isHighlighted ? "default" : "secondary"}
            className="px-3 py-1 text-xs font-medium"
          >
            {tier.badge}
          </Badge>
        </div>
      ) : null}

      <div className="mb-6">
        <h3 className="text-2xl font-semibold tracking-tight">{tier.name}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{tier.tagline}</p>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline gap-3">
          <span className="text-5xl font-bold tracking-tight">
            {formatPrice(tier.priceCents)}
          </span>
          {tier.originalPriceCents ? (
            <span className="text-xl text-muted-foreground line-through">
              {formatPrice(tier.originalPriceCents)}
            </span>
          ) : null}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{tier.footnote}</p>
      </div>

      <Button
        asChild
        size="lg"
        variant={isHighlighted ? "default" : "outline"}
        className="mb-8 w-full"
      >
        {tier.cta.external ? (
          <a
            href={tier.cta.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            {tier.cta.label}
          </a>
        ) : (
          <Link href={tier.cta.href}>{tier.cta.label}</Link>
        )}
      </Button>

      <ul className="space-y-3">
        {tier.features.map((feature, idx) => (
          <CheckItem key={idx}>{feature}</CheckItem>
        ))}
      </ul>
    </div>
  );
}
