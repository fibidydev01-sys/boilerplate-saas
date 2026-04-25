import { redirect } from "next/navigation";
import { createClient } from "@/core/lib/supabase/server";
import { ForgotPasswordForm } from "@/core/auth";
import { fetchActiveProfile } from "@/core/auth/services";
import { resolvePostLoginRedirect } from "@/config";
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
    title: t("auth.forgotPasswordTitle", undefined, locale),
    description: t("auth.forgotPasswordSubtitle", undefined, locale),
  };
}

export default async function ForgotPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Kalau udah authenticated, gak perlu forgot password — redirect ke dashboard
  if (user) {
    const { profile } = await fetchActiveProfile(supabase, user.id);
    const dest = resolvePostLoginRedirect(profile?.role ?? undefined, null);
    redirect(dest);
  }

  return <ForgotPasswordForm />;
}
