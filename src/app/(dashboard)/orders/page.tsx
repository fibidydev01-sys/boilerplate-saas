"use client";

import { useTranslation } from "@/core/i18n";
import { OrdersTable } from "@/modules/commerce/components";

export default function OrdersPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("commerce.orders.pageTitle")}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("commerce.orders.pageDescription")}
        </p>
      </div>
      <OrdersTable />
    </div>
  );
}