import { brandingConfig } from "@/config";
import { faqContent } from "../../content/faq";
import { interpolateBrand } from "../../lib";
import { FaqList } from "../primitives";

export function FaqSection() {
  const content = interpolateBrand(faqContent, brandingConfig.name);

  return (
    <section id="faq" className="py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-4">
        <div className="mb-12 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
            {content.eyebrow}
          </p>
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            {content.heading}
          </h2>
        </div>

        <FaqList items={content.items} />
      </div>
    </section>
  );
}
