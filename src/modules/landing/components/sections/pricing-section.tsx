import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { pricingContent } from "../../content/pricing";
import { PriceCard } from "../primitives";

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 md:py-28 lg:py-32">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-14 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
            {pricingContent.eyebrow}
          </p>
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            {pricingContent.heading}
          </h2>
          <div className="mt-5 flex justify-center">
            <Badge
              variant="secondary"
              className="inline-flex items-center gap-1.5 px-3 py-1"
            >
              <Sparkles className="size-3" aria-hidden />
              {pricingContent.launchDealBadge}
            </Badge>
          </div>
        </div>

        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          {pricingContent.tiers.map((tier) => (
            <PriceCard key={tier.id} tier={tier} />
          ))}
        </div>
      </div>
    </section>
  );
}
