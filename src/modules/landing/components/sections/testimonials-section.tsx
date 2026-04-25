import { brandingConfig } from "@/config";
import { testimonialsContent } from "../../content/testimonials";
import { interpolateBrand } from "../../lib";
import { TestimonialCard } from "../primitives";

export function TestimonialsSection() {
  const content = interpolateBrand(testimonialsContent, brandingConfig.name);

  return (
    <section className="bg-muted/30 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-14 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
            {content.eyebrow}
          </p>
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            {content.heading}
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {content.testimonials.map((testimonial, idx) => (
            <TestimonialCard key={idx} testimonial={testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
}
