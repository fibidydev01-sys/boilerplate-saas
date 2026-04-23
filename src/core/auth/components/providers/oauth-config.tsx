"use client";

import type { OAuthProvider } from "@/config";
import type { TranslationKey } from "@/core/i18n";
import { GoogleIcon } from "./oauth-button";

/**
 * OAuth provider metadata registry — single source of truth untuk label
 * + icon tiap OAuth provider.
 *
 * Nambah provider baru (GitHub/Apple/dll):
 *   1. Tambah string di `appConfig.auth.oauthProviders` (di app.config.ts)
 *   2. Tambah entry di registry ini dengan icon + 2 label key (login/signup)
 *   3. Tambah translation keys di id.json + en.json
 *   4. Supabase dashboard → Auth → Providers → enable + configure credentials
 *
 * Gak perlu touch login-form.tsx / register-form.tsx.
 */

interface OAuthProviderMeta {
  loginLabelKey: TranslationKey;
  signupLabelKey: TranslationKey;
  icon: React.ReactNode;
}

export const oauthProviderConfig: Record<OAuthProvider, OAuthProviderMeta> = {
  google: {
    loginLabelKey: "auth.signInWithGoogle",
    signupLabelKey: "auth.signUpWithGoogle",
    icon: <GoogleIcon />,
  },
};

/**
 * Helper: resolve label key berdasarkan mode.
 */
export function getOAuthLabelKey(
  provider: OAuthProvider,
  mode: "login" | "signup"
): TranslationKey {
  const config = oauthProviderConfig[provider];
  return mode === "login" ? config.loginLabelKey : config.signupLabelKey;
}