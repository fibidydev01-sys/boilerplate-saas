import Image from "next/image";
import { cn } from "@/core/lib/utils";

type AvatarStackProps = {
  avatars: Array<{ src: string; alt: string }>;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZE_MAP = {
  sm: "size-8",
  md: "size-10",
  lg: "size-12",
} as const;

const OVERLAP_MAP = {
  sm: "-ml-2",
  md: "-ml-3",
  lg: "-ml-3",
} as const;

export function AvatarStack({
  avatars,
  size = "md",
  className,
}: AvatarStackProps) {
  return (
    <div className={cn("flex items-center", className)}>
      {avatars.map((avatar, index) => (
        <div
          key={index}
          className={cn(
            "relative overflow-hidden rounded-full border-2 border-background bg-muted ring-0",
            SIZE_MAP[size],
            index > 0 && OVERLAP_MAP[size],
          )}
        >
          <Image
            src={avatar.src}
            alt={avatar.alt}
            fill
            sizes="48px"
            className="object-cover"
          />
        </div>
      ))}
    </div>
  );
}
