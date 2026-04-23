"use client";

import { useTranslation } from "@/core/i18n";
import { SubscriptionsTable } from "@/modules/commerce/components";

export default function SubscriptionsPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {t("commerce.subscriptions.pageTitle")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("commerce.subscriptions.pageDescription")}
        </p>
      </div>
      <SubscriptionsTable />
    </div>
  );
}