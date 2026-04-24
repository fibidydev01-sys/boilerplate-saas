import { cn } from "@/core/lib/utils";
import type { FeatureBullet as FeatureBulletType } from "../../types";

type FeatureBulletProps = {
  bullet: FeatureBulletType;
  className?: string;
};

export function FeatureBullet({ bullet, className }: FeatureBulletProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <h4 className="text-sm font-semibold leading-tight">{bullet.title}</h4>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {bullet.description}
      </p>
    </div>
  );
}
