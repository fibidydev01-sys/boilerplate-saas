import Image from "next/image";
import { cn } from "@/core/lib/utils";
import type { Testimonial } from "../../types";

type TestimonialCardProps = {
  testimonial: Testimonial;
  className?: string;
};

export function TestimonialCard({
  testimonial,
  className,
}: TestimonialCardProps) {
  const { quote, author } = testimonial;

  return (
    <figure
      className={cn(
        "flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm",
        className,
      )}
    >
      <blockquote className="text-sm leading-relaxed text-foreground">
        &ldquo;{quote}&rdquo;
      </blockquote>
      <figcaption className="mt-auto flex items-center gap-3">
        <div className="relative size-10 overflow-hidden rounded-full bg-muted">
          <Image
            src={author.avatar}
            alt={author.name}
            fill
            sizes="40px"
            className="object-cover"
          />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold leading-tight">
            {author.name}
          </span>
          <span className="text-xs text-muted-foreground leading-tight">
            {author.role}
            {author.handle ? ` — ${author.handle}` : ""}
          </span>
        </div>
      </figcaption>
    </figure>
  );
}
