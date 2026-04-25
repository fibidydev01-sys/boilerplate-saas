import { Clock, Zap } from "lucide-react";
import { brandingConfig } from "@/config";
import { problemContent } from "../../content/problem";

export function ProblemSection() {
  return (
    <section className="border-y border-border bg-muted/30 py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-14 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
            {problemContent.eyebrow}
          </p>
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            {problemContent.heading}
          </h2>
        </div>

        <div className="mx-auto max-w-2xl">
          <div className="mb-6 text-center text-sm uppercase tracking-widest text-muted-foreground">
            Without {brandingConfig.shortName}, you waste
          </div>

          <ul className="space-y-3">
            {problemContent.items.map((item, idx) => (
              <li
                key={idx}
                className="flex items-center gap-4 rounded-xl border border-border bg-background px-5 py-3.5 text-sm shadow-sm"
              >
                <Clock
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
                <span className="w-24 font-mono text-sm font-semibold tabular-nums text-primary">
                  {item.duration}
                </span>
                <span className="text-foreground">{item.label}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex items-center justify-center gap-4 text-muted-foreground">
            <div className="h-px w-16 bg-border" />
            <span className="text-2xl font-bold">=</span>
            <div className="h-px w-16 bg-border" />
          </div>

          <div className="mt-6 flex flex-col items-center justify-center gap-2 text-center">
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-bold tracking-tight md:text-6xl">
                {problemContent.conclusion.totalHours}
              </span>
              <span className="text-lg text-muted-foreground">
                {problemContent.conclusion.label}
              </span>
            </div>
            <span className="text-2xl font-semibold text-destructive">
              {problemContent.conclusion.aside}
            </span>
          </div>

          <div className="mt-10 flex items-center justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-medium text-primary">
              <Zap className="size-4" aria-hidden />
              There is an easier way
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
