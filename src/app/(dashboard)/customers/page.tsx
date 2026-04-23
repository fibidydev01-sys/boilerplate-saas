"use client";

import { useTranslation } from "@/core/i18n";
import { CustomersTable } from "@/modules/commerce/components";

export default function CustomersPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {t("commerce.customers.pageTitle")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("commerce.customers.pageDescription")}
        </p>
      </div>
      <CustomersTable />
    </div>
  );
}