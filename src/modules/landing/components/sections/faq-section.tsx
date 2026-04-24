import { faqContent } from "../../content/faq";
import { FaqList } from "../primitives";

export function FaqSection() {
  return (
    <section id="faq" className="py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-4">
        <div className="mb-12 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
            {faqContent.eyebrow}
          </p>
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            {faqContent.heading}
          </h2>
        </div>

        <FaqList items={faqContent.items} />
      </div>
    </section>
  );
}
