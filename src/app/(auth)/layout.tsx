import Image from "next/image";
import Link from "next/link";
import { brandingConfig } from "@/config";

/**
 * Auth Layout — 50/50 split.
 *
 * Desktop (md+):
 *   ┌──────────────────────┬──────────────────────┐
 *   │  IMAGE PANEL (50%)   │  FORM PANEL (50%)    │
 *   │  + brand overlay     │                      │
 *   └──────────────────────┴──────────────────────┘
 *
 * Mobile (<md):
 *   Image panel hidden — form takes full width.
 *   Form pages render their own logo card on mobile (existing pattern).
 *
 * Branding:
 *   - Background image: brandingConfig.assets.authBackground
 *     Override via NEXT_PUBLIC_APP_AUTH_BG env var.
 *   - Brand overlay (logo + name + tagline) sits over the image with a
 *     subtle gradient for legibility.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* LEFT — Image panel (desktop only) */}
      <div className="relative hidden md:block">
        {/* Background image */}
        <Image
          src={brandingConfig.assets.authBackground}
          alt=""
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />

        {/* Dark gradient overlay — ensures brand text contrast */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/30 to-black/60"
        />

        {/* Brand overlay content */}
        <div className="relative z-10 flex h-full flex-col justify-between p-10 text-white">
          {/* Top — brand mark */}
          <Link
            href="/"
            className="flex items-center gap-3 group w-fit"
          >
            <div className="relative w-10 h-10 flex-shrink-0">
              <Image
                src={brandingConfig.assets.logo}
                alt={brandingConfig.name}
                fill
                className="object-contain drop-shadow-md"
              />
            </div>
            <span className="text-xl font-bold tracking-tight drop-shadow-md transition-opacity group-hover:opacity-90">
              {brandingConfig.name}
            </span>
          </Link>

          {/* Bottom — tagline + description */}
          <div className="space-y-3 max-w-md">
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight drop-shadow-md">
              {brandingConfig.tagline}
            </h2>
            <p className="text-base lg:text-lg text-white/90 leading-relaxed drop-shadow">
              {brandingConfig.description}
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT — Form panel */}
      <main className="flex items-center justify-center bg-background p-6 md:p-10">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
