"use client";

import { BarChart3, Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/core/i18n";

export default function OverviewPage() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{t("overview.pageTitle")}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t("overview.pageSubtitle")}
        </p>
      </div>

      {/* Placeholder */}
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
            <BarChart3 className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="text-center space-y-1">
            <p className="font-semibold text-foreground">
              {t("overview.placeholderTitle")}
            </p>
            <p className="text-sm text-muted-foreground max-w-xs">
              {t("overview.placeholderMessage")}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
            <Construction className="h-3 w-3" />
            {t("common.comingSoon")}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
