import { redirect } from "next/navigation";
import { createClient } from "@/core/lib/supabase/server";
import { RegisterForm } from "@/core/auth";
import { fetchActiveProfile } from "@/core/auth/services";
import {
  appConfig,
  resolvePostLoginRedirect,
} from "@/config";
import { ROUTES } from "@/core/constants";
import { t } from "@/core/i18n";
import { getServerLocale } from "@/core/i18n/get-locale";
import type { Metadata } from "next";

/**
 * Dynamic metadata — resolves locale from cookie at request time so the
 * browser tab title follows the user's selected language.
 */
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return {
    title: t("auth.registerTitle", undefined, locale),
    description: t("auth.registerSubtitle", undefined, locale),
  };
}

interface RegisterPageProps {
  searchParams: Promise<{ returnTo?: string }>;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  // Guard: kalau public signup disabled, redirect ke login
  if (!appConfig.auth.allowPublicSignup) {
    redirect(ROUTES.LOGIN);
  }

  const params = await searchParams;
  const returnTo = params.returnTo ?? null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Sudah authenticated → role-aware redirect
  if (user) {
    const { profile } = await fetchActiveProfile(supabase, user.id);
    const dest = resolvePostLoginRedirect(
      profile?.role ?? undefined,
      returnTo
    );
    redirect(dest);
  }

  return <RegisterForm returnTo={returnTo} />;
}
