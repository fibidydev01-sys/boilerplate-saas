import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/core/lib/utils";

type LaunchDealBannerProps = {
  label: string;
  href?: string;
  className?: string;
};

export function LaunchDealBanner({
  label,
  href = "/pricing",
  className,
}: LaunchDealBannerProps) {
  return (
    <div
      className={cn(
        "w-full border-b border-border bg-foreground text-background",
        className,
      )}
    >
      <Link
        href={href}
        className="group mx-auto flex h-10 max-w-7xl items-center justify-center gap-2 px-4 text-xs font-medium sm:text-sm"
      >
        <Sparkles className="size-3.5" aria-hidden />
        <span>{label}</span>
        <ArrowRight
          className="size-3.5 transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </Link>
    </div>
  );
}
