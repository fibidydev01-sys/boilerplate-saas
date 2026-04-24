import { testimonialsContent } from "../../content/testimonials";
import { TestimonialCard } from "../primitives";

export function TestimonialsSection() {
  return (
    <section className="bg-muted/30 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-14 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
            {testimonialsContent.eyebrow}
          </p>
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            {testimonialsContent.heading}
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {testimonialsContent.testimonials.map((testimonial, idx) => (
            <TestimonialCard key={idx} testimonial={testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
}
