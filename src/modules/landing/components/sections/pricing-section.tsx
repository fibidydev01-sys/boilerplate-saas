import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { brandingConfig } from "@/config";
import { pricingContent } from "../../content/pricing";
import { interpolateBrand } from "../../lib";
import { PriceCard } from "../primitives";

export function PricingSection() {
  const content = interpolateBrand(pricingContent, brandingConfig.name);

  return (
    <section id="pricing" className="py-20 md:py-28 lg:py-32">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-14 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
            {content.eyebrow}
          </p>
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            {content.heading}
          </h2>
          <div className="mt-5 flex justify-center">
            <Badge
              variant="secondary"
              className="inline-flex items-center gap-1.5 px-3 py-1"
            >
              <Sparkles className="size-3" aria-hidden />
              {content.launchDealBadge}
            </Badge>
          </div>
        </div>

        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          {content.tiers.map((tier) => (
            <PriceCard key={tier.id} tier={tier} />
          ))}
        </div>
      </div>
    </section>
  );
}
