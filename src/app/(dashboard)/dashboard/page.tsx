"use client";

import { useAuthStore } from "@/core/auth/store";
import {
  LayoutDashboard,
  Users,
  Activity,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { brandingConfig } from "@/config";
import { useTranslation, type TranslationKey } from "@/core/i18n";

export default function DashboardPage() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 11) return t("dashboard.greetingMorning");
    if (hour < 15) return t("dashboard.greetingAfternoon");
    if (hour < 18) return t("dashboard.greetingEvening");
    return t("dashboard.greetingNight");
  };

  const quickInfo: Array<{
    titleKey: TranslationKey;
    descKey: TranslationKey;
    icon: typeof LayoutDashboard;
    color: string;
    bg: string;
  }> = [
      {
        titleKey: "dashboard.features.dashboardTitle",
        descKey: "dashboard.features.dashboardDesc",
        icon: LayoutDashboard,
        color: "text-green-600",
        bg: "bg-green-50",
      },
      {
        titleKey: "dashboard.features.usersTitle",
        descKey: "dashboard.features.usersDesc",
        icon: Users,
        color: "text-blue-600",
        bg: "bg-blue-50",
      },
      {
        titleKey: "dashboard.features.activityTitle",
        descKey: "dashboard.features.activityDesc",
        icon: Activity,
        color: "text-purple-600",
        bg: "bg-purple-50",
      },
      {
        titleKey: "dashboard.features.reportsTitle",
        descKey: "dashboard.features.reportsDesc",
        icon: TrendingUp,
        color: "text-orange-600",
        bg: "bg-orange-50",
      },
    ];

  // Role label — i18n-based dengan fallback humanize
  const roleLabel = (() => {
    if (!user?.role) return t("dashboard.anonymousUser");
    const key = `roles.${user.role}` as TranslationKey;
    const translated = t(key);
    return translated === key ? user.role.replace(/_/g, " ") : translated;
  })();

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-6 md:p-8 text-primary-foreground shadow-lg">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-primary-foreground/80 text-sm font-medium">
              {greeting()},
            </p>
            <h1 className="text-2xl md:text-3xl font-bold">
              {user?.full_name ?? t("dashboard.anonymousUser")}
            </h1>
            <p className="text-primary-foreground/80 text-sm mt-2">
              {t("dashboard.welcomeMessage", { appName: brandingConfig.name })}
            </p>
          </div>
          <div className="hidden md:flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <LayoutDashboard className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Role badge */}
        <div className="mt-4">
          <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white capitalize">
            {roleLabel}
          </span>
        </div>
      </div>

      {/* Quick Info Cards */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          {t("dashboard.featuresTitle")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickInfo.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.titleKey}
                className="border hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-2">
                  <div
                    className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center mb-2`}
                  >
                    <Icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                  <CardTitle className="text-sm font-semibold">
                    {t(item.titleKey)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {t(item.descKey)}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Info Box */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <LayoutDashboard className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {t("dashboard.underDevelopmentTitle")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("dashboard.underDevelopmentMessage", {
                  appName: brandingConfig.name,
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
