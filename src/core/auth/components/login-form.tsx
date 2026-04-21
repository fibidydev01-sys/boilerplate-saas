"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { HelpCircle } from "lucide-react";
import { appConfig, brandingConfig, type AuthProvider } from "@/config";
import { t } from "@/core/i18n";
import {
  EmailPasswordForm,
  OAuthButton,
  GoogleIcon,
  MagicLinkForm,
} from "./providers";

interface LoginFormProps {
  /**
   * returnTo param dari URL (biasanya di-set sama proxy middleware).
   * Di-forward ke semua provider component biar post-login redirect konsisten.
   */
  returnTo?: string | null;
}

/**
 * LoginForm — composer.
 *
 * Render provider yang enabled di `appConfig.auth.providers`. Urutan di array
 * = urutan render. Kalau ada lebih dari 1 provider, tampilin divider
 * "atau lanjut dengan" di antara primary (email/magic-link) & OAuth.
 *
 * Design:
 *   - Email & magic-link di-tab kalau keduanya enabled (biar gak tumpang).
 *   - OAuth buttons selalu di bawah divider.
 *   - Semua provider dapet `returnTo` yang sama.
 */
export function LoginForm({ returnTo }: LoginFormProps) {
  const providers = appConfig.auth.providers as readonly AuthProvider[];
  const hasEmail = providers.includes("email");
  const hasMagicLink = providers.includes("magic-link");
  const oauthProviders = providers.filter((p) =>
    isOAuthProvider(p)
  ) as readonly OAuthProviderName[];

  // Tab state — kalau email + magic-link keduanya ada, user bisa switch
  const [emailTab, setEmailTab] = useState<"password" | "magic">("password");
  const showEmailTabs = hasEmail && hasMagicLink;

  const hasPrimary = hasEmail || hasMagicLink;
  const hasOAuth = oauthProviders.length > 0;

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
            {brandingConfig.name}
          </CardTitle>
          <CardDescription className="text-base mt-1">
            {brandingConfig.description}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Primary: email / magic-link */}
        {hasPrimary && (
          <>
            {showEmailTabs && (
              <div className="flex rounded-lg border p-1 text-sm">
                <button
                  type="button"
                  onClick={() => setEmailTab("password")}
                  className={`flex-1 rounded-md px-3 py-1.5 font-medium transition ${
                    emailTab === "password"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t("auth.tabPassword")}
                </button>
                <button
                  type="button"
                  onClick={() => setEmailTab("magic")}
                  className={`flex-1 rounded-md px-3 py-1.5 font-medium transition ${
                    emailTab === "magic"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t("auth.tabMagicLink")}
                </button>
              </div>
            )}

            {hasEmail && (!showEmailTabs || emailTab === "password") && (
              <EmailPasswordForm returnTo={returnTo} />
            )}

            {hasMagicLink && (!showEmailTabs || emailTab === "magic") && (
              <MagicLinkForm returnTo={returnTo} />
            )}
          </>
        )}

        {/* Divider */}
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

        {/* OAuth buttons */}
        {hasOAuth && (
          <div className="space-y-2">
            {oauthProviders.map((provider) => {
              const config = oauthProviderConfig[provider];
              return (
                <OAuthButton
                  key={provider}
                  provider={provider}
                  label={t(config.labelKey)}
                  icon={config.icon}
                  returnTo={returnTo}
                />
              );
            })}
          </div>
        )}

        {/* Help text */}
        <div className="flex items-center justify-center gap-2 pt-2 text-sm text-muted-foreground">
          <HelpCircle className="h-4 w-4" />
          <p>
            {t("auth.forgotPassword")}{" "}
            <span className="font-medium text-foreground">
              {t("auth.contactAdmin")}
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ------------------------------------------------------------------
// OAuth provider registry
// ------------------------------------------------------------------

type OAuthProviderName = "google";

function isOAuthProvider(p: AuthProvider): p is OAuthProviderName {
  return p === "google";
}

const oauthProviderConfig: Record<
  OAuthProviderName,
  { labelKey: Parameters<typeof t>[0]; icon: React.ReactNode }
> = {
  google: {
    labelKey: "auth.signInWithGoogle",
    icon: <GoogleIcon />,
  },
};
