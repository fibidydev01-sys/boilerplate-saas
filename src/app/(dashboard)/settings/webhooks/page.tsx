"use client";

import { useTranslation } from "@/core/i18n";
import { WebhookConfigPanel } from "@/modules/commerce/components";

export default function WebhookSettingsPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">
          {t("commerce.webhooks.pageTitle")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("commerce.webhooks.pageDescription")}
        </p>
      </div>
      <WebhookConfigPanel />
    </div>
  );
}