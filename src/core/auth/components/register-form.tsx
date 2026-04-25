"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { appConfig } from "@/config";
import { ROUTES } from "@/core/constants";
import { useTranslation } from "@/core/i18n";
import {
  EmailPasswordRegisterForm,
  MagicLinkForm,
  OAuthButton,
  oauthProviderConfig,
} from "./providers";

interface RegisterFormProps {
  returnTo?: string | null;
}

/**
 * RegisterForm — composer.
 *
 * Brand identity (logo + name + description) ditampilkan di image panel
 * kiri (auth layout 50/50). Form card-nya keep page-specific title
 * ("Create account" / equivalent) yang relevant untuk konteks halaman.
 */
export function RegisterForm({ returnTo }: RegisterFormProps) {
  const { t } = useTranslation();
  const passwordProviders = appConfig.auth.passwordProviders;
  const oauthProviders = appConfig.auth.oauthProviders;

  const hasEmail = passwordProviders.includes("email");
  const hasMagicLink = passwordProviders.includes("magic-link");
  const hasPrimary = hasEmail || hasMagicLink;
  const hasOAuth = oauthProviders.length > 0;

  const [emailTab, setEmailTab] = useState<"password" | "magic">("password");
  const showEmailTabs = hasEmail && hasMagicLink;

  const loginHref = useMemo(() => {
    if (!returnTo) return ROUTES.LOGIN;
    const params = new URLSearchParams({ returnTo });
    return `${ROUTES.LOGIN}?${params.toString()}`;
  }, [returnTo]);

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="text-center space-y-2 pb-4">
        <CardTitle className="text-2xl font-bold">
          {t("auth.registerTitle")}
        </CardTitle>
        <CardDescription className="text-base">
          {t("auth.registerSubtitle")}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {hasPrimary && (
          <>
            {showEmailTabs && (
              <div className="flex rounded-lg border p-1 text-sm">
                <button
                  type="button"
                  onClick={() => setEmailTab("password")}
                  className={`flex-1 rounded-md px-3 py-1.5 font-medium transition ${emailTab === "password"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  {t("auth.tabPassword")}
                </button>
                <button
                  type="button"
                  onClick={() => setEmailTab("magic")}
                  className={`flex-1 rounded-md px-3 py-1.5 font-medium transition ${emailTab === "magic"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  {t("auth.tabMagicLink")}
                </button>
              </div>
            )}

            {hasEmail && (!showEmailTabs || emailTab === "password") && (
              <EmailPasswordRegisterForm returnTo={returnTo} />
            )}

            {hasMagicLink && (!showEmailTabs || emailTab === "magic") && (
              <MagicLinkForm returnTo={returnTo} mode="register" />
            )}
          </>
        )}

        {hasPrimary && hasOAuth && (
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                {t("auth.orContinueWith")}
              </span>
            </div>
          </div>
        )}

        {hasOAuth && (
          <div className="space-y-2">
            {oauthProviders.map((provider) => {
              const config = oauthProviderConfig[provider];
              return (
                <OAuthButton
                  key={provider}
                  provider={provider}
                  label={t(config.signupLabelKey)}
                  icon={config.icon}
                  returnTo={returnTo}
                />
              );
            })}
          </div>
        )}

        <div className="text-center text-sm text-muted-foreground pt-2">
          {t("auth.alreadyHaveAccount")}{" "}
          <Link
            href={loginHref}
            className="font-medium text-primary hover:underline"
          >
            {t("auth.signInHere")}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}