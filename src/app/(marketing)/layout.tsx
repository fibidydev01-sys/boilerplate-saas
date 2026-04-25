import type { Metadata } from "next";
import { MarketingFooter, MarketingHeader } from "@/modules/landing";
import { brandingConfig } from "@/config";

export const metadata: Metadata = {
  title: {
    default: `${brandingConfig.name} — Multi-Tenant SaaS Boilerplate`,
    template: `%s — ${brandingConfig.name}`,
  },
  description: brandingConfig.description,
  openGraph: {
    type: "website",
    siteName: brandingConfig.name,
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
