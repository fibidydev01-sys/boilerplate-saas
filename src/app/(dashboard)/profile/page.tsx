"use client";

import { useAuthStore } from "@/core/auth/store";
import { User, Mail, Shield, Construction } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/core/lib/utils";
import { t, type TranslationKey } from "@/core/i18n";

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);

  if (!user) return null;

  // Role label — i18n-based dengan fallback humanize
  const roleLabel = (() => {
    const key = `roles.${user.role}` as TranslationKey;
    const translated = t(key);
    return translated === key ? user.role.replace(/_/g, " ") : translated;
  })();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{t("profile.pageTitle")}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t("profile.pageSubtitle")}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardContent className="flex flex-col items-center py-8 gap-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-xl bg-primary/10 text-primary font-semibold">
                {getInitials(user.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <p className="font-bold text-lg">{user.full_name}</p>
              <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-medium mt-1 capitalize">
                {roleLabel}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">
              {t("profile.accountInfoTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center border">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {t("profile.fullNameLabel")}
                </p>
                <p className="text-sm font-medium">{user.full_name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center border">
                <Shield className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {t("profile.roleLabel")}
                </p>
                <p className="text-sm font-medium capitalize">{roleLabel}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center border">
                <Mail className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {t("profile.statusLabel")}
                </p>
                <p className="text-sm font-medium">
                  {user.is_active ? (
                    <span className="text-green-600">{t("common.active")}</span>
                  ) : (
                    <span className="text-red-600">{t("common.inactive")}</span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Profile - Coming Soon */}
        <Card className="md:col-span-3 border-dashed">
          <CardContent className="flex items-center justify-center py-10 gap-3">
            <Construction className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {t("profile.editComingSoon")}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
