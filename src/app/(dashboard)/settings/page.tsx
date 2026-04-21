"use client";

import { Settings, Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { t } from "@/core/i18n";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{t("settings.pageTitle")}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t("settings.pageSubtitle")}
        </p>
      </div>

      {/* Placeholder */}
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
            <Settings className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="text-center space-y-1">
            <p className="font-semibold text-foreground">
              {t("settings.placeholderTitle")}
            </p>
            <p className="text-sm text-muted-foreground max-w-xs">
              {t("settings.placeholderMessage")}
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
