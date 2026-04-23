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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { appConfig, brandingConfig } from "@/config";
import { ROUTES } from "@/core/constants";
import { t } from "@/core/i18n";
import {
  EmailPasswordForm,
  OAuthButton,
  MagicLinkForm,
  oauthProviderConfig,
} from "./providers";

interface LoginFormProps {
  /**
   * returnTo param dari URL (biasanya di-set sama proxy middleware).
   * Di-forward ke semua provider component biar post-login redirect konsisten.
   */
  returnTo?: string | null;

  /**
   * Error code dari callback redirect. Common values:
   *   - auth_callback_error       → OAuth/magic link exchange gagal
   *   - account_not_registered    → user ada di auth, profile tidak ada
   *   - account_deactivated       → profile exists tapi is_active=false
   */
  error?: string | null;
}

/**
 * LoginForm — composer.
 *
 * Render provider yang enabled di:
 *   - appConfig.auth.passwordProviders (email/password + magic link)
 *   - appConfig.auth.oauthProviders (google, dst)
 *
 * Nambah OAuth provider: edit appConfig.auth.oauthProviders +
 * register icon/label di oauth-config.tsx. Gak perlu touch file ini.
 */
export function LoginForm({ returnTo, error }: LoginFormProps) {
  const passwordProviders = appConfig.auth.passwordProviders;
  const oauthProviders = appConfig.auth.oauthProviders;

  const hasEmail = passwordProviders.includes("email");
  const hasMagicLink = passwordProviders.includes("magic-link");
  const hasPrimary = hasEmail || hasMagicLink;
  const hasOAuth = oauthProviders.length > 0;

  const [emailTab, setEmailTab] = useState<"password" | "magic">("password");
  const showEmailTabs = hasEmail && hasMagicLink;

  // Build register URL dengan returnTo forwarded
  const registerHref = useMemo(() => {
    if (!returnTo) return ROUTES.REGISTER;
    const params = new URLSearchParams({ returnTo });
    return `${ROUTES.REGISTER}?${params.toString()}`;
  }, [returnTo]);

  const callbackErrorMessage = resolveCallbackError(error);

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
        {/* Error dari callback redirect (deactivated, not_registered, dll) */}
        {callbackErrorMessage && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{callbackErrorMessage}</AlertDescription>
          </Alert>
        )}

        {/* Primary: email / magic-link */}
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
              <EmailPasswordForm returnTo={returnTo} />
            )}

            {hasMagicLink && (!showEmailTabs || emailTab === "magic") && (
              <MagicLinkForm returnTo={returnTo} mode="login" />
            )}
          </>
        )}

        {/* Forgot password link — only show for password flow */}
        {hasEmail && (!showEmailTabs || emailTab === "password") && (
          <div className="flex justify-end">
            <Link
              href={ROUTES.FORGOT_PASSWORD}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {t("auth.forgotPasswordLink")}
            </Link>
          </div>
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
                  label={t(config.loginLabelKey)}
                  icon={config.icon}
                  returnTo={returnTo}
                />
              );
            })}
          </div>
        )}

        {/* Sign up link */}
        {appConfig.auth.allowPublicSignup && (
          <div className="text-center text-sm text-muted-foreground pt-2">
            {t("auth.dontHaveAccount")}{" "}
            <Link
              href={registerHref}
              className="font-medium text-primary hover:underline"
            >
              {t("auth.signUpHere")}
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ------------------------------------------------------------------
// Error code → i18n message resolver
// ------------------------------------------------------------------

function resolveCallbackError(code: string | null | undefined): string | null {
  if (!code) return null;
  switch (code) {
    case "account_deactivated":
      return t("auth.accountDeactivated");
    case "account_not_registered":
      return t("auth.accountNotRegistered");
    case "auth_callback_error":
      return t("auth.callbackError");
    default:
      // Unknown error codes — fallback ke generic. Kalau mau lebih detail,
      // tambah case di sini.
      return t("auth.genericError");
  }
}