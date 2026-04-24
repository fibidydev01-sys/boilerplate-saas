"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { featuresContent } from "../../content/features";
import { FeatureBullet } from "../primitives";

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-28 lg:py-32">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-14 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
            {featuresContent.eyebrow}
          </p>
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            {featuresContent.heading}
          </h2>
        </div>

        <Tabs defaultValue={featuresContent.tabs[0]?.id} className="w-full">
          <TabsList className="mx-auto mb-12 flex h-auto w-full max-w-3xl flex-wrap justify-center gap-1 bg-muted/50 p-1">
            {featuresContent.tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="rounded-md px-4 py-2 text-sm"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {featuresContent.tabs.map((tab) => (
            <TabsContent
              key={tab.id}
              value={tab.id}
              className="mt-0 focus-visible:outline-none"
            >
              <div className="mx-auto max-w-4xl">
                <div className="mb-10 text-center">
                  <h3 className="mb-4 text-balance text-2xl font-bold tracking-tight sm:text-3xl">
                    {tab.heading}
                  </h3>
                  <p className="mx-auto max-w-2xl text-balance text-base leading-relaxed text-muted-foreground">
                    {tab.description}
                  </p>
                  {tab.stackBadges && tab.stackBadges.length > 0 ? (
                    <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                      {tab.stackBadges.map((badge) => (
                        <Badge key={badge} variant="outline">
                          {badge}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="grid gap-8 rounded-2xl border border-border bg-card p-8 sm:grid-cols-2">
                  {tab.bullets.map((bullet, idx) => (
                    <FeatureBullet key={idx} bullet={bullet} />
                  ))}
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}
