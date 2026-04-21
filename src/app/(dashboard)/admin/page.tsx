"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth, usePermission } from "@/core/auth/hooks";
import {
  ShieldCheck,
  Construction,
  Users,
  Database,
  Lock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FullPageLoader } from "@/core/components";
import { appConfig } from "@/config";
import { t, type TranslationKey } from "@/core/i18n";

export default function AdminPage() {
  const router = useRouter();
  const { user, hasFetched } = useAuth();
  const canAccessAdmin = usePermission("admin:access");

  useEffect(() => {
    if (hasFetched && !canAccessAdmin) {
      router.push(appConfig.auth.postLoginRedirect);
    }
  }, [hasFetched, canAccessAdmin, router]);

  if (!hasFetched) return <FullPageLoader text={t("common.loading")} />;
  if (!canAccessAdmin) return <FullPageLoader text={t("common.redirecting")} />;

  const adminMenus: Array<{
    titleKey: TranslationKey;
    descKey: TranslationKey;
    icon: typeof Users;
    color: string;
    bg: string;
  }> = [
    {
      titleKey: "admin.menu.usersTitle",
      descKey: "admin.menu.usersDesc",
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      titleKey: "admin.menu.masterDataTitle",
      descKey: "admin.menu.masterDataDesc",
      icon: Database,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      titleKey: "admin.menu.permissionsTitle",
      descKey: "admin.menu.permissionsDesc",
      icon: Lock,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
  ];

  // Role label — i18n-based dengan fallback humanize
  const roleLabel = (() => {
    if (!user?.role) return "";
    const key = `roles.${user.role}` as TranslationKey;
    const translated = t(key);
    return translated === key ? user.role.replace(/_/g, " ") : translated;
  })();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <ShieldCheck className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t("admin.pageTitle")}</h1>
          <p className="text-muted-foreground text-sm">
            {t("admin.pageSubtitle")}
          </p>
        </div>
      </div>

      {/* Admin info */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-2 text-sm text-foreground">
            <ShieldCheck className="h-4 w-4 flex-shrink-0 text-primary" />
            <span>
              {t("admin.loggedInAs", {
                name: user?.full_name ?? "",
                role: roleLabel,
              })}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Admin Menu Cards */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          {t("admin.menuTitle")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {adminMenus.map((menu) => {
            const Icon = menu.icon;
            return (
              <Card
                key={menu.titleKey}
                className="border hover:shadow-md transition-shadow cursor-pointer opacity-60"
              >
                <CardHeader className="pb-2">
                  <div
                    className={`w-10 h-10 rounded-xl ${menu.bg} flex items-center justify-center mb-2`}
                  >
                    <Icon className={`h-5 w-5 ${menu.color}`} />
                  </div>
                  <CardTitle className="text-sm font-semibold">
                    {t(menu.titleKey)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {t(menu.descKey)}
                  </p>
                  <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
                    <Construction className="h-3 w-3" />
                    {t("common.comingSoon")}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Placeholder notice */}
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-10 gap-3">
          <Construction className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            {t("admin.placeholderMessage")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
