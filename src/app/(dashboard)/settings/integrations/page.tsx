"use client";

import { Plug } from "lucide-react";
import { IntegrationPanel } from "@/modules/commerce";
import { useTranslation } from "@/core/i18n";

export default function IntegrationsPage() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Plug className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">
            {t("settings.integrationsTitle")}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t("settings.integrationsSubtitle")}
          </p>
        </div>
      </div>

      {/* Lemon Squeezy section */}
      <div className="max-w-2xl">
        <IntegrationPanel />
      </div>
    </div>
  );
}
