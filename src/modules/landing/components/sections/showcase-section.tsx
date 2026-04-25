import { Badge } from "@/components/ui/badge";
import { brandingConfig } from "@/config";
import { showcaseContent } from "../../content/showcase";
import { interpolateBrand } from "../../lib";

export function ShowcaseSection() {
  const content = interpolateBrand(showcaseContent, brandingConfig.name);

  return (
    <section id="showcase" className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-14 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
            {content.eyebrow}
          </p>
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            {content.heading}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-balance text-base text-muted-foreground">
            {content.description}
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {content.items.map((item, idx) => (
            <article
              key={idx}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-semibold tracking-tight">
                  {item.name}
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {item.category}
                </Badge>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {item.description}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {item.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
