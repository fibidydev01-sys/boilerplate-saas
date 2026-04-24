import { Check } from "lucide-react";
import { cn } from "@/core/lib/utils";

type CheckItemProps = {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "muted";
};

export function CheckItem({
  children,
  className,
  variant = "default",
}: CheckItemProps) {
  return (
    <li
      className={cn(
        "flex items-start gap-3 text-sm",
        variant === "muted" && "text-muted-foreground",
        className,
      )}
    >
      <Check
        className={cn(
          "mt-0.5 size-4 shrink-0",
          variant === "default" ? "text-primary" : "text-muted-foreground",
        )}
        strokeWidth={2.5}
        aria-hidden
      />
      <span className="leading-relaxed">{children}</span>
    </li>
  );
}
