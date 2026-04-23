import { redirect } from "next/navigation";
import { createClient } from "@/core/lib/supabase/server";
import { ForgotPasswordForm } from "@/core/auth";
import { fetchActiveProfile } from "@/core/auth/services";
import { resolvePostLoginRedirect } from "@/config";
import { t } from "@/core/i18n";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: t("auth.forgotPasswordTitle"),
  description: t("auth.forgotPasswordSubtitle"),
};

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
