"use client";

import Link from "next/link";
import { Settings, Plug, ChevronRight, Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/core/constants";
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

      {/* Available settings sections */}
      <div className="space-y-3">
        <SettingsLink
          href={ROUTES.SETTINGS_INTEGRATIONS}
          icon={Plug}
          title={t("settings.integrationsTitle")}
          description={t("settings.integrationsSubtitle")}
        />
      </div>

      {/* Placeholder for future settings */}
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-14 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
            <Settings className="h-7 w-7 text-muted-foreground" />
          </div>
          <div className="text-center space-y-1">
            <p className="font-semibold text-foreground text-sm">
              {t("settings.placeholderTitle")}
            </p>
            <p className="text-xs text-muted-foreground max-w-xs">
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

// --------------------------------------------------------------------
// Subcomponent
// --------------------------------------------------------------------

interface SettingsLinkProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

function SettingsLink({
  href,
  icon: Icon,
  title,
  description,
}: SettingsLinkProps) {
  return (
    <Link href={href} className="group block">
      <Card className="transition-all hover:shadow-md hover:border-primary/30">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 transition-colors group-hover:bg-primary/15">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">{title}</p>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {description}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform group-hover:translate-x-0.5" />
        </CardContent>
      </Card>
    </Link>
  );
}
