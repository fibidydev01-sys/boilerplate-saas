"use client";

import { Package } from "lucide-react";
import { ProductsGrid } from "@/modules/commerce";
import { useTranslation } from "@/core/i18n";

export default function ProductsPage() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Package className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">
            {t("commerce.pageTitle")}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t("commerce.pageSubtitle")}
          </p>
        </div>
      </div>

      <ProductsGrid />
    </div>
  );
}
