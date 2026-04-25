import { redirect } from "next/navigation";
import { createClient } from "@/core/lib/supabase/server";
import { LoginForm } from "@/core/auth";
import { fetchActiveProfile } from "@/core/auth/services";
import { brandingConfig, resolvePostLoginRedirect } from "@/config";
import { t } from "@/core/i18n";
import { getServerLocale } from "@/core/i18n/get-locale";
import type { Metadata } from "next";

/**
 * Dynamic metadata — resolves locale from cookie at request time so the
 * browser tab title follows the user's selected language. Replaces the
 * previous static `export const metadata` which would have been frozen
 * to appConfig.locale.default at module load.
 */
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return {
    title: t("common.login", undefined, locale),
    description: t(
      "dashboard.welcomeMessage",
      { appName: brandingConfig.name },
      locale
    ),
  };
}

interface LoginPageProps {
  searchParams: Promise<{ returnTo?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const returnTo = params.returnTo ?? null;
  const error = params.error ?? null;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Sudah authenticated → role-aware redirect (respect returnTo kalau ada).
  // CATATAN: kalau ada `error` query (mis. account_deactivated) TAPI session
  // masih ada, bersiin session dulu di callback route — jadi seharusnya gak
  // sampe sini dengan both session + error.
  if (user) {
    const { profile } = await fetchActiveProfile(supabase, user.id);
    const dest = resolvePostLoginRedirect(
      profile?.role ?? undefined,
      returnTo
    );
    redirect(dest);
  }

  return <LoginForm returnTo={returnTo} error={error} />;
}
