"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { appConfig, brandingConfig } from "@/config";
import { ROUTES } from "@/core/constants";
import { t } from "@/core/i18n";
import {
  EmailPasswordRegisterForm,
  MagicLinkForm,
  OAuthButton,
  oauthProviderConfig,
} from "./providers";

interface RegisterFormProps {
  returnTo?: string | null;
}

export function RegisterForm({ returnTo }: RegisterFormProps) {
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
      <CardHeader className="text-center space-y-4 pb-4">
        <div className="flex justify-center">
          <div className="relative w-24 h-24">
            <Image
              src={brandingConfig.assets.logo}
              alt={brandingConfig.name}
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
        <div>
          <CardTitle className="text-2xl font-bold">
            {t("auth.registerTitle")}
          </CardTitle>
          <CardDescription className="text-base mt-1">
            {t("auth.registerSubtitle")}
          </CardDescription>
        </div>
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