import { Check } from "lucide-react";
import { cn } from "@/core/lib/utils";

type TrustBadgeProps = {
  label: string;
  className?: string;
};

export function TrustBadge({ label, className }: TrustBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 text-sm text-muted-foreground",
        className,
      )}
    >
      <Check className="size-4 text-primary" strokeWidth={2.5} />
      <span>{label}</span>
    </div>
  );
}
